'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Link2, Download, Loader2 } from 'lucide-react';

interface BacklinkItem {
  url_from?: string;
  domain_from?: string;
  url_to?: string;
  anchor?: string;
  rank?: number;
  page_from_rank?: number;
  is_new?: boolean;
  is_lost?: boolean;
}

const ORDER_OPTIONS = [
  { value: 'rank,desc', label: 'Rank (High to Low)' },
  { value: 'rank,asc', label: 'Rank (Low to High)' },
  { value: 'page_from_rank,desc', label: 'Page Rank (High to Low)' },
  { value: 'page_from_rank,asc', label: 'Page Rank (Low to High)' },
];

export default function BacklinksListPage() {
  const [target, setTarget] = useState('');
  const [limit, setLimit] = useState(100);
  const [orderBy, setOrderBy] = useState('rank,desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<BacklinkItem[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/backlinks/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: target.trim(),
          limit,
          order_by: [orderBy],
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
    const headers = ['URL From', 'Domain From', 'URL To', 'Anchor', 'Rank', 'Page From Rank', 'Is New', 'Is Lost'];
    const rows = results.map((r) => [
      r.url_from || '',
      r.domain_from || '',
      r.url_to || '',
      (r.anchor || '').replace(/"/g, '""'),
      r.rank ?? '',
      r.page_from_rank ?? '',
      r.is_new ?? '',
      r.is_lost ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backlinks-${target.trim()}.csv`;
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
            <Link2 className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Backlinks List</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Get a detailed list of backlinks pointing to any domain.
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
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Order By</label>
                <select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                >
                  {ORDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Limit: {limit}</label>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full accent-[#EF5744] mt-2"
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
                <span className="text-sm text-[#a1a1aa]">{results.length} backlinks found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">URL From</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Domain From</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">URL To</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Anchor</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Rank</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Page Rank</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">New</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {results.map((item, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-[#EF5744] font-mono text-xs max-w-[200px] truncate">
                          {item.url_from || '-'}
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-xs">{item.domain_from || '-'}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs max-w-[200px] truncate">
                          {item.url_to || '-'}
                        </td>
                        <td className="px-4 py-3 text-white max-w-[150px] truncate">{item.anchor || '-'}</td>
                        <td className="px-4 py-3 text-white font-mono">{item.rank ?? '-'}</td>
                        <td className="px-4 py-3 text-white font-mono">{item.page_from_rank ?? '-'}</td>
                        <td className="px-4 py-3">
                          {item.is_new ? (
                            <span className="text-green-400 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-[#8b8b93] text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.is_lost ? (
                            <span className="text-red-400 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-[#8b8b93] text-xs">No</span>
                          )}
                        </td>
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
              No backlinks found. Try a different domain.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
