'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Loader2 } from 'lucide-react';

interface KeywordResult {
  keyword?: string;
  search_volume?: number;
  cpc?: number;
  competition?: number;
  competition_level?: string;
  keyword_difficulty?: number;
  serp_info?: {
    se_type?: string;
    check_url?: string;
    serp_item_types?: string[];
  };
}

export default function KeywordOverviewPage() {
  const [keywordsText, setKeywordsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<KeywordResult[]>([]);

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
      const res = await fetch('/api/labs/keyword-overview', {
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

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Keyword Overview</h1>
          </div>

          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-6">
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Keywords (one per line)
            </label>
            <textarea
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={5}
              placeholder="seo tools&#10;keyword research&#10;backlink checker"
              className="w-full bg-[#141414] border-2 border-[#2a2a2a] text-white rounded px-3 py-2 text-sm focus:border-[#EF5744] outline-none resize-none"
            />
            <button
              type="submit"
              disabled={loading || !keywordsText.trim()}
              className="mt-4 px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Analyzing...' : 'Get Overview'}
            </button>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((item, idx) => (
                <div key={idx} className="bg-[#141414] border border-[#2a2a2a] rounded p-5">
                  <h3 className="text-white font-semibold text-base mb-4 truncate">
                    {item.keyword}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8b8b93] text-sm">Search Volume</span>
                      <span className="text-white font-medium">
                        {item.search_volume?.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8b8b93] text-sm">CPC</span>
                      <span className="text-white font-medium">
                        {item.cpc != null ? `$${item.cpc.toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8b8b93] text-sm">Competition</span>
                      <span className="text-white font-medium">
                        {item.competition != null ? item.competition.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8b8b93] text-sm">Competition Level</span>
                      <span className={`font-medium text-sm ${
                        item.competition_level === 'HIGH' ? 'text-red-400' :
                        item.competition_level === 'MEDIUM' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {item.competition_level || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8b8b93] text-sm">Keyword Difficulty</span>
                      <span className="text-[#EF5744] font-bold">
                        {item.keyword_difficulty ?? 'N/A'}
                      </span>
                    </div>
                    {item.serp_info?.serp_item_types && (
                      <div className="pt-2 border-t border-[#2a2a2a]">
                        <span className="text-[#8b8b93] text-xs block mb-1.5">SERP Features</span>
                        <div className="flex flex-wrap gap-1">
                          {item.serp_info.serp_item_types.map((type, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#2a2a2a] text-[#a1a1aa] rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
