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

export default function KeywordsPerformancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [allKeywords, setAllKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      setSelectedCampaign('');
    }
  }, [selectedAccount]);

  // Fetch keywords when campaign selected
  useEffect(() => {
    if (selectedAccount && selectedCampaign) {
      fetchKeywords(selectedAccount, selectedCampaign);
    } else {
      setAllKeywords([]);
    }
  }, [selectedAccount, selectedCampaign]);

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

  async function fetchKeywords(accountId: string, campaignId: string) {
    try {
      setLoadingKeywords(true);
      const response = await fetch(`/api/campaigns/${accountId}/${campaignId}?dateRange=LAST_30_DAYS`);
      if (!response.ok) throw new Error('Failed to fetch keywords');
      const data = await response.json();
      setAllKeywords(data.keywords || []);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoadingKeywords(false);
    }
  }

  async function fetchPerformance() {
    if (selectedKeywords.length === 0) {
      alert('Please select at least one keyword');
      return;
    }

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

  // Filter keywords based on search
  const filteredKeywords = useMemo(() => {
    if (!searchTerm) return [];
    const search = searchTerm.toLowerCase();
    return allKeywords
      .filter(k => k.text.toLowerCase().includes(search))
      .slice(0, 10); // Limit to 10 suggestions
  }, [searchTerm, allKeywords]);

  // Add keyword to selection
  function addKeyword(keyword: string) {
    if (!selectedKeywords.includes(keyword) && selectedKeywords.length < 10) {
      setSelectedKeywords([...selectedKeywords, keyword]);
      setSearchTerm('');
    }
  }

  // Remove keyword from selection
  function removeKeyword(keyword: string) {
    setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    // Remove from performance data
    const newData = { ...performanceData };
    delete newData[keyword];
    setPerformanceData(newData);
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (Object.keys(performanceData).length === 0) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    Object.values(performanceData).forEach(keywordData => {
      keywordData.forEach(d => allDates.add(d.date));
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Build chart data with all keywords
    return sortedDates.map(date => {
      const dataPoint: any = { date: formatDate(date) };
      Object.keys(performanceData).forEach(keyword => {
        const dayData = performanceData[keyword].find(d => d.date === date);
        dataPoint[keyword] = dayData?.clicks || 0;
      });
      return dataPoint;
    });
  }, [performanceData]);

  // Format date from YYYYMMDD to MM/DD
  function formatDate(dateStr: string) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${month}/${day}`;
  }

  if (loadingAccounts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Keywords Performance Tracker</h1>
              <p className="mt-1 text-sm text-gray-500">Track keyword clicks over the last 180 days</p>
            </div>
            <Link
              href="/campaigns"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Campaigns
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account & Campaign Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Account & Campaign</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                disabled={!selectedAccount || loadingCampaigns}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Keyword Search & Selection */}
        {selectedCampaign && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Keywords {loadingKeywords && <span className="text-sm text-gray-500 font-normal">(Loading...)</span>}
            </h2>

            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Type to search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingKeywords}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 text-gray-900"
              />

              {/* Autocomplete Dropdown */}
              {searchTerm && filteredKeywords.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredKeywords.map((keyword) => (
                    <button
                      key={keyword.id}
                      onClick={() => addKeyword(keyword.text)}
                      disabled={selectedKeywords.includes(keyword.text)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{keyword.text}</div>
                          <div className="text-sm text-gray-500">{keyword.adGroupName}</div>
                        </div>
                        <div className="text-sm text-gray-600 ml-4">
                          {keyword.clicks.toLocaleString()} clicks
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Keywords */}
            {selectedKeywords.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Keywords ({selectedKeywords.length}/10)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedKeywords.map((keyword, index) => (
                    <div
                      key={keyword}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ backgroundColor: COLORS[index % COLORS.length] + '20', color: COLORS[index % COLORS.length] }}
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="hover:opacity-70"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fetch Button */}
            <button
              onClick={fetchPerformance}
              disabled={selectedKeywords.length === 0 || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Fetch Performance Data'}
            </button>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Clicks Over Time (Last 180 Days)</h2>
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
                    <div className="font-medium text-gray-900 mb-2">{keyword}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Clicks:</span>
                        <span className="font-semibold text-gray-900">{totalClicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Impressions:</span>
                        <span className="font-semibold text-gray-900">{totalImpressions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg CTR:</span>
                        <span className="font-semibold text-gray-900">{avgCtr.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedCampaign && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account & Campaign</h3>
            <p className="text-gray-500">Choose an account and campaign to start tracking keyword performance</p>
          </div>
        )}
      </div>
    </div>
  );
}
