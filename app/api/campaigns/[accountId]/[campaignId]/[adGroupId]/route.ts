import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsApi } from 'google-ads-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; campaignId: string; adGroupId: string }> }
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

    const { accountId, campaignId, adGroupId } = await params;

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

    // Build date filter
    let metricsDateCondition = '';
    if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
      const formattedStart = customStartDate.replace(/-/g, '');
      const formattedEnd = customEndDate.replace(/-/g, '');
      metricsDateCondition = `AND segments.date BETWEEN '${formattedStart}' AND '${formattedEnd}'`;
    } else {
      metricsDateCondition = `AND segments.date DURING ${dateRange}`;
    }

    // Get ad group details
    const adGroupQuery = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        ad_group.cpc_bid_micros,
        ad_group.cpm_bid_micros,
        ad_group.target_cpa_micros,
        ad_group.target_roas,
        ad_group.targeting_setting.target_restrictions,
        campaign.id,
        campaign.name,
        campaign.status
      FROM ad_group
      WHERE ad_group.id = ${adGroupId}
      LIMIT 1
    `;

    const adGroupResults = await customer.query(adGroupQuery);

    if (adGroupResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ad group not found' },
        { status: 404 }
      );
    }

    const adGroupData = adGroupResults[0];

    if (!adGroupData.ad_group) {
      return NextResponse.json(
        { success: false, error: 'Ad group data not found' },
        { status: 404 }
      );
    }

    // Get performance metrics
    const metricsQuery = `
      SELECT
        ad_group.id,
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
      FROM ad_group
      WHERE ad_group.id = ${adGroupId}
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

    // Get keywords for this ad group
    const keywordsQuery = `
      SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.status,
        ad_group_criterion.final_urls,
        ad_group_criterion.cpc_bid_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM keyword_view
      WHERE ad_group.id = ${adGroupId}
        AND ad_group_criterion.type = 'KEYWORD'
        ${metricsDateCondition}
    `;

    const keywordsResults = await customer.query(keywordsQuery);

    // Group keywords by criterion ID and aggregate metrics
    const keywordsMap = new Map();
    keywordsResults.forEach((row: any) => {
      const id = row.ad_group_criterion.criterion_id.toString();
      if (!keywordsMap.has(id)) {
        keywordsMap.set(id, {
          id,
          text: row.ad_group_criterion.keyword?.text || '',
          matchType: row.ad_group_criterion.keyword?.match_type || 'UNKNOWN',
          qualityScore: row.ad_group_criterion.quality_info?.quality_score || null,
          status: row.ad_group_criterion.status,
          finalUrls: row.ad_group_criterion.final_urls || [],
          cpcBid: Number(row.ad_group_criterion.cpc_bid_micros || 0) / 1_000_000,
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

    // Get ads in this ad group
    const adsQuery = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.status,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.responsive_search_ad.path1,
        ad_group_ad.ad.responsive_search_ad.path2,
        ad_group_ad.policy_summary.approval_status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad
      WHERE ad_group.id = ${adGroupId}
        ${metricsDateCondition}
    `;

    const adsResults = await customer.query(adsQuery);

    // Group ads by ID and aggregate metrics
    const adsMap = new Map();
    adsResults.forEach((row: any) => {
      const id = row.ad_group_ad.ad.id.toString();
      if (!adsMap.has(id)) {
        adsMap.set(id, {
          id,
          name: row.ad_group_ad.ad.name || '',
          status: row.ad_group_ad.status,
          type: row.ad_group_ad.ad.type,
          finalUrls: row.ad_group_ad.ad.final_urls || [],
          headlines: row.ad_group_ad.ad.responsive_search_ad?.headlines?.map((h: any) => h.text) || [],
          descriptions: row.ad_group_ad.ad.responsive_search_ad?.descriptions?.map((d: any) => d.text) || [],
          path1: row.ad_group_ad.ad.responsive_search_ad?.path1 || '',
          path2: row.ad_group_ad.ad.responsive_search_ad?.path2 || '',
          approvalStatus: row.ad_group_ad.policy_summary?.approval_status || 'UNKNOWN',
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
        });
      }
      const ad = adsMap.get(id);
      ad.impressions += row.metrics?.impressions || 0;
      ad.clicks += row.metrics?.clicks || 0;
      ad.cost += Number(row.metrics?.cost_micros || 0) / 1_000_000;
      ad.conversions += row.metrics?.conversions || 0;
    });

    const ads = Array.from(adsMap.values());

    // Get search terms for this ad group
    const searchTermsQuery = `
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE ad_group.id = ${adGroupId}
        ${metricsDateCondition}
      ORDER BY metrics.conversions DESC, metrics.clicks DESC
      LIMIT 100
    `;

    const searchTermsResults = await customer.query(searchTermsQuery);

    const searchTerms = searchTermsResults.map((row: any) => ({
      searchTerm: row.search_term_view.search_term,
      status: row.search_term_view.status,
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
    }));

    // Get negative keywords for this ad group
    const negativeKeywordsQuery = `
      SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type
      FROM ad_group_criterion
      WHERE ad_group.id = ${adGroupId}
        AND ad_group_criterion.negative = true
        AND ad_group_criterion.type = 'KEYWORD'
    `;

    const negativeKeywordsResults = await customer.query(negativeKeywordsQuery);

    const negativeKeywords = negativeKeywordsResults.map((row: any) => ({
      id: row.ad_group_criterion.criterion_id.toString(),
      text: row.ad_group_criterion.keyword?.text || '',
      matchType: row.ad_group_criterion.keyword?.match_type || 'UNKNOWN',
    }));

    // Format chart data (daily performance)
    const chartData = metricsResults.map((row: any) => ({
      date: row.segments.date,
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
    })).reverse();

    return NextResponse.json({
      success: true,
      adGroup: {
        id: adGroupData.ad_group.id?.toString() ?? '',
        name: adGroupData.ad_group.name,
        status: adGroupData.ad_group.status,
        type: adGroupData.ad_group.type,
        cpcBid: Number(adGroupData.ad_group.cpc_bid_micros || 0) / 1_000_000,
        cpmBid: Number(adGroupData.ad_group.cpm_bid_micros || 0) / 1_000_000,
        targetCpa: Number(adGroupData.ad_group.target_cpa_micros || 0) / 1_000_000,
        targetRoas: adGroupData.ad_group.target_roas || null,
      },
      campaign: {
        id: adGroupData.campaign?.id?.toString() ?? '',
        name: adGroupData.campaign?.name,
        status: adGroupData.campaign?.status,
      },
      metrics: {
        ...totalMetrics,
        ctr,
        avgCpc,
        avgCpm,
        conversionRate,
        costPerConversion,
      },
      keywords,
      ads,
      searchTerms,
      negativeKeywords,
      chartData,
    });
  } catch (error: any) {
    console.error('Error fetching ad group details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch ad group details',
      },
      { status: 500 }
    );
  }
}
