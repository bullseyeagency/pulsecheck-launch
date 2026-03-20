'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Building2, Loader2, ExternalLink, Star, Phone, MapPin } from 'lucide-react';

interface ListingResult {
  title?: string;
  address?: string;
  phone?: string;
  rating?: { value?: number; votes_count?: number };
  url?: string;
  category?: string;
  description?: string;
  is_claimed?: boolean;
}

export default function BusinessListingsPage() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ListingResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/business/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim() || undefined,
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

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Business Listings</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Category / Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="dentist"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Location (City / Address)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="New York, NY"
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
                  Searching...
                </span>
              ) : (
                'Search Listings'
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
                Found <span className="text-white font-mono">{results.length}</span> listings
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item, index) => (
                  <div key={index} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-white">{item.title || 'Unnamed Business'}</h3>
                      {item.is_claimed && (
                        <span className="text-[10px] bg-[rgba(239,87,68,0.12)] text-[#EF5744] px-2 py-0.5 rounded">
                          Claimed
                        </span>
                      )}
                    </div>

                    {item.category && (
                      <span className="inline-block text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1aa] px-2 py-0.5 rounded mb-2">
                        {item.category}
                      </span>
                    )}

                    {item.address && (
                      <div className="flex items-start gap-1.5 text-xs text-[#a1a1aa] mb-1.5">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-[#8b8b93]" />
                        <span>{item.address}</span>
                      </div>
                    )}

                    {item.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-2">
                        <Phone className="h-3 w-3 flex-shrink-0 text-[#8b8b93]" />
                        <span>{item.phone}</span>
                      </div>
                    )}

                    {item.rating?.value != null && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-white font-mono">{item.rating.value}</span>
                        {item.rating.votes_count != null && (
                          <span className="text-xs text-[#8b8b93]">
                            ({item.rating.votes_count.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                    )}

                    {item.description && (
                      <p className="text-xs text-[#8b8b93] line-clamp-2 mb-2">{item.description}</p>
                    )}

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#EF5744] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Website
                      </a>
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
