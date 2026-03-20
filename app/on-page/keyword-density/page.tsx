'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Hash, Loader2, ArrowDown } from 'lucide-react';

interface KeywordEntry {
  keyword: string;
  count: number;
  density: number;
}

export default function KeywordDensityPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);
  const [totalWords, setTotalWords] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setKeywords([]);

    try {
      const res = await fetch('/api/on-page/keyword-density', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const item = data.results?.[0]?.items?.[0];
      if (!item) {
        setError('No data returned for this URL.');
        return;
      }

      const wordCount = item.plain_text_word_count || item.words_count || 0;
      setTotalWords(wordCount);

      // Extract keyword_density from the response if available
      const densityData = item.keyword_density;
      if (densityData && typeof densityData === 'object') {
        const entries: KeywordEntry[] = [];
        for (const [word, freq] of Object.entries(densityData)) {
          const count = freq as number;
          entries.push({
            keyword: word,
            count,
            density: wordCount > 0 ? (count / wordCount) * 100 : 0,
          });
        }
        entries.sort((a, b) => b.density - a.density);
        setKeywords(entries);
      } else {
        // Fallback: parse plain_text_rate or meta_keywords
        const metaKeywords = item.meta?.keywords || '';
        if (metaKeywords) {
          const kws = metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean);
          setKeywords(kws.map((k: string) => ({ keyword: k, count: 0, density: 0 })));
        } else {
          setError('No keyword density data available for this page. The API may not return keyword frequency for this URL.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Hash className="h-7 w-7 text-[#EF5744]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Keyword Density</h1>
              <p className="text-[#8b8b93] text-sm mt-1">
                Analyze keyword frequency and density on any page.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Page URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  required
                  className="flex-1 px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded disabled:opacity-50 transition-colors text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze'
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
          {keywords.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 flex items-center justify-between">
                <div>
                  <p className="text-[#8b8b93] text-xs uppercase tracking-wider">Total Words</p>
                  <p className="text-white text-xl font-bold">{totalWords.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[#8b8b93] text-xs uppercase tracking-wider">Unique Keywords</p>
                  <p className="text-white text-xl font-bold">{keywords.length.toLocaleString()}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Keyword</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">Count</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          Density
                          <ArrowDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[#8b8b93] uppercase tracking-wider w-40">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.slice(0, 100).map((kw) => (
                      <tr key={kw.keyword} className="border-b border-[#2a2a2a]/50 hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-4 py-2.5 text-sm text-white font-mono">{kw.keyword}</td>
                        <td className="px-4 py-2.5 text-sm text-[#a1a1aa] text-right">{kw.count}</td>
                        <td className="px-4 py-2.5 text-sm text-[#EF5744] font-semibold text-right">{kw.density.toFixed(2)}%</td>
                        <td className="px-4 py-2.5">
                          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                            <div
                              className="bg-[#EF5744] h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(kw.density * 10, 100)}%` }}
                            />
                          </div>
                        </td>
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
