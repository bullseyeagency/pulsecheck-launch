'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { MessageSquare, Loader2, Star } from 'lucide-react';

interface ReviewResult {
  rating?: { value?: number };
  review_text?: string;
  timestamp?: string;
  author_title?: string;
  author_name?: string;
  review_url?: string;
}

export default function GoogleReviewsPage() {
  const [keyword, setKeyword] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [depth, setDepth] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ReviewResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/business/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location_code: locationCode,
          depth,
        }),
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

  const renderStars = (value: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i < value ? 'text-yellow-500 fill-yellow-500' : 'text-[#2a2a2a]'
        }`}
      />
    ));
  };

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Google Reviews</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Business Name + Location</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Hilton New York"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Location Code</label>
                <input
                  type="number"
                  value={locationCode}
                  onChange={(e) => setLocationCode(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Depth: <span className="text-white font-mono">{depth}</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={10}
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full accent-[#EF5744] mt-2"
                />
                <div className="flex justify-between text-xs text-[#8b8b93] mt-1">
                  <span>10</span>
                  <span>200</span>
                </div>
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
                  Fetching reviews (may take up to 30s)...
                </span>
              ) : (
                'Get Reviews'
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
            <div>
              <p className="text-sm text-[#a1a1aa] mb-4">
                Found <span className="text-white font-mono">{results.length}</span> reviews
              </p>
              <div className="space-y-3">
                {results.map((item, index) => (
                  <div key={index} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.rating?.value != null && (
                          <div className="flex items-center gap-0.5">
                            {renderStars(item.rating.value)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">
                          {item.author_title || item.author_name || 'Anonymous'}
                        </span>
                      </div>
                      {item.timestamp && (
                        <span className="text-xs text-[#8b8b93]">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {item.review_text && (
                      <p className="text-sm text-[#a1a1aa] leading-relaxed">{item.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
