'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { TrendingUp, Loader2, Download } from 'lucide-react';

interface TrendPoint {
  date?: string;
  count?: number;
  top_domains_count?: number;
  sentiment_connotations?: { positive?: number; negative?: number; neutral?: number };
}

export default function PhraseTrendsPage() {
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setTrends([]);

    try {
      const res = await fetch('/api/content-analysis/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const result = data.results?.[0];
      setTotalCount(result?.total_count || 0);
      const items = result?.items || [];
      setTrends(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...trends.map((t) => t.count || 0), 1);

  const exportCSV = () => {
    if (trends.length === 0) return;

    const headers = ['Date', 'Citations', 'Domains', 'Positive', 'Negative', 'Neutral'];
    const rows = trends.map((t) => [
      t.date || '',
      t.count || 0,
      t.top_domains_count || 0,
      t.sentiment_connotations?.positive || 0,
      t.sentiment_connotations?.negative || 0,
      t.sentiment_connotations?.neutral || 0,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phrase-trends-${keyword.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-7 w-7 text-[#EF5744]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Phrase Trends</h1>
              <p className="text-[#8b8b93] text-sm mt-1">
                Track citation frequency over time for any keyword.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. machine learning"
                  required
                  className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded disabled:opacity-50 transition-colors text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Get Trends'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {trends.length > 0 && (
            <div className="space-y-6">
              {/* Summary + Export */}
              <div className="flex items-center justify-between">
                <p className="text-[#a1a1aa] text-sm">
                  Total citations: <span className="text-white font-semibold">{totalCount.toLocaleString()}</span>
                </p>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#a1a1aa] hover:text-white border border-[#2a2a2a] rounded hover:border-[#EF5744] transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>

              {/* Bar Chart */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                <p className="text-white font-semibold mb-4">Citation Frequency Over Time</p>
                <div className="flex items-end gap-1 h-48">
                  {trends.map((t, i) => {
                    const height = ((t.count || 0) / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div
                          className="w-full bg-[#EF5744] rounded-t hover:bg-[#c93a2a] transition-colors min-h-[2px]"
                          style={{ height: `${height}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                            <p className="text-white font-semibold">{(t.count || 0).toLocaleString()} citations</p>
                            {t.date && <p className="text-[#8b8b93] mt-0.5">{t.date}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* X-axis labels */}
                <div className="flex gap-1 mt-2">
                  {trends.map((t, i) => (
                    <div key={i} className="flex-1 text-center">
                      {(i === 0 || i === trends.length - 1 || i % Math.ceil(trends.length / 6) === 0) && (
                        <span className="text-[#8b8b93] text-[10px]">
                          {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Citations</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Domains</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Positive</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Negative</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Neutral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t, i) => (
                      <tr key={i} className="border-b border-[#2a2a2a]/50 hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-4 py-2.5 text-sm text-white">{t.date || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-sm text-[#EF5744] font-semibold text-right">{(t.count || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-sm text-[#a1a1aa] text-right">{(t.top_domains_count || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-sm text-green-400 text-right">{(t.sentiment_connotations?.positive || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-sm text-red-400 text-right">{(t.sentiment_connotations?.negative || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-sm text-yellow-400 text-right">{(t.sentiment_connotations?.neutral || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
