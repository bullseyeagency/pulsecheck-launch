'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { TrendingUp, Download, Loader2 } from 'lucide-react';

interface AdTrafficResult {
  keyword: string;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  cost: number | null;
  average_cpc: number | null;
}

export default function AdTrafficPage() {
  const [keywordsInput, setKeywordsInput] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [languageCode, setLanguageCode] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<AdTrafficResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsInput
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!keywords.length) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/keywords-data/ad-traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location_code: locationCode, language_code: languageCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items || data.results || [];
      setResults(items);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Keyword', 'Impressions', 'Clicks', 'CTR', 'Cost', 'Avg CPC'];
    const rows = results.map((r) => [
      r.keyword || '',
      r.impressions ?? '',
      r.clicks ?? '',
      r.ctr != null ? (r.ctr * 100).toFixed(2) + '%' : '',
      r.cost ?? '',
      r.average_cpc ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ad-traffic.csv';
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
            <h1 className="text-2xl font-bold text-white">Ad Traffic by Keywords</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Estimate ad traffic metrics including impressions, clicks, CTR, and cost for keywords.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Keywords (one per line)</label>
                <textarea
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder={"google ads management\nppc agency\npaid search"}
                  rows={5}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors resize-none"
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
                  <label className="block text-sm text-[#a1a1aa] mb-1.5">Language Code</label>
                  <input
                    type="text"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !keywordsInput.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Ad Traffic'}
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
                <span className="text-sm text-[#a1a1aa]">{results.length} keywords</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Keyword</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Impressions</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Clicks</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">CTR</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Cost</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium text-right">Avg CPC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {results.map((item, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">{item.keyword}</td>
                        <td className="px-4 py-3 text-white font-mono text-right">
                          {item.impressions?.toLocaleString() ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-right">
                          {item.clicks?.toLocaleString() ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-right">
                          {item.ctr != null ? `${(item.ctr * 100).toFixed(2)}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-right">
                          {item.cost != null ? `$${item.cost.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-right">
                          {item.average_cpc != null ? `$${item.average_cpc.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && keywordsInput.trim() && (
            <div className="text-center py-12 text-[#8b8b93] text-sm">
              No ad traffic data found. Try different keywords.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
