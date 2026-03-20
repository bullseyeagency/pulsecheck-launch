'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Gauge, Loader2, Download } from 'lucide-react';

interface DifficultyResult {
  keyword?: string;
  keyword_difficulty?: number;
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty >= 80) return 'bg-red-500';
  if (difficulty >= 60) return 'bg-orange-500';
  if (difficulty >= 40) return 'bg-yellow-500';
  if (difficulty >= 20) return 'bg-green-400';
  return 'bg-green-600';
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty >= 80) return 'Very Hard';
  if (difficulty >= 60) return 'Hard';
  if (difficulty >= 40) return 'Medium';
  if (difficulty >= 20) return 'Easy';
  return 'Very Easy';
}

export default function KeywordDifficultyPage() {
  const [keywordsText, setKeywordsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<DifficultyResult[]>([]);

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
      const res = await fetch('/api/labs/keyword-difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location_code: 2840, language_code: 'en' }),
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
    const headers = ['Keyword', 'Keyword Difficulty', 'Difficulty Level'];
    const rows = results.map((r) => [
      r.keyword || '',
      r.keyword_difficulty ?? '',
      r.keyword_difficulty != null ? getDifficultyLabel(r.keyword_difficulty) : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-difficulty.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Gauge className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Bulk Keyword Difficulty</h1>
          </div>

          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-6">
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Keywords (one per line, up to 1000)
            </label>
            <textarea
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={6}
              placeholder="seo tools&#10;keyword research&#10;backlink checker&#10;site audit"
              className="w-full bg-[#141414] border-2 border-[#2a2a2a] text-white rounded px-3 py-2 text-sm focus:border-[#EF5744] outline-none resize-none"
            />
            <button
              type="submit"
              disabled={loading || !keywordsText.trim()}
              className="mt-4 px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
              {loading ? 'Analyzing...' : 'Check Difficulty'}
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
                <span className="text-sm text-[#a1a1aa]">{results.length} keywords analyzed</span>
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
                      <th className="text-left px-5 py-3 text-[#8b8b93] font-medium w-64">Difficulty</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium w-24">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-5 py-3 text-white">{item.keyword}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.keyword_difficulty != null ? getDifficultyColor(item.keyword_difficulty) : 'bg-[#2a2a2a]'}`}
                                style={{ width: `${item.keyword_difficulty ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#8b8b93] w-16 text-right">
                              {item.keyword_difficulty != null ? getDifficultyLabel(item.keyword_difficulty) : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-[#EF5744] font-bold">
                          {item.keyword_difficulty ?? '-'}
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
