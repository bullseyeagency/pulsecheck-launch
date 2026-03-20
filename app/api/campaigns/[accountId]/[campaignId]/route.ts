import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsApi } from 'google-ads-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; campaignId: string }> }
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

    const { accountId, campaignId } = await params;

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || 'LAST_30_DAYS';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Initialize Google Ads API client
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

    // Get account info
    const accountQuery = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      LIMIT 1
    `;

    const accountResults = await customer.query(accountQuery);
    const accountData = accountResults[0];

    // Get campaign details with comprehensive data
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.serving_status,
        campaign_budget.amount_micros,
        campaign_budget.delivery_method,
        campaign_budget.explicitly_shared,
        campaign_budget.total_amount_micros,
        campaign.advertising_channel_type,
        campaign.advertising_channel_sub_type,
        campaign.bidding_strategy_type,
        campaign.optimization_score,
        campaign.network_settings.target_google_search,
        campaign.network_settings.target_search_network,
        campaign.network_settings.target_content_network,
        campaign.network_settings.target_partner_search_network
      FROM campaign
      WHERE campaign.id = ${campaignId}
      LIMIT 1
    `;

    const campaignResults = await customer.query(campaignQuery);

    if (campaignResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaignData = campaignResults[0];

    // Get performance metrics with date segmentation
    let metricsDateCondition = '';
    if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
      const formattedStart = customStartDate.replace(/-/g, '');
      const formattedEnd = customEndDate.replace(/-/g, '');
      metricsDateCondition = `AND segments.date BETWEEN '${formattedStart}' AND '${formattedEnd}'`;
    } else {
      metricsDateCondition = `AND segments.date DURING ${dateRange}`;
    }

    const metricsQuery = `
      SELECT
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.cost_per_conversion,
        metrics.interactions,
        metrics.view_through_conversions,
        segments.date
      FROM campaign
      WHERE campaign.id = ${campaignId}
        ${metricsDateCondition}
      ORDER BY segments.date DESC
    `;

    const metricsResults = await customer.query(metricsQuery);

    // Aggregate metrics
    const totalMetrics = metricsResults.reduce(
      (acc: any, row: any) => ({
        impressions: acc.impressions + (row.metrics?.impressions || 0),
        clicks: acc.clicks + (row.metrics?.clicks || 0),
        cost: acc.cost + (Number(row.metrics?.cost_micros || 0) / 1_000_000),
        conversions: acc.conversions + (row.metrics?.conversions || 0),
        conversionsValue: acc.conversionsValue + (row.metrics?.conversions_value || 0),
        interactions: acc.interactions + (row.metrics?.interactions || 0),
        viewThroughConversions: acc.viewThroughConversions + (row.metrics?.view_through_conversions || 0),
      }),
      {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionsValue: 0,
        interactions: 0,
        viewThroughConversions: 0,
      }
    );

    // Calculate derived metrics
    const ctr = totalMetrics.impressions > 0 ? (totalMetrics.clicks / totalMetrics.impressions) * 100 : 0;
    const avgCpc = totalMetrics.clicks > 0 ? totalMetrics.cost / totalMetrics.clicks : 0;
    const avgCpm = totalMetrics.impressions > 0 ? (totalMetrics.cost / totalMetrics.impressions) * 1000 : 0;
    const conversionRate = totalMetrics.clicks > 0 ? (totalMetrics.conversions / totalMetrics.clicks) * 100 : 0;
    const costPerConversion = totalMetrics.conversions > 0 ? totalMetrics.cost / totalMetrics.conversions : 0;

    // Get ad groups for this campaign
    const adGroupsQuery = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        ad_group.cpc_bid_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group
      WHERE campaign.id = ${campaignId}
        ${metricsDateCondition}
    `;

    const adGroupsResults = await customer.query(adGroupsQuery);

    // Group ad groups by ID and aggregate metrics
    const adGroupsMap = new Map();
    adGroupsResults.forEach((row: any) => {
      const id = row.ad_group?.id?.toString() ?? '';
      if (!adGroupsMap.has(id)) {
        adGroupsMap.set(id, {
          id,
          name: row.ad_group?.name,
          status: row.ad_group?.status,
          type: row.ad_group?.type,
          cpcBid: Number(row.ad_group?.cpc_bid_micros || 0) / 1_000_000,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
        });
      }
      const adGroup = adGroupsMap.get(id);
      adGroup.impressions += row.metrics?.impressions || 0;
      adGroup.clicks += row.metrics?.clicks || 0;
      adGroup.cost += Number(row.metrics?.cost_micros || 0) / 1_000_000;
      adGroup.conversions += row.metrics?.conversions || 0;
    });

    const adGroups = Array.from(adGroupsMap.values());

    // Get keywords performance
    const keywordsQuery = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM keyword_view
      WHERE campaign.id = ${campaignId}
        AND ad_group_criterion.type = 'KEYWORD'
        ${metricsDateCondition}
    `;

    const keywordsResults = await customer.query(keywordsQuery);

    // Group keywords by criterion ID and aggregate metrics
    const keywordsMap = new Map();
    keywordsResults.forEach((row: any) => {
      const id = row.ad_group_criterion?.criterion_id?.toString() ?? '';
      if (!keywordsMap.has(id)) {
        keywordsMap.set(id, {
          id,
          adGroupId: row.ad_group?.id?.toString() ?? '',
          adGroupName: row.ad_group?.name,
          text: row.ad_group_criterion.keyword?.text || '',
          matchType: row.ad_group_criterion.keyword?.match_type || 'UNKNOWN',
          qualityScore: row.ad_group_criterion.quality_info?.quality_score || null,
          status: row.ad_group_criterion.status,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionsValue: 0,
        });
      }
      const keyword = keywordsMap.get(id);
      keyword.impressions += row.metrics?.impressions || 0;
      keyword.clicks += row.metrics?.clicks || 0;
      keyword.cost += Number(row.metrics?.cost_micros || 0) / 1_000_000;
      keyword.conversions += row.metrics?.conversions || 0;
      keyword.conversionsValue += row.metrics?.conversions_value || 0;
    });

    const keywords = Array.from(keywordsMap.values());

    // Get search terms (actual queries)
    const searchTermsQuery = `
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        ad_group.id,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE campaign.id = ${campaignId}
        ${metricsDateCondition}
      ORDER BY metrics.conversions DESC, metrics.clicks DESC
      LIMIT 100
    `;

    const searchTermsResults = await customer.query(searchTermsQuery);

    const searchTerms = searchTermsResults.map((row: any) => ({
      searchTerm: row.search_term_view?.search_term,
      status: row.search_term_view?.status,
      adGroupId: row.ad_group?.id?.toString() ?? '',
      adGroupName: row.ad_group?.name,
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
    }));

    // Get performance by device
    const deviceQuery = `
      SELECT
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE campaign.id = ${campaignId}
        ${metricsDateCondition}
    `;

    const deviceResults = await customer.query(deviceQuery);
    const devicePerformance = deviceResults.reduce((acc: any, row: any) => {
      const device = row.segments.device;
      if (!acc[device]) {
        acc[device] = {
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
        };
      }
      acc[device].impressions += row.metrics?.impressions || 0;
      acc[device].clicks += row.metrics?.clicks || 0;
      acc[device].cost += Number(row.metrics?.cost_micros || 0) / 1_000_000;
      acc[device].conversions += row.metrics?.conversions || 0;
      return acc;
    }, {});

    // Format chart data (daily performance)
    const chartData = metricsResults.map((row: any) => ({
      date: row.segments.date,
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
    })).reverse(); // Reverse to show oldest to newest

    // Format dates (YYYYMMDD to YYYY-MM-DD)
    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr.length !== 8) return null;
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    };

    return NextResponse.json({
      success: true,
      account: {
        id: accountData.customer?.id?.toString() ?? '',
        name: accountData.customer?.descriptive_name,
        currency: accountData.customer?.currency_code,
        timeZone: accountData.customer?.time_zone,
      },
      campaign: {
        id: campaignData.campaign?.id?.toString() ?? '',
        name: campaignData.campaign?.name,
        status: campaignData.campaign?.status,
        servingStatus: campaignData.campaign?.serving_status,
        budget: Number(campaignData.campaign_budget?.amount_micros || 0) / 1_000_000,
        totalBudget: Number(campaignData.campaign_budget?.total_amount_micros || 0) / 1_000_000,
        budgetType: campaignData.campaign_budget?.delivery_method || 'STANDARD',
        isSharedBudget: campaignData.campaign_budget?.explicitly_shared || false,
        startDate: null,
        endDate: null,
        advertisingChannelType: campaignData.campaign?.advertising_channel_type,
        advertisingChannelSubType: campaignData.campaign?.advertising_channel_sub_type,
        biddingStrategy: campaignData.campaign?.bidding_strategy_type,
        urlExpansionOptOut: false,
        optimizationScore: campaignData.campaign?.optimization_score,
        networkSettings: {
          targetGoogleSearch: campaignData.campaign?.network_settings?.target_google_search,
          targetSearchNetwork: campaignData.campaign?.network_settings?.target_search_network,
          targetContentNetwork: campaignData.campaign?.network_settings?.target_content_network,
          targetPartnerSearchNetwork: campaignData.campaign?.network_settings?.target_partner_search_network,
        },
      },
      metrics: {
        ...totalMetrics,
        ctr,
        avgCpc,
        avgCpm,
        conversionRate,
        costPerConversion,
      },
      adGroups,
      keywords,
      searchTerms,
      devicePerformance,
      chartData,
    });
  } catch (error: any) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch campaign details',
      },
      { status: 500 }
    );
  }
}
