'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Store, Loader2, ExternalLink, Star } from 'lucide-react';

interface SellerResult {
  seller_name?: string;
  seller_url?: string;
  rating?: { value?: number; votes_count?: number };
  reviews_count?: number;
  price?: number | string;
  currency?: string;
  title?: string;
}

export default function SellerSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SellerResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/merchant/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location_code: locationCode,
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
            <Store className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Seller Search</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="wireless headphones"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching (may take up to 30s)...
                </span>
              ) : (
                'Search Sellers'
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div>
              <p className="text-sm text-[#a1a1aa] mb-4">
                Found <span className="text-white font-mono">{results.length}</span> sellers
              </p>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-4 py-3 text-[#a1a1aa] font-medium">Seller</th>
                        <th className="text-left px-4 py-3 text-[#a1a1aa] font-medium">Rating</th>
                        <th className="text-left px-4 py-3 text-[#a1a1aa] font-medium">Reviews</th>
                        <th className="text-left px-4 py-3 text-[#a1a1aa] font-medium">Price</th>
                        <th className="text-left px-4 py-3 text-[#a1a1aa] font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#2a2a2a] last:border-b-0 hover:bg-[rgba(255,255,255,0.03)]"
                        >
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{item.seller_name || item.title || 'Unknown'}</p>
                          </td>
                          <td className="px-4 py-3">
                            {item.rating?.value != null ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-white font-mono">{item.rating.value}</span>
                                {item.rating.votes_count != null && (
                                  <span className="text-[#8b8b93]">({item.rating.votes_count.toLocaleString()})</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8b8b93]">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white font-mono">
                              {item.reviews_count?.toLocaleString() || '--'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {item.price != null ? (
                              <span className="text-[#EF5744] font-mono">
                                {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price}
                              </span>
                            ) : (
                              <span className="text-[#8b8b93]">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.seller_url && (
                              <a
                                href={item.seller_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#EF5744] hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
