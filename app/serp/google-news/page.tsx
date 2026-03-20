'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Newspaper, Loader2, ExternalLink, Clock } from 'lucide-react';

interface NewsResult {
  rank_group?: number;
  rank_absolute?: number;
  title?: string;
  source?: string;
  url?: string;
  timestamp?: string;
  date?: string;
  snippet?: string;
  type?: string;
}

export default function GoogleNewsPage() {
  const [keyword, setKeyword] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [languageCode, setLanguageCode] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<NewsResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/serp/google-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location_code: locationCode,
          language_code: languageCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items?.filter(
        (item: NewsResult) => item.type === 'news_search'
      ) || [];
      setResults(items);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: string | undefined) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-[#EF5744]" />
              Google News SERP
            </h1>
            <p className="text-[#a1a1aa] text-sm mt-1">
              Browse the latest news results for any keyword
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. artificial intelligence"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Location Code</label>
                <input
                  type="number"
                  value={locationCode}
                  onChange={(e) => setLocationCode(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Language</label>
                <input
                  type="text"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="mt-4 px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
              {loading ? 'Searching...' : 'Search News'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-[#a1a1aa] text-sm">{results.length} news results</p>
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#141414] border border-[#2a2a2a] rounded p-4 hover:border-[#3a3a3a] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.source && (
                      <span className="text-[#EF5744] text-xs font-semibold uppercase tracking-wider">
                        {item.source}
                      </span>
                    )}
                    {(item.timestamp || item.date) && (
                      <span className="flex items-center gap-1 text-[#8b8b93] text-xs">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.timestamp || item.date)}
                      </span>
                    )}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5b9cf4] hover:underline text-base font-medium flex items-center gap-1"
                  >
                    {item.title}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  {item.snippet && (
                    <p className="text-[#a1a1aa] text-sm mt-2 leading-relaxed">{item.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-16 text-[#8b8b93]">
              <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Enter a keyword to browse news results</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
