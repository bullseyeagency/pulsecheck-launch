'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Activity, Download, Loader2 } from 'lucide-react';

const TIME_RANGES = [
  { value: 'past_hour', label: 'Past Hour' },
  { value: 'past_4_hours', label: 'Past 4 Hours' },
  { value: 'past_day', label: 'Past Day' },
  { value: 'past_7_days', label: 'Past 7 Days' },
  { value: 'past_30_days', label: 'Past 30 Days' },
  { value: 'past_90_days', label: 'Past 90 Days' },
  { value: 'past_12_months', label: 'Past 12 Months' },
  { value: 'past_5_years', label: 'Past 5 Years' },
];

const CHART_COLORS = ['#EF5744', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

interface TrendPoint {
  date: string;
  timestamp?: string;
  values: { query: string; value: number }[];
}

export default function GoogleTrendsPage() {
  const [keywordsInput, setKeywordsInput] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [timeRange, setTimeRange] = useState('past_12_months');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const kws = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (!kws.length) return;

    setLoading(true);
    setError('');
    setTrendData([]);
    setKeywords(kws);

    try {
      const res = await fetch('/api/keywords-data/google-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: kws,
          location_code: locationCode,
          language_code: 'en',
          time_range: timeRange,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      // Parse results — DataForSEO returns items with type "google_trends_graph"
      const items = data.results?.[0]?.items || data.results || [];
      const graphItem = items.find((item: any) => item.type === 'google_trends_graph') || items[0];
      const points: TrendPoint[] = graphItem?.data || [];
      setTrendData(points);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!trendData.length) return;
    const headers = ['Date', ...keywords];
    const rows = trendData.map((point) => {
      const vals = keywords.map((kw) => {
        const match = point.values?.find((v) => v.query === kw);
        return match?.value ?? '';
      });
      return [point.date || point.timestamp || '', ...vals];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-trends.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find max value across all data for chart scaling
  const maxValue = trendData.reduce((max, point) => {
    const pointMax = Math.max(...(point.values || []).map((v) => v.value));
    return Math.max(max, pointMax);
  }, 0) || 100;

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Google Trends</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Explore search interest over time for up to 5 keywords (comma separated).
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Keywords (comma separated, max 5)</label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g. seo, ppc, social media marketing"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-1.5">Location Code</label>
                  <input
                    type="number"
                    value={locationCode}
                    onChange={(e) => setLocationCode(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-1.5">Time Range</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                  >
                    {TIME_RANGES.map((tr) => (
                      <option key={tr.value} value={tr.value}>
                        {tr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !keywordsInput.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Explore Trends'}
              </button>
              {trendData.length > 0 && (
                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#2a2a2a] text-[#a1a1aa] hover:text-white rounded text-sm transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              )}
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Chart */}
          {trendData.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white">Interest Over Time</h2>
                <div className="flex items-center gap-4">
                  {keywords.map((kw, i) => (
                    <div key={kw} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-[#a1a1aa]">{kw}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line chart using divs */}
              <div className="relative h-48 flex items-end gap-px">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[10px] text-[#8b8b93] font-mono">
                  <span>{maxValue}</span>
                  <span>{Math.round(maxValue / 2)}</span>
                  <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 flex-1 flex items-end gap-px relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-[#2a2a2a]" />
                    <div className="border-b border-[#2a2a2a]" />
                    <div className="border-b border-[#2a2a2a]" />
                  </div>

                  {/* Bars per data point */}
                  {trendData.map((point, pi) => (
                    <div
                      key={pi}
                      className="flex-1 flex items-end gap-px min-w-0"
                      title={point.date || point.timestamp || ''}
                    >
                      {keywords.map((kw, ki) => {
                        const match = point.values?.find((v) => v.query === kw);
                        const value = match?.value ?? 0;
                        const height = maxValue > 0 ? (value / maxValue) * 192 : 0;
                        return (
                          <div
                            key={kw}
                            className="flex-1 rounded-t transition-all duration-200 hover:opacity-100 opacity-80 min-w-[2px]"
                            style={{
                              height: `${Math.max(1, height)}px`,
                              backgroundColor: CHART_COLORS[ki % CHART_COLORS.length],
                            }}
                            title={`${kw}: ${value}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="ml-10 flex justify-between mt-2">
                {trendData.length > 0 && (
                  <>
                    <span className="text-[10px] text-[#8b8b93] font-mono">
                      {trendData[0]?.date || trendData[0]?.timestamp || ''}
                    </span>
                    <span className="text-[10px] text-[#8b8b93] font-mono">
                      {trendData[trendData.length - 1]?.date || trendData[trendData.length - 1]?.timestamp || ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Data Table */}
          {trendData.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">{trendData.length} data points</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Date</th>
                      {keywords.map((kw) => (
                        <th key={kw} className="px-4 py-3 text-[#8b8b93] font-medium text-right">
                          {kw}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {trendData.map((point, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">
                          {point.date || point.timestamp || '-'}
                        </td>
                        {keywords.map((kw) => {
                          const match = point.values?.find((v) => v.query === kw);
                          return (
                            <td key={kw} className="px-4 py-3 text-[#a1a1aa] font-mono text-right">
                              {match?.value ?? '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && trendData.length === 0 && keywordsInput.trim() && (
            <div className="text-center py-12 text-[#8b8b93] text-sm">
              No trends data found. Try different keywords or time range.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
