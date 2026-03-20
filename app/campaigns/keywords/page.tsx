'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Keyword {
  id: string;
  text: string;
  matchType: string;
  adGroupName: string;
  qualityScore: number | null;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface PerformanceData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  cost: number;
  conversions: number;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#06B6D4', // cyan
];

type StatusFilter = 'all' | 'ENABLED' | 'PAUSED';

function CampaignStatusBadge({ status }: { status: string }) {
  if (status === 'ENABLED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    );
  }
  if (status === 'PAUSED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
        Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      {status}
    </span>
  );
}

export default function KeywordsPerformancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<StatusFilter>('all');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [allKeywords, setAllKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [performanceData, setPerformanceData] = useState<{ [keyword: string]: PerformanceData[] }>({});
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch campaigns when account selected
  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns(selectedAccount);
    } else {
      setCampaigns([]);
      setSelectedCampaignIds([]);
      setAllKeywords([]);
      setSelectedKeywords([]);
      setPerformanceData({});
    }
  }, [selectedAccount]);

  // Fetch keywords when selected campaigns change
  useEffect(() => {
    if (selectedAccount && selectedCampaignIds.length > 0) {
      fetchKeywordsFromCampaigns(selectedAccount, selectedCampaignIds);
    } else {
      setAllKeywords([]);
      setSelectedKeywords([]);
      setPerformanceData({});
    }
  }, [selectedAccount, selectedCampaignIds]);

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/campaigns/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function fetchCampaigns(accountId: string) {
    try {
      setLoadingCampaigns(true);
      setSelectedCampaignIds([]);
      setAllKeywords([]);
      setSelectedKeywords([]);
      setPerformanceData({});
      const response = await fetch(`/api/campaigns/${accountId}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  }

  async function fetchKeywordsFromCampaigns(accountId: string, campaignIds: string[]) {
    try {
      setLoadingKeywords(true);
      setAllKeywords([]);
      setSelectedKeywords([]);
      setPerformanceData({});

      const results = await Promise.all(
        campaignIds.map((campaignId) =>
          fetch(`/api/campaigns/${accountId}/${campaignId}?dateRange=LAST_30_DAYS`)
            .then((res) => {
              if (!res.ok) throw new Error(`Failed to fetch keywords for campaign ${campaignId}`);
              return res.json();
            })
            .then((data) => data.keywords || [])
            .catch((err) => {
              console.error(err);
              return [];
            })
        )
      );

      // Merge and deduplicate by keyword text
      const seen = new Set<string>();
      const merged: Keyword[] = [];
      for (const keywordList of results) {
        for (const kw of keywordList) {
          if (!seen.has(kw.text)) {
            seen.add(kw.text);
            merged.push(kw);
          }
        }
      }

      setAllKeywords(merged);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoadingKeywords(false);
    }
  }

  async function fetchPerformance() {
    if (selectedKeywords.length === 0) return;

    try {
      setLoading(true);
      const response = await fetch('/api/keywords/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          keywords: selectedKeywords,
          days: 180,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch performance data');

      const result = await response.json();
      setPerformanceData(result.data);
    } catch (error: any) {
      console.error('Error fetching performance:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Campaigns filtered by status chip
  const visibleCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = campaignStatusFilter === 'all' || c.status === campaignStatusFilter;
      const matchesSearch = c.name.toLowerCase().includes(campaignSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, campaignStatusFilter, campaignSearch]);

  // Toggle a single campaign selection
  function toggleCampaign(campaignId: string) {
    setSelectedCampaignIds((prev) =>
      prev.includes(campaignId) ? prev.filter((id) => id !== campaignId) : [...prev, campaignId]
    );
  }

  // Keywords filtered by search input
  const filteredKeywords = useMemo(() => {
    if (!keywordSearch) return allKeywords;
    const search = keywordSearch.toLowerCase();
    return allKeywords.filter(
      (k) =>
        k.text.toLowerCase().includes(search) ||
        k.adGroupName.toLowerCase().includes(search)
    );
  }, [keywordSearch, allKeywords]);

  // Toggle a keyword selection (max 10)
  function toggleKeyword(keywordText: string) {
    setSelectedKeywords((prev) => {
      if (prev.includes(keywordText)) {
        const next = prev.filter((k) => k !== keywordText);
        // Remove stale performance data for deselected keyword
        setPerformanceData((pd) => {
          const copy = { ...pd };
          delete copy[keywordText];
          return copy;
        });
        return next;
      }
      if (prev.length >= 10) return prev;
      return [...prev, keywordText];
    });
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (Object.keys(performanceData).length === 0) return [];

    const allDates = new Set<string>();
    Object.values(performanceData).forEach((keywordData) => {
      keywordData.forEach((d) => allDates.add(d.date));
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => {
      const dataPoint: any = { date: formatDate(date) };
      Object.keys(performanceData).forEach((keyword) => {
        const dayData = performanceData[keyword].find((d) => d.date === date);
        dataPoint[keyword] = dayData?.clicks || 0;
      });
      return dataPoint;
    });
  }, [performanceData]);

  function formatDate(dateStr: string) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${month}/${day}`;
  }

  if (loadingAccounts) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EF5744] mx-auto"></div>
          <p className="mt-4 text-[#a1a1aa]">Loading accounts...</p>
        </div>
      </div>
    );
  }

  const statusFilterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'ENABLED' },
    { label: 'Paused', value: 'PAUSED' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Keywords Performance Tracker</h1>
              <p className="mt-1 text-sm text-[#8b8b93]">Track keyword clicks over the last 180 days</p>
            </div>
            <Link
              href="/campaigns"
              className="text-sm text-[#EF5744] hover:text-[#EF5744] font-medium"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Step 1: Account */}
        <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">1. Select Account</h2>
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF5744] text-white bg-[#141414]"
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Campaigns */}
        {selectedAccount && (
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                2. Select Campaigns
                {loadingCampaigns && (
                  <span className="ml-2 text-sm text-[#8b8b93] font-normal">Loading...</span>
                )}
              </h2>
              {selectedCampaignIds.length > 0 && (
                <span className="text-sm text-[#EF5744] font-medium">
                  {selectedCampaignIds.length} selected
                </span>
              )}
            </div>

            {/* Campaign search */}
            {!loadingCampaigns && campaigns.length > 0 && (
              <input
                type="text"
                placeholder="Filter campaigns by name..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="w-full px-3 py-2 mb-3 border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EF5744] text-white bg-[#141414]"
              />
            )}

            {/* Status filter chips */}
            {!loadingCampaigns && campaigns.length > 0 && (
              <div className="flex gap-2 mb-4">
                {statusFilterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCampaignStatusFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                      campaignStatusFilter === opt.value
                        ? 'bg-[#c93a2a] text-white border-[#c93a2a]'
                        : 'bg-[#141414] text-[#a1a1aa] border-[#2a2a2a] hover:border-[#EF5744] hover:text-[#EF5744]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Campaign checkbox list */}
            {!loadingCampaigns && visibleCampaigns.length === 0 && (
              <p className="text-sm text-[#8b8b93]">No campaigns match the selected filter.</p>
            )}

            {!loadingCampaigns && visibleCampaigns.length > 0 && (
              <div className="divide-y divide-[#1f1f1f] border border-[#2a2a2a] rounded-lg overflow-hidden">
                {visibleCampaigns.map((campaign) => {
                  const isChecked = selectedCampaignIds.includes(campaign.id);
                  return (
                    <label
                      key={campaign.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[rgba(239,87,68,0.04)]' : 'hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCampaign(campaign.id)}
                        className="h-4 w-4 rounded border-[#2a2a2a] text-[#EF5744] focus:ring-[#EF5744]"
                      />
                      <span className="flex-1 text-sm font-medium text-white">{campaign.name}</span>
                      <CampaignStatusBadge status={campaign.status} />
                    </label>
                  );
                })}
              </div>
            )}

            {loadingCampaigns && (
              <div className="flex items-center gap-2 text-sm text-[#8b8b93] py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#EF5744]"></div>
                Loading campaigns...
              </div>
            )}
          </div>
        )}

        {/* Step 3: Keywords */}
        {selectedCampaignIds.length > 0 && (
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                3. Select Keywords
                {loadingKeywords && (
                  <span className="ml-2 text-sm text-[#8b8b93] font-normal">Loading...</span>
                )}
              </h2>
              {selectedKeywords.length > 0 && (
                <span className="text-sm text-[#EF5744] font-medium">
                  {selectedKeywords.length}/10 selected
                </span>
              )}
            </div>

            {/* Keyword search filter */}
            {!loadingKeywords && allKeywords.length > 0 && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Filter keywords..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF5744] text-white bg-[#141414] text-sm"
                />
              </div>
            )}

            {/* Keyword checkbox list */}
            {!loadingKeywords && filteredKeywords.length === 0 && allKeywords.length > 0 && (
              <p className="text-sm text-[#8b8b93]">No keywords match your search.</p>
            )}

            {!loadingKeywords && allKeywords.length === 0 && (
              <p className="text-sm text-[#8b8b93]">No keywords found for the selected campaigns.</p>
            )}

            {!loadingKeywords && filteredKeywords.length > 0 && (
              <div
                className="divide-y divide-[#1f1f1f] border border-[#2a2a2a] rounded-lg overflow-y-auto"
                style={{ maxHeight: '300px' }}
              >
                {filteredKeywords.map((keyword) => {
                  const isChecked = selectedKeywords.includes(keyword.text);
                  const isDisabled = !isChecked && selectedKeywords.length >= 10;
                  return (
                    <label
                      key={keyword.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${isChecked ? 'bg-[rgba(239,87,68,0.04)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => !isDisabled && toggleKeyword(keyword.text)}
                        className="h-4 w-4 rounded border-[#2a2a2a] text-[#EF5744] focus:ring-[#EF5744]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{keyword.text}</div>
                        <div className="text-xs text-[#8b8b93] truncate">{keyword.adGroupName}</div>
                      </div>
                      <div className="text-xs text-[#a1a1aa] whitespace-nowrap ml-2">
                        {keyword.clicks.toLocaleString()} clicks
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {loadingKeywords && (
              <div className="flex items-center gap-2 text-sm text-[#8b8b93] py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#EF5744]"></div>
                Loading keywords...
              </div>
            )}

            {/* Plot button */}
            {!loadingKeywords && (
              <div className="mt-4">
                <button
                  onClick={fetchPerformance}
                  disabled={selectedKeywords.length === 0 || loading}
                  className="px-6 py-3 bg-[#c93a2a] text-white rounded-lg font-medium hover:bg-[#a83020] disabled:bg-[#2a2a2a] disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Plot Performance'}
                </button>
                {selectedKeywords.length === 0 && (
                  <p className="mt-2 text-xs text-[#8b8b93]">Select at least one keyword to plot.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Clicks Over Time (Last 180 Days)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedKeywords.map((keyword, index) => (
                  <Line
                    key={keyword}
                    type="monotone"
                    dataKey={keyword}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedKeywords.map((keyword, index) => {
                const keywordData = performanceData[keyword] || [];
                const totalClicks = keywordData.reduce((sum, d) => sum + d.clicks, 0);
                const totalImpressions = keywordData.reduce((sum, d) => sum + d.impressions, 0);
                const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

                return (
                  <div
                    key={keyword}
                    className="p-4 rounded-lg border-l-4"
                    style={{ borderColor: COLORS[index % COLORS.length] }}
                  >
                    <div className="font-medium text-white mb-2">{keyword}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa]">Total Clicks:</span>
                        <span className="font-semibold text-white">{totalClicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa]">Total Impressions:</span>
                        <span className="font-semibold text-white">{totalImpressions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a1a1aa]">Avg CTR:</span>
                        <span className="font-semibold text-white">{avgCtr.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedAccount && (
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-[#8b8b93] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">Select an Account to Get Started</h3>
            <p className="text-[#8b8b93]">Choose an account above to load campaigns and start tracking keyword performance.</p>
          </div>
        )}

      </div>
    </div>
  );
}
