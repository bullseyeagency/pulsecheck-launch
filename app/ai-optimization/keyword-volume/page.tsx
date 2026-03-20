'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Activity, Loader2, Download } from 'lucide-react';

interface KeywordVolumeResult {
  keyword?: string;
  ai_search_volume?: number;
  monthly_searches?: { year?: number; month?: number; search_volume?: number }[];
}

export default function AIKeywordVolumePage() {
  const [keywordsText, setKeywordsText] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<KeywordVolumeResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsText
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (!keywords.length) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/ai-optimization/keyword-volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location_code: locationCode }),
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
    const headers = ['Keyword', 'AI Search Volume'];
    const rows = results.map((r) => [
      (r.keyword || '').replace(/"/g, '""'),
      r.ai_search_volume ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-keyword-volume.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMaxVolume = () => {
    let max = 0;
    results.forEach((r) => {
      r.monthly_searches?.forEach((m) => {
        if (m.search_volume && m.search_volume > max) max = m.search_volume;
      });
    });
    return max || 1;
  };

  const maxVol = results.length ? getMaxVolume() : 1;

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Activity className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">AI Keyword Volume</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Keywords <span className="text-[#8b8b93]">(one per line, max 50)</span>
                </label>
                <textarea
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder={"iphone\nseo tools\ncontent marketing"}
                  rows={6}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm font-mono resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Location Code
                </label>
                <input
                  type="number"
                  value={locationCode}
                  onChange={(e) => setLocationCode(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching volume...
                </span>
              ) : (
                'Get Search Volume'
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                <p className="text-sm text-[#a1a1aa]">
                  <span className="text-white font-mono">{results.length}</span> keywords
                </p>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 text-xs text-[#EF5744] hover:text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-[#1a1a1a] text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider text-right">
                      AI Search Volume
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                      Monthly Trend (12mo)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {results.map((item, index) => {
                    const months = (item.monthly_searches || []).slice(-12);
                    return (
                      <tr key={index} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{item.keyword}</td>
                        <td className="px-4 py-3 text-sm text-white font-mono text-right">
                          {item.ai_search_volume?.toLocaleString() ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-end gap-0.5 h-6">
                            {months.map((m, mi) => {
                              const vol = m.search_volume || 0;
                              const height = maxVol > 0 ? Math.max((vol / maxVol) * 100, 4) : 4;
                              return (
                                <div
                                  key={mi}
                                  className="w-2 rounded-sm bg-[#EF5744] opacity-80 hover:opacity-100 transition-opacity"
                                  style={{ height: `${height}%` }}
                                  title={`${m.year}-${String(m.month).padStart(2, '0')}: ${vol.toLocaleString()}`}
                                />
                              );
                            })}
                            {months.length === 0 && (
                              <span className="text-xs text-[#8b8b93]">No data</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
