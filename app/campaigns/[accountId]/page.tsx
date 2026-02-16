'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface AccountInfo {
  id: string;
  name: string;
  currency: string;
}

export default function AccountDashboard() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>([2, 3]); // Default: ENABLED and PAUSED
  const [sortColumn, setSortColumn] = useState<keyof Campaign | null>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [dateRange, setDateRange] = useState<string>('LAST_30_DAYS');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) {
      fetchAccountData();
    }
  }, [accountId]);

  // Close status filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-filter-container')) {
        setShowStatusFilter(false);
      }
    };

    if (showStatusFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusFilter]);

  async function fetchAccountData() {
    try {
      let url = `/api/campaigns/${accountId}?`;

      // Handle custom date ranges for 90 and 180 days
      if (dateRange === 'LAST_90_DAYS') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        url += `dateRange=CUSTOM&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      } else if (dateRange === 'LAST_180_DAYS') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 180);
        url += `dateRange=CUSTOM&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      } else if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
        url += `dateRange=CUSTOM&startDate=${customStartDate}&endDate=${customEndDate}`;
      } else {
        url += `dateRange=${dateRange}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch account data');

      const data = await response.json();
      setAccount(data.account);
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Refetch when date range changes
  useEffect(() => {
    if (accountId && (dateRange !== 'CUSTOM' || (customStartDate && customEndDate))) {
      setLoading(true);
      fetchAccountData();
    }
  }, [dateRange, customStartDate, customEndDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/campaigns')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const getStatusLabel = (status: string | number) => {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    switch (statusNum) {
      case 2: return 'ENABLED';
      case 3: return 'PAUSED';
      case 4: return 'REMOVED';
      default: return 'UNKNOWN';
    }
  };

  const toggleStatusFilter = (status: number) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSort = (column: keyof Campaign) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort campaigns
  let filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Status filter
    const statusNum = typeof campaign.status === 'string' ? parseInt(campaign.status) : campaign.status;
    const matchesStatus = selectedStatuses.includes(statusNum);
    return matchesSearch && matchesStatus;
  });

  // Sort campaigns
  if (sortColumn) {
    filteredCampaigns = [...filteredCampaigns].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }

  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalCost = filteredCampaigns.reduce((sum, c) => sum + c.cost, 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/campaigns"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{account?.name}</h1>
              </div>
              <p className="text-sm text-gray-500">Account ID: {accountId}</p>
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              onClick={() => alert('Create campaign feature coming soon')}
            >
              + Create Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-900">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setShowDatePicker(e.target.value === 'CUSTOM');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="LAST_7_DAYS">Last 7 days</option>
            <option value="LAST_14_DAYS">Last 14 days</option>
            <option value="LAST_30_DAYS">Last 30 days</option>
            <option value="LAST_90_DAYS">Last 90 days</option>
            <option value="LAST_180_DAYS">Last 180 days</option>
            <option value="THIS_MONTH">This month</option>
            <option value="LAST_MONTH">Last month</option>
            <option value="CUSTOM">Custom range</option>
          </select>

          {showDatePicker && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-900 font-medium">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Impressions</div>
            <div className="text-2xl font-bold text-gray-900">{totalImpressions.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Clicks</div>
            <div className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">CTR</div>
            <div className="text-2xl font-bold text-gray-900">{avgCtr}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Spend</div>
            <div className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
              <div className="flex items-center gap-3">
                {/* Status Filter */}
                <div className="relative status-filter-container">
                  <button
                    onClick={() => setShowStatusFilter(!showStatusFilter)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-400 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <svg className="h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Status ({selectedStatuses.length})</span>
                  </button>
                  {showStatusFilter && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border-2 border-gray-400 z-10">
                      <div className="p-3 space-y-2">
                        {[
                          { value: 2, label: 'ENABLED', color: 'green' },
                          { value: 3, label: 'PAUSED', color: 'yellow' },
                          { value: 4, label: 'REMOVED', color: 'gray' },
                        ].map(({ value, label, color }) => (
                          <label key={value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes(value)}
                              onChange={() => toggleStatusFilter(value)}
                              className="w-4 h-4 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${color}-100 text-${color}-800`}
                            >
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 px-4 py-2 pl-10 text-sm font-medium text-gray-900 placeholder-gray-600 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {campaigns.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns</h3>
                  <p className="text-gray-500 mb-4">Create your first campaign to get started.</p>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                    onClick={() => alert('Create campaign feature coming soon')}
                  >
                    + Create Campaign
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-500">No campaigns match "{searchQuery}"</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Campaign</span>
                        {sortColumn === 'name' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {sortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {sortColumn === 'status' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {sortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('impressions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Impressions</span>
                        {sortColumn === 'impressions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {sortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('clicks')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Clicks</span>
                        {sortColumn === 'clicks' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {sortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('cost')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Cost</span>
                        {sortColumn === 'cost' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {sortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('conversions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Conversions</span>
                        {sortColumn === 'conversions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {sortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      onClick={() => router.push(`/campaigns/${accountId}/${campaign.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-xs text-gray-500">ID: {campaign.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusLabel(campaign.status) === 'ENABLED'
                              ? 'bg-green-100 text-green-800'
                              : getStatusLabel(campaign.status) === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusLabel(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {campaign.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ${campaign.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {campaign.conversions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
