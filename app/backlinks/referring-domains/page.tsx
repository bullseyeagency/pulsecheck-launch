'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Globe, Download, Loader2 } from 'lucide-react';

interface ReferringDomain {
  domain?: string;
  rank?: number;
  backlinks?: number;
  first_seen?: string;
  lost_date?: string;
}

export default function ReferringDomainsPage() {
  const [target, setTarget] = useState('');
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ReferringDomain[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/backlinks/referring-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim(), limit }),
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
    const headers = ['Domain', 'Rank', 'Backlinks', 'First Seen', 'Lost Date'];
    const rows = results.map((r) => [
      r.domain || '',
      r.rank ?? '',
      r.backlinks ?? '',
      r.first_seen || '',
      r.lost_date || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referring-domains-${target.trim()}.csv`;
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
            <Globe className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Referring Domains</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Discover which domains are linking to your target.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <span className="text-sm text-[#a1a1aa]">{results.length} referring domains found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Domain</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Rank</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Backlinks</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">First Seen</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Lost Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {results.map((item, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-[#EF5744] font-mono text-xs">{item.domain || '-'}</td>
                        <td className="px-4 py-3 text-white font-mono">{item.rank ?? '-'}</td>
                        <td className="px-4 py-3 text-white font-mono">{item.backlinks?.toLocaleString() ?? '-'}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">{item.first_seen || '-'}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">{item.lost_date || '-'}</td>
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
              No referring domains found. Try a different domain.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
