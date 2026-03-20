'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Download, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface DomainResult {
  domain: string;
  title?: string;
  domain_rank?: number;
  country_iso_code?: string;
  last_visited?: string;
  emails?: string[];
  phone_numbers?: string[];
  technologies?: Record<string, unknown>;
}

export default function ByHtmlTermsPage() {
  const [searchTerms, setSearchTerms] = useState('');
  const [keywords, setKeywords] = useState('');
  const [mode, setMode] = useState<'entry' | 'strict_entry'>('entry');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerms.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setExpandedRows(new Set());

    try {
      const terms = searchTerms.split(',').map((t) => t.trim()).filter(Boolean);
      const kw = keywords.trim()
        ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined;

      const res = await fetch('/api/domain-analytics/by-html-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_terms: terms,
          keywords: kw,
          mode,
          limit,
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

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Domain', 'Title', 'Domain Rank', 'Country', 'Last Visited', 'Emails', 'Phone Numbers'];
    const rows = results.map((r) => [
      r.domain || '',
      (r.title || '').replace(/"/g, '""'),
      r.domain_rank ?? '',
      r.country_iso_code || '',
      r.last_visited || '',
      (r.emails || []).join('; '),
      (r.phone_numbers || []).join('; '),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domains-by-html-terms.csv`;
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
            <Search className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Domains by HTML Terms</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Find domains whose HTML source code contains specific terms or code snippets.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Search Terms (comma separated)</label>
                <input
                  type="text"
                  value={searchTerms}
                  onChange={(e) => setSearchTerms(e.target.value)}
                  placeholder='e.g. "google-analytics", "gtag"'
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Keywords Filter (comma separated, optional)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. analytics, tracking"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('entry')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium border-2 transition-colors ${
                      mode === 'entry'
                        ? 'border-[#EF5744] text-[#EF5744] bg-[rgba(239,87,68,0.08)]'
                        : 'border-[#2a2a2a] text-[#8b8b93] hover:text-white'
                    }`}
                  >
                    Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('strict_entry')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium border-2 transition-colors ${
                      mode === 'strict_entry'
                        ? 'border-[#EF5744] text-[#EF5744] bg-[rgba(239,87,68,0.08)]'
                        : 'border-[#2a2a2a] text-[#8b8b93] hover:text-white'
                    }`}
                  >
                    Strict Entry
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Limit: {limit}</label>
                <input
                  type="range"
                  min={10}
                  max={100}
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
                disabled={loading || !searchTerms.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
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
                <span className="text-sm text-[#a1a1aa]">{results.length} domains found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium w-8"></th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Domain</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Title</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Rank</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Country</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Last Visited</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Emails</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Phones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {results.map((item, i) => (
                      <>
                        <tr
                          key={`row-${i}`}
                          className="hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors"
                          onClick={() => toggleRow(i)}
                        >
                          <td className="px-4 py-3 text-[#8b8b93]">
                            {expandedRows.has(i) ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#EF5744] font-mono text-xs">{item.domain}</td>
                          <td className="px-4 py-3 text-white max-w-[200px] truncate">{item.title || '-'}</td>
                          <td className="px-4 py-3 text-white font-mono">{item.domain_rank ?? '-'}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] font-mono">{item.country_iso_code || '-'}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">{item.last_visited || '-'}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] text-xs">{(item.emails || []).join(', ') || '-'}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] text-xs">{(item.phone_numbers || []).join(', ') || '-'}</td>
                        </tr>
                        {expandedRows.has(i) && (
                          <tr key={`expand-${i}`} className="bg-[#0f0f0f]">
                            <td colSpan={8} className="px-6 py-4">
                              <p className="text-xs text-[#8b8b93] mb-2 font-medium">Technologies</p>
                              <pre className="text-xs text-[#a1a1aa] font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                                {JSON.stringify(item.technologies, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
