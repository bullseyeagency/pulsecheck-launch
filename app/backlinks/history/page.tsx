'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Clock, Download, Loader2 } from 'lucide-react';

interface HistoryItem {
  date?: string;
  new_backlinks?: number;
  lost_backlinks?: number;
  new_referring_domains?: number;
  lost_referring_domains?: number;
  backlinks?: number;
  referring_domains?: number;
  rank?: number;
}

export default function BacklinksHistoryPage() {
  const [target, setTarget] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<HistoryItem[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/backlinks/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: target.trim(),
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items || [];
      setResults(items);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Date', 'Backlinks', 'Referring Domains', 'New Backlinks', 'Lost Backlinks', 'New Ref. Domains', 'Lost Ref. Domains', 'Rank'];
    const rows = results.map((r) => [
      r.date || '',
      r.backlinks ?? '',
      r.referring_domains ?? '',
      r.new_backlinks ?? '',
      r.lost_backlinks ?? '',
      r.new_referring_domains ?? '',
      r.lost_referring_domains ?? '',
      r.rank ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backlinks-history-${target.trim()}.csv`;
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
            <Clock className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Backlink History</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Track how backlink counts have changed over time for any domain.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Target Domain</label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !target.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </button>
              {results.length > 0 && (
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

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">{results.length} history records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Date</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Backlinks</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Ref. Domains</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">New BL</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Lost BL</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">New Ref. D</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Lost Ref. D</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {results.map((item, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">{item.date || '-'}</td>
                        <td className="px-4 py-3 text-white font-mono">{item.backlinks?.toLocaleString() ?? '-'}</td>
                        <td className="px-4 py-3 text-white font-mono">{item.referring_domains?.toLocaleString() ?? '-'}</td>
                        <td className="px-4 py-3">
                          {item.new_backlinks != null ? (
                            <span className="text-green-400 font-mono">+{item.new_backlinks.toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {item.lost_backlinks != null ? (
                            <span className="text-red-400 font-mono">-{item.lost_backlinks.toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {item.new_referring_domains != null ? (
                            <span className="text-green-400 font-mono">+{item.new_referring_domains.toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {item.lost_referring_domains != null ? (
                            <span className="text-red-400 font-mono">-{item.lost_referring_domains.toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono">{item.rank ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && target && (
            <div className="text-center py-12 text-[#8b8b93] text-sm">
              No history data found. Try a different domain or date range.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
