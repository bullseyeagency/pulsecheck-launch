import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, platform = 'google', location_code = 2840 } = body as {
      keyword: string;
      platform?: string;
      location_code?: number;
    };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const commonPayload = [
      {
        keyword: keyword.trim(),
        platform,
        location_code,
        language_code: 'en',
      },
    ];

    const headers = {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    };

    const [topPagesRes, topDomainsRes, aggregatedRes] = await Promise.all([
      fetch(
        'https://api.dataforseo.com/v3/ai_optimization/llm_mentions/top_pages/live',
        { method: 'POST', headers, body: JSON.stringify(commonPayload) }
      ),
      fetch(
        'https://api.dataforseo.com/v3/ai_optimization/llm_mentions/top_domains/live',
        { method: 'POST', headers, body: JSON.stringify(commonPayload) }
      ),
      fetch(
        'https://api.dataforseo.com/v3/ai_optimization/llm_mentions/aggregated_metrics/live',
        { method: 'POST', headers, body: JSON.stringify(commonPayload) }
      ),
    ]);

    console.log('DataForSEO analytics response statuses:', topPagesRes.status, topDomainsRes.status, aggregatedRes.status);

    const [topPagesData, topDomainsData, aggregatedData] = await Promise.all([
      topPagesRes.json(),
      topDomainsRes.json(),
      aggregatedRes.json(),
    ]);

    const topPages = topPagesData.tasks?.[0]?.result || [];
    const topDomains = topDomainsData.tasks?.[0]?.result || [];
    const aggregated = aggregatedData.tasks?.[0]?.result || [];

    return NextResponse.json({
      topPages,
      topDomains,
      aggregated,
    });
  } catch (error: any) {
    console.error('Error fetching mentions analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mentions analytics' },
      { status: 500 }
    );
  }
}
