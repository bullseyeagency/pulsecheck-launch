'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { TrendingUp, Download, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#EF5744', '#4ade80', '#38bdf8', '#fbbf24', '#a78bfa'];

const LOCATIONS = [
  { code: 2840, label: 'United States' },
  { code: 2826, label: 'United Kingdom' },
  { code: 2124, label: 'Canada' },
  { code: 2036, label: 'Australia' },
  { code: 2276, label: 'Germany' },
  { code: 2250, label: 'France' },
  { code: 2724, label: 'Spain' },
  { code: 2380, label: 'Italy' },
  { code: 2076, label: 'Brazil' },
  { code: 2356, label: 'India' },
];

const TYPES = [
  { value: 'web', label: 'Web' },
  { value: 'news', label: 'News' },
  { value: 'ecommerce', label: 'Ecommerce' },
];

const TIME_RANGES = [
  { value: 'past_30_days', label: 'Past 30 Days' },
  { value: 'past_90_days', label: 'Past 90 Days' },
  { value: 'past_12_months', label: 'Past 12 Months' },
  { value: 'past_5_years', label: 'Past 5 Years' },
];

interface TrendDataPoint {
  date: string;
  [keyword: string]: string | number;
}

interface KeywordAverage {
  keyword: string;
  average: number;
  max: number;
  min: number;
}

export default function DataForSEOTrendsPage() {
  const [keywordsInput, setKeywordsInput] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [type, setType] = useState('web');
  const [timeRange, setTimeRange] = useState('past_12_months');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [averages, setAverages] = useState<KeywordAverage[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const kws = keywordsInput
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 5);
    if (!kws.length) return;

    setLoading(true);
    setError('');
    setChartData([]);
    setKeywords([]);
    setAverages([]);

    try {
      const res = await fetch('/api/keywords-data/dataforseo-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: kws,
          location_code: locationCode,
          type,
          time_range: timeRange,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results || [];
      if (!items.length) {
        setError('No trend data returned. Try different keywords.');
        return;
      }

      // Parse the DataForSEO trends response
      // The response contains items with keyword-level data points
      const dateMap: Record<string, Record<string, number>> = {};
      const kwAverages: Record<string, number[]> = {};

      for (const item of items) {
        if (item.items) {
          for (const trendItem of item.items) {
            const keyword = trendItem.keyword || trendItem.keywords?.[0] || '';
            if (!kwAverages[keyword]) kwAverages[keyword] = [];

            const dataPoints = trendItem.data || trendItem.items || [];
            if (Array.isArray(dataPoints)) {
              for (const dp of dataPoints) {
                const date = dp.date_from?.split(' ')[0] || dp.date || '';
                if (!date) continue;
                if (!dateMap[date]) dateMap[date] = {};
                const value = dp.values?.[0]?.value ?? dp.value ?? 0;
                dateMap[date][keyword] = value;
                kwAverages[keyword].push(value);
              }
            }
          }
        }

        // Also handle flat data array at item level
        if (item.data && Array.isArray(item.data)) {
          for (const dp of item.data) {
            const date = dp.date_from?.split(' ')[0] || dp.date || '';
            if (!date) continue;
            if (!dateMap[date]) dateMap[date] = {};
            for (const kw of kws) {
              const value = dp.values?.find((v: any) => v.keyword === kw)?.value ?? 0;
              if (value !== undefined) {
                dateMap[date][kw] = value;
                if (!kwAverages[kw]) kwAverages[kw] = [];
                kwAverages[kw].push(value);
              }
            }
          }
        }
      }

      // Build chart data sorted by date
      const sortedDates = Object.keys(dateMap).sort();
      const chart: TrendDataPoint[] = sortedDates.map((date) => ({
        date,
        ...dateMap[date],
      }));

      // Compute averages
      const detectedKeywords = Object.keys(kwAverages).filter((k) => kwAverages[k].length > 0);
      const avgs: KeywordAverage[] = detectedKeywords.map((kw) => {
        const vals = kwAverages[kw];
        return {
          keyword: kw,
          average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          max: Math.max(...vals),
          min: Math.min(...vals),
        };
      });

      setKeywords(detectedKeywords.length ? detectedKeywords : kws);
      setChartData(chart);
      setAverages(avgs);

      if (!chart.length) {
        setError('Trend data received but could not be parsed into chart format. Check the raw response in the console.');
        console.log('Raw DataForSEO trends response:', items);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!chartData.length) return;
    const headers = ['Date', ...keywords];
    const rows = chartData.map((row) => [
      row.date,
      ...keywords.map((kw) => row[kw] ?? ''),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dataforseo-trends.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">DataForSEO Trends</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Compare keyword popularity over time. Enter up to 5 keywords to see how their search interest changes.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Keywords (one per line, max 5)</label>
                <textarea
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder={"digital marketing\nseo agency\ncontent marketing"}
                  rows={5}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors resize-none"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-1.5">Location</label>
                  <select
                    value={locationCode}
                    onChange={(e) => setLocationCode(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.code} value={loc.code}>{loc.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-1.5">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-1.5">Time Range</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                  >
                    {TIME_RANGES.map((tr) => (
                      <option key={tr.value} value={tr.value}>{tr.label}</option>
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
              {chartData.length > 0 && (
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
          {chartData.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
              <div className="mb-4">
                <h2 className="text-white text-sm font-semibold">Trend Comparison</h2>
                <p className="text-[#8b8b93] text-xs mt-1">Popularity score (0-100) over time</p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#8b8b93', fontSize: 11 }}
                      stroke="#2a2a2a"
                      tickFormatter={(value: string) => {
                        const d = new Date(value);
                        return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#8b8b93', fontSize: 11 }}
                      stroke="#2a2a2a"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                    />
                    {keywords.map((kw, i) => (
                      <Line
                        key={kw}
                        type="monotone"
                        dataKey={kw}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Averages Table */}
          {averages.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">Keyword Averages</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Keyword</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Average</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Max</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Min</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {averages.map((item, i) => (
                      <tr key={item.keyword} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">{item.keyword}</td>
                        <td className="px-4 py-3 text-white font-mono text-right">{item.average}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-right">{item.max}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-right">{item.min}</td>
                        <td className="px-4 py-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && chartData.length === 0 && keywordsInput.trim() && (
            <div className="text-center py-12 text-[#8b8b93] text-sm">
              No results found. Try different keywords.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
