'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { BarChart2, Loader2, Download } from 'lucide-react';

interface StatEntry {
  date?: string;
  country_iso_code?: string;
  domains_count?: number;
  [key: string]: unknown;
}

export default function TechStatsPage() {
  const [technology, setTechnology] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [flatStats, setFlatStats] = useState<StatEntry[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technology.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setFlatStats([]);

    try {
      const res = await fetch('/api/domain-analytics/tech-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technology: technology.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const raw = data.results || [];
      setResults(raw);

      // Try to flatten into a table-friendly format
      // The API may return data in various structures; handle common patterns
      const stats: StatEntry[] = [];
      for (const result of raw) {
        if (result.items && Array.isArray(result.items)) {
          stats.push(...result.items);
        } else if (result.date || result.country_iso_code) {
          stats.push(result);
        }
      }
      setFlatStats(stats);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!flatStats.length) return;
    const headers = ['Date', 'Country', 'Domains Count'];
    const rows = flatStats.map((s) => [
      s.date || '',
      s.country_iso_code || '',
      s.domains_count ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech-stats-${technology.trim()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple bar chart rendering
  const maxCount = Math.max(...flatStats.map((s) => s.domains_count || 0), 1);

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Technology Stats</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            View historical domain counts over time for a specific technology.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Technology Name</label>
                <input
                  type="text"
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  placeholder="e.g. Shopify"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !technology.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Stats'}
              </button>
              {flatStats.length > 0 && (
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

          {/* Chart visualization */}
          {flatStats.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
              <h3 className="text-sm text-[#a1a1aa] mb-4 font-medium">Domain Count Over Time</h3>
              <div className="space-y-2">
                {flatStats.slice(0, 50).map((stat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#8b8b93] font-mono w-24 flex-shrink-0 text-right">
                      {stat.date || stat.country_iso_code || `#${i + 1}`}
                    </span>
                    <div className="flex-1 bg-[#1a1a1a] rounded h-6 overflow-hidden">
                      <div
                        className="h-full bg-[#EF5744] rounded transition-all"
                        style={{ width: `${((stat.domains_count || 0) / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white font-mono w-20 text-right">
                      {(stat.domains_count || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {flatStats.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">{flatStats.length} entries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Date</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Country</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Domains Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {flatStats.map((stat, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">{stat.date || '-'}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono">{stat.country_iso_code || '-'}</td>
                        <td className="px-4 py-3 text-white font-mono text-right">
                          {(stat.domains_count || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw fallback */}
          {results.length > 0 && flatStats.length === 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <p className="text-xs text-[#8b8b93] mb-3 font-medium">Raw Result</p>
              <pre className="text-xs text-[#a1a1aa] font-mono whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
