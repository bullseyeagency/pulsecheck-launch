'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ScanText, Loader2, ExternalLink } from 'lucide-react';

interface Citation {
  url?: string;
  domain?: string;
  title?: string;
  main_title?: string;
  snippet?: string;
  text_category?: string[];
  date_published?: string;
  sentiment_connotations?: { positive?: number; negative?: number; neutral?: number };
  connotation_types?: Record<string, number>;
  rating?: { rating_type?: string; value?: number; votes_count?: number; max_rating?: number };
  page_category?: string[];
  language?: string;
  content_type?: string;
}

export default function CitationSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setCitations([]);

    try {
      const res = await fetch('/api/content-analysis/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const result = data.results?.[0];
      setTotalCount(result?.total_count || 0);
      setCitations(result?.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentLabel = (s?: Citation['sentiment_connotations']) => {
    if (!s) return { label: 'N/A', color: 'text-[#8b8b93]' };
    const pos = s.positive || 0;
    const neg = s.negative || 0;
    const neu = s.neutral || 0;
    if (pos >= neg && pos >= neu) return { label: 'Positive', color: 'text-green-400' };
    if (neg >= pos && neg >= neu) return { label: 'Negative', color: 'text-red-400' };
    return { label: 'Neutral', color: 'text-yellow-400' };
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ScanText className="h-7 w-7 text-[#EF5744]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Citation Search</h1>
              <p className="text-[#8b8b93] text-sm mt-1">
                Find online mentions and citations for any keyword.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Keyword</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. digital marketing agency"
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
                      Searching...
                    </span>
                  ) : (
                    'Search'
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
          {citations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[#a1a1aa] text-sm">
                  Found <span className="text-white font-semibold">{totalCount.toLocaleString()}</span> citations
                </p>
              </div>

              {citations.map((c, i) => {
                const sentiment = getSentimentLabel(c.sentiment_connotations);
                return (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{c.title || c.main_title || 'Untitled'}</p>
                        <p className="text-[#8b8b93] text-xs mt-0.5">{c.domain}</p>
                      </div>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#EF5744] hover:text-[#c93a2a] flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    {c.snippet && (
                      <p className="text-[#a1a1aa] text-sm leading-relaxed">{c.snippet}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className={sentiment.color}>{sentiment.label}</span>
                      {c.date_published && (
                        <span className="text-[#8b8b93]">{new Date(c.date_published).toLocaleDateString()}</span>
                      )}
                      {c.rating?.value !== undefined && (
                        <span className="text-[#a1a1aa]">Rating: {c.rating.value}/{c.rating.max_rating || 5}</span>
                      )}
                      {c.content_type && (
                        <span className="text-[#8b8b93]">{c.content_type}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
