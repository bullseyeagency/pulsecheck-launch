import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsApi } from 'google-ads-api';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const connection = await prisma.googleAdsConnection.findFirst({
      where: { organizationId: user.organizationId, isActive: true },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Google Ads account connected' }, { status: 404 });
    }

    const body = await request.json();
    const { accountId, keywords, days = 180 } = body as {
      accountId: string;
      keywords: string[];
      days?: number;
    };

    if (!accountId || !keywords?.length) {
      return NextResponse.json({ error: 'accountId and keywords are required' }, { status: 400 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    const startDateStr = fmt(startDate);
    const endDateStr = fmt(endDate);

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    const customer = client.Customer({
      customer_id: accountId,
      login_customer_id: connection.customerId,
      refresh_token: connection.refreshToken,
    });

    // Build IN clause — escape single quotes in keyword text
    const keywordList = keywords
      .map((k) => `'${k.replace(/'/g, "\\'")}'`)
      .join(', ');

    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        segments.date
      FROM keyword_view
      WHERE ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.keyword.text IN (${keywordList})
        AND segments.date BETWEEN '${startDateStr}' AND '${endDateStr}'
      ORDER BY segments.date ASC
    `;

    const results = await customer.query(query);

    // Group by keyword text → array of daily data points
    const data: Record<string, Array<{
      date: string;
      clicks: number;
      impressions: number;
      ctr: number;
      cost: number;
      conversions: number;
    }>> = {};

    // Initialise keys so every requested keyword is present even if no data
    for (const kw of keywords) {
      data[kw] = [];
    }

    for (const row of results) {
      const text: string = (row as any).ad_group_criterion?.keyword?.text ?? '';
      if (!text || !data[text]) continue;

      const rawDate: string = (row as any).segments?.date ?? '';
      // Normalise YYYYMMDD → YYYY-MM-DD
      const date =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate;

      data[text].push({
        date,
        clicks: (row as any).metrics?.clicks ?? 0,
        impressions: (row as any).metrics?.impressions ?? 0,
        ctr: (row as any).metrics?.ctr ?? 0,
        cost: Number((row as any).metrics?.cost_micros ?? 0) / 1_000_000,
        conversions: (row as any).metrics?.conversions ?? 0,
      });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching keyword performance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keyword performance' },
      { status: 500 }
    );
  }
}
