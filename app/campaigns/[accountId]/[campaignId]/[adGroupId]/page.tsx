'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdGroup {
  id: string;
  name: string;
  status: string;
  type: string;
  cpcBid: number;
  cpmBid: number;
  targetCpa: number;
  targetRoas: number | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface Metrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
  interactions: number;
  viewThroughConversions: number;
  ctr: number;
  avgCpc: number;
  avgCpm: number;
  conversionRate: number;
  costPerConversion: number;
}

interface Keyword {
  id: string;
  text: string;
  matchType: string;
  qualityScore: number | null;
  status: string;
  finalUrls: string[];
  cpcBid: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  type: string;
  finalUrls: string[];
  headlines: string[];
  descriptions: string[];
  path1: string;
  path2: string;
  approvalStatus: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface SearchTerm {
  searchTerm: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface NegativeKeyword {
  id: string;
  text: string;
  matchType: string;
}

export default function AdGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params?.accountId as string;
  const campaignId = params?.campaignId as string;
  const adGroupId = params?.adGroupId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');

  const [adGroup, setAdGroup] = useState<AdGroup | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [negativeKeywords, setNegativeKeywords] = useState<NegativeKeyword[]>([]);

  const [activeTab, setActiveTab] = useState<'keywords' | 'ads' | 'searchTerms' | 'negatives'>('keywords');

  useEffect(() => {
    if (accountId && campaignId && adGroupId) {
      fetchAdGroupData();
    }
  }, [accountId, campaignId, adGroupId, dateRange]);

  const fetchAdGroupData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/campaigns/${accountId}/${campaignId}/${adGroupId}?dateRange=${dateRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ad group data');
      }

      const data = await response.json();

      if (data.success) {
        setAdGroup(data.adGroup);
        setCampaign(data.campaign);
        setMetrics(data.metrics);
        setKeywords(data.keywords || []);
        setAds(data.ads || []);
        setSearchTerms(data.searchTerms || []);
        setNegativeKeywords(data.negativeKeywords || []);
      } else {
        setError(data.error || 'Failed to load ad group data');
      }
    } catch (err) {
      console.error('Error fetching ad group data:', err);
      setError('Failed to fetch ad group data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REMOVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return 'Active';
      case 'PAUSED':
        return 'Paused';
      case 'REMOVED':
        return 'Removed';
      default:
        return status;
    }
  };

  const getSearchTermStatusColor = (status: string) => {
    switch (status) {
      case 'ADDED':
        return 'bg-green-100 text-green-800';
      case 'EXCLUDED':
        return 'bg-red-100 text-red-800';
      case 'NONE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSearchTermStatusLabel = (status: string) => {
    switch (status) {
      case 'ADDED':
        return 'Added as Keyword';
      case 'EXCLUDED':
        return 'Excluded';
      case 'NONE':
        return 'Not Added';
      default:
        return status;
    }
  };

  const getQualityScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getQualityScoreLabel = (score: number | null) => {
    if (score === null) return 'No data';
    if (score >= 8) return `${score}/10 Good`;
    if (score >= 4) return `${score}/10 Average`;
    return `${score}/10 Poor`;
  };

  const getAdTypeLabel = (type: string) => {
    if (!type) return 'Unknown';

    switch (type) {
      case 'RESPONSIVE_SEARCH_AD':
        return 'Responsive Search Ad';
      case 'EXPANDED_TEXT_AD':
        return 'Expanded Text Ad';
      case 'TEXT_AD':
        return 'Text Ad';
      case 'IMAGE_AD':
        return 'Image Ad';
      case 'VIDEO_AD':
        return 'Video Ad';
      default:
        return typeof type === 'string' ? type.replace(/_/g, ' ') : String(type);
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DISAPPROVED':
        return 'bg-red-100 text-red-800';
      case 'APPROVED_LIMITED':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'DISAPPROVED':
        return 'Disapproved';
      case 'APPROVED_LIMITED':
        return 'Limited';
      case 'UNDER_REVIEW':
        return 'Under Review';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EF5744] mx-auto"></div>
          <p className="mt-4 text-[#a1a1aa]">Loading ad group data...</p>
        </div>
      </div>
    );
  }

  if (error || !adGroup) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Ad group not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-[#c93a2a] text-white rounded-md hover:bg-[#a83020]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/campaigns" className="text-[#8b8b93] hover:text-[#d4d4d8]">
                  Campaigns
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-[#8b8b93] mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
                <Link
                  href={`/campaigns/${accountId}`}
                  className="text-[#8b8b93] hover:text-[#d4d4d8]"
                >
                  Account
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-[#8b8b93] mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
                <Link
                  href={`/campaigns/${accountId}/${campaignId}`}
                  className="text-[#8b8b93] hover:text-[#d4d4d8]"
                >
                  {campaign?.name}
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-[#8b8b93] mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                </svg>
                <span className="text-white font-medium">{adGroup.name}</span>
              </li>
            </ol>
          </nav>

          {/* Title and Status */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{adGroup.name}</h1>
              <p className="mt-1 text-sm text-[#8b8b93]">Ad Group • {adGroup.type}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(adGroup.status)}`}>
                {adGroup.status}
              </span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-[#2a2a2a] rounded-md text-sm text-white bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#EF5744]"
              >
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_7_DAYS">Last 7 days</option>
                <option value="LAST_30_DAYS">Last 30 days</option>
                <option value="THIS_MONTH">This month</option>
                <option value="LAST_MONTH">Last month</option>
              </select>
            </div>
          </div>

          {/* Ad Group Settings */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {adGroup.cpcBid > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs text-[#8b8b93] uppercase">CPC Bid</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(adGroup.cpcBid)}</p>
              </div>
            )}
            {adGroup.targetCpa > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs text-[#8b8b93] uppercase">Target CPA</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(adGroup.targetCpa)}</p>
              </div>
            )}
            {adGroup.targetRoas && (
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs text-[#8b8b93] uppercase">Target ROAS</p>
                <p className="mt-1 text-lg font-semibold text-white">{adGroup.targetRoas.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-4">
              <p className="text-xs text-[#8b8b93] uppercase">Impressions</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(metrics.impressions)}</p>
            </div>
            <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-4">
              <p className="text-xs text-[#8b8b93] uppercase">Clicks</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(metrics.clicks)}</p>
            </div>
            <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-4">
              <p className="text-xs text-[#8b8b93] uppercase">CTR</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatPercent(metrics.ctr)}</p>
            </div>
            <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-4">
              <p className="text-xs text-[#8b8b93] uppercase">Cost</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(metrics.cost)}</p>
            </div>
            <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-4">
              <p className="text-xs text-[#8b8b93] uppercase">Avg CPC</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(metrics.avgCpc)}</p>
            </div>
            <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-4">
              <p className="text-xs text-[#8b8b93] uppercase">Conversions</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(metrics.conversions)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#141414] rounded-lg border border-[#2a2a2a]">
          <div className="border-b border-[#2a2a2a]">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('keywords')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'keywords'
                    ? 'border-[#EF5744] text-[#EF5744]'
                    : 'border-transparent text-[#8b8b93] hover:text-[#d4d4d8] hover:border-[#2a2a2a]'
                }`}
              >
                Keywords ({keywords.length})
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'ads'
                    ? 'border-[#EF5744] text-[#EF5744]'
                    : 'border-transparent text-[#8b8b93] hover:text-[#d4d4d8] hover:border-[#2a2a2a]'
                }`}
              >
                Ads ({ads.length})
              </button>
              <button
                onClick={() => setActiveTab('searchTerms')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'searchTerms'
                    ? 'border-[#EF5744] text-[#EF5744]'
                    : 'border-transparent text-[#8b8b93] hover:text-[#d4d4d8] hover:border-[#2a2a2a]'
                }`}
              >
                Search Terms ({searchTerms.length})
              </button>
              <button
                onClick={() => setActiveTab('negatives')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'negatives'
                    ? 'border-[#EF5744] text-[#EF5744]'
                    : 'border-transparent text-[#8b8b93] hover:text-[#d4d4d8] hover:border-[#2a2a2a]'
                }`}
              >
                Negative Keywords ({negativeKeywords.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Keywords Tab */}
            {activeTab === 'keywords' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#2a2a2a]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Keyword</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Match Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Quality Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">CPC Bid</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Impressions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Clicks</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Conversions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {keywords.map((keyword) => (
                      <tr key={keyword.id} className="hover:bg-[rgba(255,255,255,0.05)]">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{keyword.text}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded ${
                              keyword.matchType === 'EXACT' ? 'bg-indigo-100 text-indigo-800' :
                              keyword.matchType === 'PHRASE' ? 'bg-teal-100 text-teal-800' :
                              'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {keyword.matchType === 'EXACT' ? 'E' :
                             keyword.matchType === 'PHRASE' ? 'P' :
                             'B'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getQualityScoreColor(keyword.qualityScore)}`}>
                            {getQualityScoreLabel(keyword.qualityScore)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(keyword.status)}`}>
                            {getStatusLabel(keyword.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatCurrency(keyword.cpcBid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatNumber(keyword.impressions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatNumber(keyword.clicks)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatCurrency(keyword.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatNumber(keyword.conversions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {keywords.length === 0 && (
                  <div className="text-center py-12 text-[#8b8b93]">
                    No keywords found for this ad group
                  </div>
                )}
              </div>
            )}

            {/* Ads Tab */}
            {activeTab === 'ads' && (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <div key={ad.id} className="border-2 border-[#2a2a2a] rounded-lg p-6 bg-[#141414]">
                    {/* Ad Header */}
                    <div className="mb-6 pb-4 border-b border-[#2a2a2a]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {ad.name || `Ad ${ad.id}`}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                            <span>{getAdTypeLabel(ad.type)}</span>
                            {ad.headlines.length > 0 && (
                              <>
                                <span className="text-[#8b8b93]">•</span>
                                <span>{ad.headlines.length} Headlines, {ad.descriptions.length} Descriptions</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(String(ad.status))}`}>
                            {getStatusLabel(String(ad.status))}
                          </span>
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getApprovalStatusColor(String(ad.approvalStatus))}`}>
                            {getApprovalStatusLabel(String(ad.approvalStatus))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ad Preview Section */}
                    {ad.headlines.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-[#d4d4d8] uppercase tracking-wide mb-3">Ad Preview</h4>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Headlines ({ad.headlines.length})</div>
                            <div className="text-[#EF5744] text-base font-medium">
                              {ad.headlines.slice(0, 3).join(' | ')}
                            </div>
                            {ad.headlines.length > 3 && (
                              <div className="text-xs text-[#8b8b93] mt-1">+ {ad.headlines.length - 3} more</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Descriptions ({ad.descriptions.length})</div>
                            <div className="text-[#d4d4d8] text-sm">
                              {ad.descriptions.slice(0, 2).join(' ')}
                            </div>
                            {ad.descriptions.length > 2 && (
                              <div className="text-xs text-[#8b8b93] mt-1">+ {ad.descriptions.length - 2} more</div>
                            )}
                          </div>
                          {ad.finalUrls.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Final URL</div>
                              <div className="text-green-700 text-sm break-all">{ad.finalUrls[0]}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Performance Metrics Section */}
                    <div>
                      <h4 className="text-sm font-bold text-[#d4d4d8] uppercase tracking-wide mb-3">Performance Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-[#1a1a1a] rounded-lg p-4">
                          <p className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Impressions</p>
                          <p className="text-2xl font-bold text-white">{formatNumber(ad.impressions)}</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4">
                          <p className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Clicks</p>
                          <p className="text-2xl font-bold text-white">{formatNumber(ad.clicks)}</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4">
                          <p className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Cost</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(ad.cost)}</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4">
                          <p className="text-xs font-semibold text-[#8b8b93] uppercase mb-1">Conversions</p>
                          <p className="text-2xl font-bold text-white">{formatNumber(ad.conversions)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ads.length === 0 && (
                  <div className="text-center py-12 text-[#8b8b93]">
                    No ads found in this ad group
                  </div>
                )}
              </div>
            )}

            {/* Search Terms Tab */}
            {activeTab === 'searchTerms' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#2a2a2a]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Search Term</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Impressions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Clicks</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8b8b93] uppercase">Conversions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {searchTerms.map((term, index) => (
                      <tr key={index} className="hover:bg-[rgba(255,255,255,0.05)]">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{term.searchTerm}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSearchTermStatusColor(term.status)}`}>
                            {getSearchTermStatusLabel(term.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatNumber(term.impressions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatNumber(term.clicks)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatCurrency(term.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white">
                          {formatNumber(term.conversions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {searchTerms.length === 0 && (
                  <div className="text-center py-12 text-[#8b8b93]">
                    No search terms found for this ad group
                  </div>
                )}
              </div>
            )}

            {/* Negative Keywords Tab */}
            {activeTab === 'negatives' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#2a2a2a]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Keyword</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8b8b93] uppercase">Match Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {negativeKeywords.map((keyword) => (
                      <tr key={keyword.id} className="hover:bg-[rgba(255,255,255,0.05)]">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{keyword.text}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {keyword.matchType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {negativeKeywords.length === 0 && (
                  <div className="text-center py-12 text-[#8b8b93]">
                    No negative keywords in this ad group
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
