'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Type, Loader2, Search } from 'lucide-react';

interface AutocompleteResult {
  type?: string;
  suggestion?: string;
  suggestion_type?: string;
  rank_group?: number;
  rank_absolute?: number;
}

export default function GoogleAutocompletePage() {
  const [keyword, setKeyword] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [languageCode, setLanguageCode] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<AutocompleteResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/serp/google-autocomplete', {
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
        (item: AutocompleteResult) => item.type === 'autocomplete'
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
              <Type className="h-6 w-6 text-[#EF5744]" />
              Google Autocomplete
            </h1>
            <p className="text-[#a1a1aa] text-sm mt-1">
              See what Google suggests as you type
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
                  placeholder="e.g. how to"
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Searching...' : 'Get Suggestions'}
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
            <div>
              <p className="text-[#a1a1aa] text-sm mb-3">{results.length} suggestions</p>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors ${
                      idx !== results.length - 1 ? 'border-b border-[#2a2a2a]' : ''
                    }`}
                  >
                    <Search className="h-4 w-4 text-[#8b8b93] flex-shrink-0" />
                    <span className="text-white text-sm">{item.suggestion}</span>
                    {item.suggestion_type && (
                      <span className="ml-auto text-[#8b8b93] text-xs bg-[#0a0a0a] px-2 py-0.5 rounded">
                        {item.suggestion_type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-16 text-[#8b8b93]">
              <Type className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Enter a keyword to see autocomplete suggestions</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
