import { GoogleAdsApi, Customer } from 'google-ads-api';

/**
 * Google Ads API Client
 *
 * Handles authentication and campaign management for Google Ads.
 * Requires OAuth2 credentials and developer token.
 */

interface GoogleAdsConfig {
  client_id: string;
  client_secret: string;
  developer_token: string;
  refresh_token: string;
}

let adsClient: GoogleAdsApi | null = null;

/**
 * Initialize Google Ads API client
 */
export function getGoogleAdsClient(): GoogleAdsApi {
  if (adsClient) {
    return adsClient;
  }

  const config: GoogleAdsConfig = {
    client_id: process.env.GOOGLE_ADS_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  };

  // Validate configuration
  if (!config.client_id || !config.client_secret || !config.developer_token || !config.refresh_token) {
    throw new Error('Missing Google Ads API credentials in environment variables');
  }

  adsClient = new GoogleAdsApi({
    client_id: config.client_id,
    client_secret: config.client_secret,
    developer_token: config.developer_token,
  });

  return adsClient;
}

/**
 * Get customer client for a specific Google Ads account
 */
export function getCustomer(customerId: string, loginCustomerId?: string): Customer {
  const client = getGoogleAdsClient();
  return client.Customer({
    customer_id: customerId,
    login_customer_id: loginCustomerId,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  });
}

/**
 * Create a new Google Ads campaign
 */
export async function createCampaign(
  customerId: string,
  campaignData: {
    name: string;
    budget: number;
    startDate: string;
    endDate?: string;
    targetLocation?: string;
  }
) {
  const customer = getCustomer(customerId);

  // Create campaign budget
  const budgetResourceName = await customer.campaignBudgets.create({
    name: `${campaignData.name} Budget`,
    amount_micros: campaignData.budget * 1_000_000, // Convert to micros
    delivery_method: 'STANDARD',
  });

  // Create campaign
  const campaign = await customer.campaigns.create({
    name: campaignData.name,
    status: 'PAUSED', // Start paused for review
    advertising_channel_type: 'SEARCH',
    campaign_budget: budgetResourceName,
    start_date: campaignData.startDate.replace(/-/g, ''),
    end_date: campaignData.endDate?.replace(/-/g, ''),
  });

  return campaign;
}

/**
 * Create ad group within a campaign
 */
export async function createAdGroup(
  customerId: string,
  campaignResourceName: string,
  adGroupData: {
    name: string;
    cpcBidMicros: number;
  }
) {
  const customer = getCustomer(customerId);

  const adGroup = await customer.adGroups.create({
    name: adGroupData.name,
    campaign: campaignResourceName,
    status: 'ENABLED',
    type: 'SEARCH_STANDARD',
    cpc_bid_micros: adGroupData.cpcBidMicros,
  });

  return adGroup;
}

/**
 * Create responsive search ad
 */
export async function createResponsiveSearchAd(
  customerId: string,
  adGroupResourceName: string,
  adData: {
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
  }
) {
  const customer = getCustomer(customerId);

  const ad = await customer.adGroupAds.create({
    ad_group: adGroupResourceName,
    status: 'ENABLED',
    ad: {
      final_urls: [adData.finalUrl],
      responsive_search_ad: {
        headlines: adData.headlines.map((text) => ({ text })),
        descriptions: adData.descriptions.map((text) => ({ text })),
      },
    },
  });

  return ad;
}

/**
 * Add keywords to ad group
 */
export async function addKeywords(
  customerId: string,
  adGroupResourceName: string,
  keywords: Array<{ text: string; matchType: 'EXACT' | 'PHRASE' | 'BROAD' }>
) {
  const customer = getCustomer(customerId);

  const operations = keywords.map((keyword) => ({
    ad_group: adGroupResourceName,
    status: 'ENABLED',
    keyword: {
      text: keyword.text,
      match_type: keyword.matchType,
    },
  }));

  const result = await customer.adGroupCriteria.create(operations);
  return result;
}

/**
 * Get campaign performance metrics
 */
export async function getCampaignMetrics(
  customerId: string,
  campaignId: string,
  dateRange: { startDate: string; endDate: string }
) {
  const customer = getCustomer(customerId);

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
  `;

  const results = await customer.query(query);
  return results;
}

/**
 * Get all keywords from account for search/autocomplete
 */
export async function getAllKeywords(customerId: string, loginCustomerId?: string) {
  const customer = getCustomer(customerId, loginCustomerId);

  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group.name,
      campaign.name
    FROM keyword_view
    WHERE ad_group_criterion.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND campaign.status = 'ENABLED'
    ORDER BY ad_group_criterion.keyword.text
  `;

  const results = await customer.query(query);

  // Extract unique keywords
  const uniqueKeywords = new Set<string>();
  results.forEach((row: any) => {
    if (row.ad_group_criterion?.keyword?.text) {
      uniqueKeywords.add(row.ad_group_criterion.keyword.text);
    }
  });

  return Array.from(uniqueKeywords).sort();
}

/**
 * Get keyword performance data over time (last 180 days)
 */
export async function getKeywordPerformance(
  customerId: string,
  keywords: string[],
  days: number = 180,
  loginCustomerId?: string
) {
  const customer = getCustomer(customerId, loginCustomerId);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  };

  // Build keyword filter
  const keywordFilter = keywords.map(k => `'${k.replace(/'/g, "\\'")}'`).join(', ');

  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      segments.date,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.average_cpc
    FROM keyword_view
    WHERE ad_group_criterion.keyword.text IN (${keywordFilter})
      AND segments.date BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'
    ORDER BY segments.date ASC
  `;

  const results = await customer.query(query);

  // Group by keyword and date
  const performanceData: { [keyword: string]: any[] } = {};

  results.forEach((row: any) => {
    const keyword = row.ad_group_criterion?.keyword?.text;
    const date = row.segments?.date;

    if (!keyword || !date) return;

    if (!performanceData[keyword]) {
      performanceData[keyword] = [];
    }

    performanceData[keyword].push({
      date,
      clicks: row.metrics?.clicks || 0,
      impressions: row.metrics?.impressions || 0,
      ctr: row.metrics?.ctr || 0,
      cost: (row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
      avgCpc: (row.metrics?.average_cpc || 0) / 1_000_000,
    });
  });

  return performanceData;
}
