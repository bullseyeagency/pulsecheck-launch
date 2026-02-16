'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  servingStatus: string;
  budget: number;
  totalBudget: number;
  budgetType: string;
  isSharedBudget: boolean;
  startDate: string;
  endDate?: string;
  advertisingChannelType: string;
  advertisingChannelSubType?: string;
  biddingStrategy: string;
  urlExpansionOptOut: boolean;
  optimizationScore?: number;
  networkSettings: {
    targetGoogleSearch: boolean;
    targetSearchNetwork: boolean;
    targetContentNetwork: boolean;
    targetPartnerSearchNetwork: boolean;
  };
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

interface AdGroup {
  id: string;
  name: string;
  status: string;
  type: string;
  cpcBid: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface Keyword {
  id: string;
  adGroupId: string;
  adGroupName: string;
  text: string;
  matchType: string;
  qualityScore: number | null;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
}

interface SearchTerm {
  searchTerm: string;
  status: string;
  adGroupId: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface AccountInfo {
  id: string;
  name: string;
  currency: string;
  timeZone: string;
}

interface ChartDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;
  const campaignId = params.campaignId as string;

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [devicePerformance, setDevicePerformance] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [dateRange, setDateRange] = useState<string>('LAST_30_DAYS');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [chartMetric, setChartMetric] = useState<'impressions' | 'clicks' | 'cost' | 'conversions'>('clicks');
  const [keywordSortColumn, setKeywordSortColumn] = useState<keyof Keyword>('conversions');
  const [keywordSortDirection, setKeywordSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTermSortColumn, setSearchTermSortColumn] = useState<keyof SearchTerm>('conversions');
  const [searchTermSortDirection, setSearchTermSortDirection] = useState<'asc' | 'desc'>('desc');
  const [adGroupSortColumn, setAdGroupSortColumn] = useState<keyof AdGroup>('conversions');
  const [adGroupSortDirection, setAdGroupSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters
  type FilterOperator = '=' | '!=' | '<' | '<=' | '>' | '>=';
  interface Filter {
    field: string;
    operator: FilterOperator;
    value: number;
  }
  const [keywordFilters, setKeywordFilters] = useState<Filter[]>([]);
  const [searchTermFilters, setSearchTermFilters] = useState<Filter[]>([]);
  const [adGroupFilters, setAdGroupFilters] = useState<Filter[]>([]);
  const [showKeywordFilterBuilder, setShowKeywordFilterBuilder] = useState(false);
  const [showSearchTermFilterBuilder, setShowSearchTermFilterBuilder] = useState(false);
  const [showAdGroupFilterBuilder, setShowAdGroupFilterBuilder] = useState(false);

  // Saved Views
  interface SavedView {
    id: string;
    name: string;
    type: 'keyword' | 'searchTerm' | 'adGroup';
    filters: Filter[];
  }
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSaveViewModal, setShowSaveViewModal] = useState<'keyword' | 'searchTerm' | 'adGroup' | null>(null);
  const [viewName, setViewName] = useState('');
  const [showViewsMenu, setShowViewsMenu] = useState<'keyword' | 'searchTerm' | 'adGroup' | null>(null);

  // Load saved views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('campaignSavedViews');
    if (saved) {
      setSavedViews(JSON.parse(saved));
    }
  }, []);

  // Save views to localStorage
  useEffect(() => {
    if (savedViews.length > 0) {
      localStorage.setItem('campaignSavedViews', JSON.stringify(savedViews));
    }
  }, [savedViews]);

  const saveCurrentView = (type: 'keyword' | 'searchTerm' | 'adGroup', name: string) => {
    const filters = type === 'keyword' ? keywordFilters :
                    type === 'searchTerm' ? searchTermFilters :
                    adGroupFilters;

    const newView: SavedView = {
      id: Date.now().toString(),
      name,
      type,
      filters,
    };

    setSavedViews([...savedViews, newView]);
    setShowSaveViewModal(null);
    setViewName('');
  };

  const loadView = (view: SavedView) => {
    if (view.type === 'keyword') {
      setKeywordFilters(view.filters);
    } else if (view.type === 'searchTerm') {
      setSearchTermFilters(view.filters);
    } else {
      setAdGroupFilters(view.filters);
    }
    setShowViewsMenu(null);
  };

  const deleteView = (viewId: string) => {
    setSavedViews(savedViews.filter(v => v.id !== viewId));
  };

  const getViewsForType = (type: 'keyword' | 'searchTerm' | 'adGroup') => {
    return savedViews.filter(v => v.type === type);
  };

  useEffect(() => {
    if (accountId && campaignId) {
      fetchCampaignDetail();
    }
  }, [accountId, campaignId, dateRange, customStartDate, customEndDate]);

  async function fetchCampaignDetail() {
    try {
      setLoading(true);
      let url = `/api/campaigns/${accountId}/${campaignId}?`;

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
      if (!response.ok) throw new Error('Failed to fetch campaign details');

      const data = await response.json();
      setAccount(data.account);
      setCampaign(data.campaign);
      setMetrics(data.metrics);
      setAdGroups(data.adGroups || []);
      setKeywords(data.keywords || []);
      setSearchTerms(data.searchTerms || []);
      setDevicePerformance(data.devicePerformance || {});
      setChartData(data.chartData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateCampaignStatus(newStatus: string) {
    if (!campaign) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/campaigns/${accountId}/${campaignId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update campaign status');

      setCampaign({ ...campaign, status: newStatus });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600 text-sm mb-4">{error || 'Campaign not found'}</p>
          <button
            onClick={() => router.push(`/campaigns/${accountId}`)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account?.currency || 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string | number) => {
    switch (status) {
      case 'ENABLED':
      case 2:
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 'REMOVED':
      case 4:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | number) => {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    switch (statusNum) {
      case 2: return 'ENABLED';
      case 3: return 'PAUSED';
      case 4: return 'REMOVED';
      default: return status.toString();
    }
  };

  const getBudgetTypeLabel = (budgetType: string | number) => {
    if (typeof budgetType === 'string' && !budgetType.match(/^\d+$/)) {
      return budgetType;
    }
    const typeNum = typeof budgetType === 'string' ? parseInt(budgetType) : budgetType;
    switch (typeNum) {
      case 2: return 'Standard';
      case 3: return 'Accelerated';
      case 4: return 'Fixed';
      default: return budgetType.toString();
    }
  };

  const getBiddingStrategyLabel = (strategy: string | number) => {
    if (typeof strategy === 'string' && !strategy.match(/^\d+$/)) {
      // If it's already a string label, format it nicely
      return strategy.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    const strategyNum = typeof strategy === 'string' ? parseInt(strategy) : strategy;
    switch (strategyNum) {
      case 2: return 'Target CPA';
      case 3: return 'Manual CPC';
      case 4: return 'Manual CPM';
      case 5: return 'Manual CPV';
      case 6: return 'Maximize Conversions';
      case 7: return 'Maximize Conversion Value';
      case 8: return 'Target ROAS';
      case 9: return 'Target Spend';
      case 10: return 'Target Impression Share';
      case 11: return 'Percent CPC';
      case 12: return 'Commission';
      default: return strategy.toString();
    }
  };

  const getChannelTypeLabel = (channelType: string | number) => {
    if (typeof channelType === 'string' && !channelType.match(/^\d+$/)) {
      return channelType.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    const channelNum = typeof channelType === 'string' ? parseInt(channelType) : channelType;
    switch (channelNum) {
      case 2: return 'Search';
      case 3: return 'Display';
      case 4: return 'Shopping';
      case 5: return 'Hotel';
      case 6: return 'Video';
      case 7: return 'Multi Channel';
      case 8: return 'Local';
      case 9: return 'Smart';
      case 10: return 'Performance Max';
      case 11: return 'Local Services';
      case 12: return 'Discovery';
      case 13: return 'Travel';
      default: return channelType.toString();
    }
  };

  const getDeviceLabel = (device: string | number) => {
    if (typeof device === 'string' && !device.match(/^\d+$/)) {
      // Already a string, format it nicely
      return device.charAt(0).toUpperCase() + device.slice(1).toLowerCase();
    }
    const deviceNum = typeof device === 'string' ? parseInt(device) : device;
    switch (deviceNum) {
      case 2: return 'Mobile';
      case 3: return 'Desktop';
      case 4: return 'Tablet';
      case 5: return 'Connected TV';
      default: return device.toString();
    }
  };

  const handleKeywordSort = (column: keyof Keyword) => {
    if (keywordSortColumn === column) {
      setKeywordSortDirection(keywordSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setKeywordSortColumn(column);
      setKeywordSortDirection('desc'); // Default to desc for metrics
    }
  };

  const handleSearchTermSort = (column: keyof SearchTerm) => {
    if (searchTermSortColumn === column) {
      setSearchTermSortDirection(searchTermSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSearchTermSortColumn(column);
      setSearchTermSortDirection('desc');
    }
  };

  const handleAdGroupSort = (column: keyof AdGroup) => {
    if (adGroupSortColumn === column) {
      setAdGroupSortDirection(adGroupSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAdGroupSortColumn(column);
      setAdGroupSortDirection('desc');
    }
  };

  // Apply filters
  const applyFilters = (items: any[], filters: Filter[]) => {
    return items.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        const filterValue = filter.value;

        switch (filter.operator) {
          case '=': return value === filterValue;
          case '!=': return value !== filterValue;
          case '<': return value < filterValue;
          case '<=': return value <= filterValue;
          case '>': return value > filterValue;
          case '>=': return value >= filterValue;
          default: return true;
        }
      });
    });
  };

  const addFilter = (type: 'keyword' | 'searchTerm' | 'adGroup', field: string, operator: FilterOperator, value: number) => {
    const newFilter = { field, operator, value };
    if (type === 'keyword') {
      setKeywordFilters([...keywordFilters, newFilter]);
      setShowKeywordFilterBuilder(false);
    } else if (type === 'searchTerm') {
      setSearchTermFilters([...searchTermFilters, newFilter]);
      setShowSearchTermFilterBuilder(false);
    } else {
      setAdGroupFilters([...adGroupFilters, newFilter]);
      setShowAdGroupFilterBuilder(false);
    }
  };

  const removeFilter = (type: 'keyword' | 'searchTerm' | 'adGroup', index: number) => {
    if (type === 'keyword') {
      setKeywordFilters(keywordFilters.filter((_, i) => i !== index));
    } else if (type === 'searchTerm') {
      setSearchTermFilters(searchTermFilters.filter((_, i) => i !== index));
    } else {
      setAdGroupFilters(adGroupFilters.filter((_, i) => i !== index));
    }
  };

  // Filter and sort keywords
  const filteredKeywords = applyFilters(keywords, keywordFilters);
  const sortedKeywords = [...filteredKeywords].sort((a, b) => {
    const aValue = a[keywordSortColumn];
    const bValue = b[keywordSortColumn];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return keywordSortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return keywordSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Filter and sort search terms
  const filteredSearchTerms = applyFilters(searchTerms, searchTermFilters);
  const sortedSearchTerms = [...filteredSearchTerms].sort((a, b) => {
    const aValue = a[searchTermSortColumn];
    const bValue = b[searchTermSortColumn];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return searchTermSortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return searchTermSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Filter and sort ad groups
  const filteredAdGroups = applyFilters(adGroups, adGroupFilters);
  const sortedAdGroups = [...filteredAdGroups].sort((a, b) => {
    const aValue = a[adGroupSortColumn];
    const bValue = b[adGroupSortColumn];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return adGroupSortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return adGroupSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Save View Modal Component
  const SaveViewModal = ({
    type,
    onSave,
    onClose
  }: {
    type: 'keyword' | 'searchTerm' | 'adGroup';
    onSave: (name: string) => void;
    onClose: () => void;
  }) => {
    const [name, setName] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Current View</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter view name (e.g., 'Zero Impressions', 'High Cost')"
            className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg text-gray-900 mb-4"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={() => name.trim() && onSave(name.trim())}
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save View
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filter Builder Component
  const FilterBuilder = ({
    type,
    fields,
    onAdd,
    onClose
  }: {
    type: 'keyword' | 'searchTerm' | 'adGroup';
    fields: { label: string; value: string }[];
    onAdd: (field: string, operator: FilterOperator, value: number) => void;
    onClose: () => void;
  }) => {
    const [field, setField] = useState(fields[0].value);
    const [operator, setOperator] = useState<FilterOperator>('=');
    const [value, setValue] = useState('0');

    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="px-3 py-1 text-sm border-2 border-gray-400 rounded text-gray-900"
        >
          {fields.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as FilterOperator)}
          className="px-3 py-1 text-sm border-2 border-gray-400 rounded text-gray-900"
        >
          <option value="=">=</option>
          <option value="!=">≠</option>
          <option value="<">&lt;</option>
          <option value="<=">≤</option>
          <option value=">">&gt;</option>
          <option value=">=">≥</option>
        </select>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="px-3 py-1 w-24 text-sm border-2 border-gray-400 rounded text-gray-900"
          placeholder="Value"
        />
        <button
          onClick={() => onAdd(field, operator, parseFloat(value))}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/campaigns/${accountId}`}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {account?.name} • Campaign ID: {campaignId}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                {getStatusLabel(campaign.status)}
              </span>
              {campaign.servingStatus && (
                <span className="text-sm text-gray-600">
                  Serving: {campaign.servingStatus}
                </span>
              )}
              {campaign.optimizationScore !== undefined && campaign.optimizationScore !== null && (
                <span className="text-sm text-gray-600">
                  Optimization Score: {(campaign.optimizationScore * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {campaign.status === 'ENABLED' || campaign.status === '2' ? (
                <button
                  onClick={() => updateCampaignStatus('PAUSED')}
                  disabled={updating}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50"
                >
                  Pause Campaign
                </button>
              ) : (
                <button
                  onClick={() => updateCampaignStatus('ENABLED')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  Enable Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="mb-6 flex items-center gap-4 bg-white rounded-lg shadow p-4">
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

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Impressions</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.impressions.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Clicks</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.clicks.toLocaleString()}</div>
            <div className="text-xs text-gray-600 mt-1">CTR: {metrics.ctr.toFixed(2)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Cost</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.cost)}</div>
            <div className="text-xs text-gray-600 mt-1">Avg CPC: {formatCurrency(metrics.avgCpc)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Conversions</div>
            <div className="text-2xl font-bold text-gray-900">{metrics.conversions.toLocaleString()}</div>
            <div className="text-xs text-gray-600 mt-1">Rate: {metrics.conversionRate.toFixed(2)}%</div>
          </div>
        </div>

        {/* Additional Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Avg CPM</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(metrics.avgCpm)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Cost/Conversion</div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.costPerConversion > 0 ? formatCurrency(metrics.costPerConversion) : '—'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Conversion Value</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(metrics.conversionsValue)}</div>
          </div>
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
              <select
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value as any)}
                className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-400 rounded-lg"
              >
                <option value="impressions">Impressions</option>
                <option value="clicks">Clicks</option>
                <option value="cost">Cost</option>
                <option value="conversions">Conversions</option>
              </select>
            </div>
            <div className="h-64 flex items-end gap-1">
              {chartData.map((point, idx) => {
                const maxValue = Math.max(...chartData.map(p => p[chartMetric]));
                const height = maxValue > 0 ? (point[chartMetric] / maxValue) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${point[chartMetric]}`}
                    ></div>
                    {chartData.length <= 30 && idx % Math.ceil(chartData.length / 10) === 0 && (
                      <div className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                        {point.date.slice(4, 6)}/{point.date.slice(6, 8)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Campaign Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Bidding</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Daily Budget</span>
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help"
                    title="Maximum amount you're willing to spend per day on this campaign"
                  >
                    ?
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(campaign.budget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Budget Type</span>
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help"
                    title={
                      campaign.budgetType === 'STANDARD' || campaign.budgetType === '2'
                        ? 'Standard: Budget is distributed evenly throughout the day'
                        : 'Accelerated: Budget is spent as quickly as possible (deprecated)'
                    }
                  >
                    ?
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{getBudgetTypeLabel(campaign.budgetType)}</span>
              </div>
              {campaign.isSharedBudget && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Budget Sharing</span>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help"
                      title="This budget is shared across multiple campaigns, allowing flexible allocation"
                    >
                      ?
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Shared</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Bidding Strategy</span>
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help"
                    title={
                      campaign.biddingStrategy === 'MANUAL_CPC' || campaign.biddingStrategy === '3'
                        ? 'Manual CPC: You set your own bids for clicks'
                        : campaign.biddingStrategy === 'TARGET_CPA' || campaign.biddingStrategy === '2'
                        ? 'Target CPA: Google automatically sets bids to get conversions at your target cost'
                        : campaign.biddingStrategy === 'MAXIMIZE_CONVERSIONS' || campaign.biddingStrategy === '6'
                        ? 'Maximize Conversions: Google automatically sets bids to get the most conversions within your budget'
                        : campaign.biddingStrategy === 'TARGET_ROAS' || campaign.biddingStrategy === '8'
                        ? 'Target ROAS: Google sets bids to maximize conversion value at your target return on ad spend'
                        : campaign.biddingStrategy === 'MAXIMIZE_CONVERSION_VALUE' || campaign.biddingStrategy === '7'
                        ? 'Maximize Conversion Value: Google sets bids to get the highest total conversion value'
                        : campaign.biddingStrategy === 'TARGET_SPEND' || campaign.biddingStrategy === '9'
                        ? 'Target Spend: Google sets bids to spend your entire budget and get maximum clicks'
                        : 'Automated bidding strategy optimized for your campaign goals'
                    }
                  >
                    ?
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{getBiddingStrategyLabel(campaign.biddingStrategy)}</span>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Date</span>
                <span className="text-sm font-medium text-gray-900">{campaign.startDate || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Date</span>
                <span className="text-sm font-medium text-gray-900">{campaign.endDate || 'No end date'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time Zone</span>
                <span className="text-sm font-medium text-gray-900">{account?.timeZone}</span>
              </div>
            </div>
          </div>

          {/* Campaign Type Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Type</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Channel Type</span>
                <span className="text-sm font-medium text-gray-900">{getChannelTypeLabel(campaign.advertisingChannelType)}</span>
              </div>
              {campaign.advertisingChannelSubType && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sub Type</span>
                  <span className="text-sm font-medium text-gray-900">{campaign.advertisingChannelSubType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Network Settings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Settings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Google Search</span>
                <span className={`text-sm font-medium ${campaign.networkSettings.targetGoogleSearch ? 'text-green-600' : 'text-gray-400'}`}>
                  {campaign.networkSettings.targetGoogleSearch ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Search Partners</span>
                <span className={`text-sm font-medium ${campaign.networkSettings.targetPartnerSearchNetwork ? 'text-green-600' : 'text-gray-400'}`}>
                  {campaign.networkSettings.targetPartnerSearchNetwork ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Display Network</span>
                <span className={`text-sm font-medium ${campaign.networkSettings.targetContentNetwork ? 'text-green-600' : 'text-gray-400'}`}>
                  {campaign.networkSettings.targetContentNetwork ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Performance */}
        {Object.keys(devicePerformance).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Device</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(devicePerformance).map(([device, perf]: [string, any]) => {
                    const ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
                    return (
                      <tr key={device}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getDeviceLabel(device)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {perf.impressions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {perf.clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {ctr.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(perf.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {perf.conversions.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Keywords Performance */}
        {keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Keywords Performance ({sortedKeywords.length}{filteredKeywords.length !== keywords.length && ` of ${keywords.length}`})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Top performing keywords by conversions and clicks</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Saved Views Dropdown */}
                  {getViewsForType('keyword').length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowViewsMenu(showViewsMenu === 'keyword' ? null : 'keyword')}
                        className="px-4 py-2 bg-white border-2 border-gray-400 text-gray-900 text-sm rounded-lg hover:bg-gray-50 font-medium"
                      >
                        📁 Saved Views ({getViewsForType('keyword').length})
                      </button>
                      {showViewsMenu === 'keyword' && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-10">
                          <div className="p-2">
                            {getViewsForType('keyword').map(view => (
                              <div key={view.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <button
                                  onClick={() => loadView(view)}
                                  className="flex-1 text-left text-sm text-gray-900"
                                >
                                  {view.name}
                                  <span className="text-xs text-gray-500 ml-2">({view.filters.length} filters)</span>
                                </button>
                                <button
                                  onClick={() => deleteView(view.id)}
                                  className="ml-2 text-red-600 hover:text-red-800"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Save View Button */}
                  {keywordFilters.length > 0 && (
                    <button
                      onClick={() => setShowSaveViewModal('keyword')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                    >
                      💾 Save View
                    </button>
                  )}
                  {/* Add Filter Button */}
                  <button
                    onClick={() => setShowKeywordFilterBuilder(!showKeywordFilterBuilder)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Add Filter
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {keywordFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keywordFilters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      <span className="text-gray-700">
                        {filter.field} {filter.operator} {filter.value}
                      </span>
                      <button
                        onClick={() => removeFilter('keyword', idx)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setKeywordFilters([])}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Filter Builder */}
              {showKeywordFilterBuilder && (
                <div className="mt-3">
                  <FilterBuilder
                    type="keyword"
                    fields={[
                      { label: 'Impressions', value: 'impressions' },
                      { label: 'Clicks', value: 'clicks' },
                      { label: 'Cost', value: 'cost' },
                      { label: 'Conversions', value: 'conversions' },
                      { label: 'Quality Score', value: 'qualityScore' },
                    ]}
                    onAdd={(field, operator, value) => addFilter('keyword', field, operator, value)}
                    onClose={() => setShowKeywordFilterBuilder(false)}
                  />
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleKeywordSort('text')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Keyword</span>
                        {keywordSortColumn === 'text' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('matchType')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Match Type</span>
                        {keywordSortColumn === 'matchType' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('adGroupName')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Ad Group</span>
                        {keywordSortColumn === 'adGroupName' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('qualityScore')}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Quality Score</span>
                        {keywordSortColumn === 'qualityScore' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {keywordSortColumn === 'status' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('impressions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Impressions</span>
                        {keywordSortColumn === 'impressions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('clicks')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Clicks</span>
                        {keywordSortColumn === 'clicks' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                    <th
                      onClick={() => handleKeywordSort('cost')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Cost</span>
                        {keywordSortColumn === 'cost' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleKeywordSort('conversions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Conversions</span>
                        {keywordSortColumn === 'conversions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {keywordSortDirection === 'asc' ? (
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
                  {sortedKeywords.map((keyword) => {
                      const ctr = keyword.impressions > 0 ? (keyword.clicks / keyword.impressions) * 100 : 0;
                      return (
                        <tr key={keyword.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{keyword.text}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded ${
                                keyword.matchType === 'EXACT' ? 'bg-indigo-100 text-indigo-800' :
                                keyword.matchType === 'PHRASE' ? 'bg-teal-100 text-teal-800' :
                                'bg-amber-100 text-amber-800'
                              }`}
                              title={
                                keyword.matchType === 'EXACT' ? 'Exact Match - Shows only for exact search' :
                                keyword.matchType === 'PHRASE' ? 'Phrase Match - Shows for queries containing phrase' :
                                'Broad Match - Shows for related searches'
                              }
                            >
                              {keyword.matchType === 'EXACT' ? 'E' :
                               keyword.matchType === 'PHRASE' ? 'P' :
                               'B'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {keyword.adGroupName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {keyword.qualityScore ? (
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                keyword.qualityScore >= 7 ? 'bg-green-100 text-green-800' :
                                keyword.qualityScore >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {keyword.qualityScore}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(keyword.status)}`}>
                              {getStatusLabel(keyword.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {keyword.impressions.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {keyword.clicks.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {ctr.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(keyword.cost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {keyword.conversions.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search Terms */}
        {searchTerms.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Terms ({sortedSearchTerms.length}{filteredSearchTerms.length !== searchTerms.length && ` of ${searchTerms.length}`})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Actual search queries that triggered your ads</p>
                </div>
                <div className="flex items-center gap-2">
                  {getViewsForType('searchTerm').length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowViewsMenu(showViewsMenu === 'searchTerm' ? null : 'searchTerm')}
                        className="px-4 py-2 bg-white border-2 border-gray-400 text-gray-900 text-sm rounded-lg hover:bg-gray-50 font-medium"
                      >
                        📁 Saved Views ({getViewsForType('searchTerm').length})
                      </button>
                      {showViewsMenu === 'searchTerm' && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-10">
                          <div className="p-2">
                            {getViewsForType('searchTerm').map(view => (
                              <div key={view.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <button
                                  onClick={() => loadView(view)}
                                  className="flex-1 text-left text-sm text-gray-900"
                                >
                                  {view.name}
                                  <span className="text-xs text-gray-500 ml-2">({view.filters.length} filters)</span>
                                </button>
                                <button
                                  onClick={() => deleteView(view.id)}
                                  className="ml-2 text-red-600 hover:text-red-800"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {searchTermFilters.length > 0 && (
                    <button
                      onClick={() => setShowSaveViewModal('searchTerm')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                    >
                      💾 Save View
                    </button>
                  )}
                  <button
                    onClick={() => setShowSearchTermFilterBuilder(!showSearchTermFilterBuilder)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Add Filter
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {searchTermFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {searchTermFilters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      <span className="text-gray-700">
                        {filter.field} {filter.operator} {filter.value}
                      </span>
                      <button
                        onClick={() => removeFilter('searchTerm', idx)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSearchTermFilters([])}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Filter Builder */}
              {showSearchTermFilterBuilder && (
                <div className="mt-3">
                  <FilterBuilder
                    type="searchTerm"
                    fields={[
                      { label: 'Impressions', value: 'impressions' },
                      { label: 'Clicks', value: 'clicks' },
                      { label: 'Cost', value: 'cost' },
                      { label: 'Conversions', value: 'conversions' },
                    ]}
                    onAdd={(field, operator, value) => addFilter('searchTerm', field, operator, value)}
                    onClose={() => setShowSearchTermFilterBuilder(false)}
                  />
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSearchTermSort('searchTerm')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Search Term</span>
                        {searchTermSortColumn === 'searchTerm' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSearchTermSort('adGroupName')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Ad Group</span>
                        {searchTermSortColumn === 'adGroupName' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSearchTermSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {searchTermSortColumn === 'status' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSearchTermSort('impressions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Impressions</span>
                        {searchTermSortColumn === 'impressions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSearchTermSort('clicks')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Clicks</span>
                        {searchTermSortColumn === 'clicks' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                    <th
                      onClick={() => handleSearchTermSort('cost')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Cost</span>
                        {searchTermSortColumn === 'cost' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSearchTermSort('conversions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Conversions</span>
                        {searchTermSortColumn === 'conversions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {searchTermSortDirection === 'asc' ? (
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
                  {sortedSearchTerms.map((term, idx) => {
                    const ctr = term.impressions > 0 ? (term.clicks / term.impressions) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-md">
                            {term.searchTerm}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {term.adGroupName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              term.status === 'ADDED' ? 'bg-green-100 text-green-800' :
                              term.status === 'EXCLUDED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                            title={
                              term.status === 'ADDED' ? 'Added as keyword' :
                              term.status === 'EXCLUDED' ? 'Excluded (negative keyword)' :
                              'Not yet added or excluded'
                            }
                          >
                            {term.status === 'ADDED' ? '✓ Added as Keyword' :
                             term.status === 'EXCLUDED' ? '✗ Excluded' :
                             '— Not Added'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {term.impressions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {term.clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {ctr.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(term.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {term.conversions.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ad Groups Table */}
        {adGroups.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ad Groups ({sortedAdGroups.length}{filteredAdGroups.length !== adGroups.length && ` of ${adGroups.length}`})
                </h3>
                <div className="flex items-center gap-2">
                  {getViewsForType('adGroup').length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowViewsMenu(showViewsMenu === 'adGroup' ? null : 'adGroup')}
                        className="px-4 py-2 bg-white border-2 border-gray-400 text-gray-900 text-sm rounded-lg hover:bg-gray-50 font-medium"
                      >
                        📁 Saved Views ({getViewsForType('adGroup').length})
                      </button>
                      {showViewsMenu === 'adGroup' && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-10">
                          <div className="p-2">
                            {getViewsForType('adGroup').map(view => (
                              <div key={view.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <button
                                  onClick={() => loadView(view)}
                                  className="flex-1 text-left text-sm text-gray-900"
                                >
                                  {view.name}
                                  <span className="text-xs text-gray-500 ml-2">({view.filters.length} filters)</span>
                                </button>
                                <button
                                  onClick={() => deleteView(view.id)}
                                  className="ml-2 text-red-600 hover:text-red-800"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {adGroupFilters.length > 0 && (
                    <button
                      onClick={() => setShowSaveViewModal('adGroup')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                    >
                      💾 Save View
                    </button>
                  )}
                  <button
                    onClick={() => setShowAdGroupFilterBuilder(!showAdGroupFilterBuilder)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Add Filter
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {adGroupFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {adGroupFilters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      <span className="text-gray-700">
                        {filter.field} {filter.operator} {filter.value}
                      </span>
                      <button
                        onClick={() => removeFilter('adGroup', idx)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setAdGroupFilters([])}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Filter Builder */}
              {showAdGroupFilterBuilder && (
                <div className="mt-3">
                  <FilterBuilder
                    type="adGroup"
                    fields={[
                      { label: 'Impressions', value: 'impressions' },
                      { label: 'Clicks', value: 'clicks' },
                      { label: 'Cost', value: 'cost' },
                      { label: 'Conversions', value: 'conversions' },
                      { label: 'CPC Bid', value: 'cpcBid' },
                    ]}
                    onAdd={(field, operator, value) => addFilter('adGroup', field, operator, value)}
                    onClose={() => setShowAdGroupFilterBuilder(false)}
                  />
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleAdGroupSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Name</span>
                        {adGroupSortColumn === 'name' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleAdGroupSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {adGroupSortColumn === 'status' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleAdGroupSort('cpcBid')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>CPC Bid</span>
                        {adGroupSortColumn === 'cpcBid' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleAdGroupSort('impressions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Impressions</span>
                        {adGroupSortColumn === 'impressions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleAdGroupSort('clicks')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Clicks</span>
                        {adGroupSortColumn === 'clicks' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleAdGroupSort('cost')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Cost</span>
                        {adGroupSortColumn === 'cost' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
                              <path d="M5 10l5-5 5 5H5z" />
                            ) : (
                              <path d="M15 10l-5 5-5-5h10z" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleAdGroupSort('conversions')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Conversions</span>
                        {adGroupSortColumn === 'conversions' && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            {adGroupSortDirection === 'asc' ? (
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
                  {sortedAdGroups.map((adGroup) => (
                    <tr key={adGroup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{adGroup.name}</div>
                        <div className="text-xs text-gray-500">ID: {adGroup.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(adGroup.status)}`}>
                          {getStatusLabel(adGroup.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(adGroup.cpcBid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {adGroup.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {adGroup.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(adGroup.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {adGroup.conversions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Save View Modals */}
      {showSaveViewModal && (
        <SaveViewModal
          type={showSaveViewModal}
          onSave={(name) => saveCurrentView(showSaveViewModal, name)}
          onClose={() => setShowSaveViewModal(null)}
        />
      )}
    </div>
  );
}
