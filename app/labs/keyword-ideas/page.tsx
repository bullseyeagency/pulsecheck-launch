'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Lightbulb, Loader2, Download } from 'lucide-react';

interface KeywordIdea {
  keyword?: string;
  search_volume?: number;
  competition?: number;
  competition_level?: string;
  cpc?: number;
  keyword_difficulty?: number;
}

export default function KeywordIdeasPage() {
  const [keywordsText, setKeywordsText] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<KeywordIdea[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsText
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!keywords.length) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/labs/keyword-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location_code: 2840, language_code: 'en', limit }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items || [];
      setResults(items.map((item: any) => ({
        keyword: item.keyword_data?.keyword || item.keyword,
        search_volume: item.keyword_data?.keyword_info?.search_volume ?? item.search_volume,
        competition: item.keyword_data?.keyword_info?.competition ?? item.competition,
        competition_level: item.keyword_data?.keyword_info?.competition_level ?? item.competition_level,
        cpc: item.keyword_data?.keyword_info?.cpc ?? item.cpc,
        keyword_difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty ?? item.keyword_difficulty,
      })));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Keyword', 'Search Volume', 'Competition', 'Competition Level', 'CPC', 'Keyword Difficulty'];
    const rows = results.map((r) => [
      r.keyword || '',
      r.search_volume ?? '',
      r.competition != null ? r.competition.toFixed(2) : '',
      r.competition_level || '',
      r.cpc != null ? r.cpc.toFixed(2) : '',
      r.keyword_difficulty ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-ideas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Keyword Ideas</h1>
          </div>

          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-6">
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Seed Keywords (one per line)
            </label>
            <textarea
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={4}
              placeholder="seo tools&#10;keyword research"
              className="w-full bg-[#141414] border-2 border-[#2a2a2a] text-white rounded px-3 py-2 text-sm focus:border-[#EF5744] outline-none resize-none"
            />
            <div className="mt-3 flex items-center gap-4">
              <div>
                <label className="block text-xs text-[#8b8b93] mb-1">Limit</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  min={1}
                  max={700}
                  className="w-24 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded px-3 py-1.5 text-sm focus:border-[#EF5744] outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !keywordsText.trim()}
              className="mt-4 px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Get Ideas'}
            </button>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">{results.length} keyword ideas</span>
                <button onClick={exportCSV} className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors">
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-3 text-[#8b8b93] font-medium">Keyword</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">Volume</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">Competition</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">CPC</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">KD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-5 py-3 text-white">{item.keyword}</td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{item.search_volume?.toLocaleString() ?? '-'}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-sm ${
                            item.competition_level === 'HIGH' ? 'text-red-400' :
                            item.competition_level === 'MEDIUM' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {item.competition_level || (item.competition != null ? item.competition.toFixed(2) : '-')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{item.cpc != null ? `$${item.cpc.toFixed(2)}` : '-'}</td>
                        <td className="px-5 py-3 text-right text-[#EF5744] font-medium">{item.keyword_difficulty ?? '-'}</td>
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
