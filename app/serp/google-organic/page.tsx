'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Loader2, ExternalLink, Download } from 'lucide-react';

interface OrganicResult {
  rank_group?: number;
  rank_absolute?: number;
  position?: string;
  title?: string;
  domain?: string;
  url?: string;
  description?: string;
  breadcrumb?: string;
  type?: string;
}

export default function GoogleOrganicPage() {
  const [keyword, setKeyword] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [languageCode, setLanguageCode] = useState('en');
  const [device, setDevice] = useState('desktop');
  const [depth, setDepth] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<OrganicResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/serp/google-organic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location_code: locationCode,
          language_code: languageCode,
          device,
          depth,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items?.filter(
        (item: OrganicResult) => item.type === 'organic'
      ) || [];
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Search className="h-6 w-6 text-[#EF5744]" />
              Google Organic SERP
            </h1>
            <p className="text-[#a1a1aa] text-sm mt-1">
              Analyze organic search results for any keyword
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
                  placeholder="e.g. best crm software"
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
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Device</label>
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                >
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Depth</label>
                <select
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="mt-4 px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Searching...' : 'Search'}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[#a1a1aa] text-sm">{results.length} organic results</p>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `serp-organic-${keyword.replace(/\s+/g, '-')}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[#c93a2a] hover:bg-[#a83020] rounded transition-all duration-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download JSON
                </button>
              </div>
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#141414] border border-[#2a2a2a] rounded p-4 hover:border-[#3a3a3a] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[#EF5744] font-bold text-sm min-w-[28px] pt-0.5">
                      #{item.rank_group || idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {item.breadcrumb && (
                        <p className="text-[#8b8b93] text-xs mb-1 truncate">{item.breadcrumb}</p>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5b9cf4] hover:underline text-base font-medium flex items-center gap-1"
                      >
                        {item.title}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                      <p className="text-[#4d9a4d] text-xs mt-0.5 truncate">{item.domain}</p>
                      {item.description && (
                        <p className="text-[#a1a1aa] text-sm mt-1.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-16 text-[#8b8b93]">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Enter a keyword and search to see organic SERP results</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
