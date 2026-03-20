'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ShoppingCart, Loader2, ExternalLink, Star } from 'lucide-react';

interface ProductResult {
  title?: string;
  price?: number | string;
  currency?: string;
  seller_name?: string;
  rating?: { value?: number; votes_count?: number };
  url?: string;
  product_images?: string[];
  description?: string;
  product_id?: string;
}

export default function ProductSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [languageCode, setLanguageCode] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/merchant/products', {
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
            <ShoppingCart className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Product Search</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1">
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
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Language</label>
                <input
                  type="text"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  placeholder="en"
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
                'Search Products'
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
                Found <span className="text-white font-mono">{results.length}</span> products
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((item, index) => (
                  <div key={index} className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                    {item.product_images?.[0] && (
                      <div className="h-48 bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                        <img
                          src={item.product_images[0]}
                          alt={item.title || 'Product'}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-white line-clamp-2 mb-2">
                        {item.title || 'Untitled Product'}
                      </h3>

                      {(item.price != null) && (
                        <p className="text-lg font-bold text-[#EF5744] mb-2">
                          {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price}
                          {item.currency && item.currency !== 'USD' && (
                            <span className="text-xs text-[#8b8b93] ml-1">{item.currency}</span>
                          )}
                        </p>
                      )}

                      {item.seller_name && (
                        <p className="text-xs text-[#a1a1aa] mb-1">
                          Seller: <span className="text-white">{item.seller_name}</span>
                        </p>
                      )}

                      {item.rating?.value != null && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-white font-mono">{item.rating.value}</span>
                          {item.rating.votes_count != null && (
                            <span className="text-xs text-[#8b8b93]">
                              ({item.rating.votes_count.toLocaleString()})
                            </span>
                          )}
                        </div>
                      )}

                      {item.product_id && (
                        <p className="text-[10px] text-[#8b8b93] font-mono mb-2 truncate">
                          ID: {item.product_id}
                        </p>
                      )}

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#EF5744] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Product
                        </a>
                      )}
                    </div>
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
