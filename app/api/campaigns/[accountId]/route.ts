import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsApi } from 'google-ads-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user with organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Get Google Ads connection for this organization
    const connection = await prisma.googleAdsConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No Google Ads account connected' },
        { status: 404 }
      );
    }

    const { accountId } = await params;
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'LAST_30_DAYS';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    // Get customer with manager ID for access
    const customer = client.Customer({
      customer_id: accountId,
      login_customer_id: connection.customerId,
      refresh_token: connection.refreshToken,
    });

    // Get account info
    const accountQuery = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code
      FROM customer
      LIMIT 1
    `;

    const accountResults = await customer.query(accountQuery);
    const accountData = accountResults[0];

    if (!accountData?.customer) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Build date filter
    let dateFilter = '';
    if (dateRange === 'CUSTOM' && startDate && endDate) {
      // Format: YYYY-MM-DD to YYYYMMDD
      const formattedStart = startDate.replace(/-/g, '');
      const formattedEnd = endDate.replace(/-/g, '');
      dateFilter = `segments.date BETWEEN '${formattedStart}' AND '${formattedEnd}'`;
    } else {
      dateFilter = `segments.date DURING ${dateRange}`;
    }

    // Get campaigns with metrics for selected period
    const campaignsQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE ${dateFilter}
    `;

    const campaignResults = await customer.query(campaignsQuery);

    // Aggregate metrics by campaign
    const campaignMap = new Map();

    campaignResults.forEach((row: any) => {
      const id = row.campaign.id.toString();
      if (!campaignMap.has(id)) {
        campaignMap.set(id, {
          id,
          name: row.campaign.name,
          status: row.campaign.status,
          budget: Number(row.campaign_budget?.amount_micros || 0) / 1_000_000,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
        });
      }

      const campaign = campaignMap.get(id);
      campaign.impressions += Number(row.metrics?.impressions || 0);
      campaign.clicks += Number(row.metrics?.clicks || 0);
      campaign.cost += Number(row.metrics?.cost_micros || 0) / 1_000_000;
      campaign.conversions += Number(row.metrics?.conversions || 0);
    });

    const campaigns = Array.from(campaignMap.values());

    return NextResponse.json({
      success: true,
      account: {
        id: accountData.customer.id?.toString() ?? '',
        name: accountData.customer.descriptive_name ?? '',
        currency: accountData.customer.currency_code ?? '',
      },
      campaigns,
    });
  } catch (error: any) {
    console.error('Error fetching account data:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch account data',
        details: error.errors || error,
      },
      { status: 500 }
    );
  }
}
