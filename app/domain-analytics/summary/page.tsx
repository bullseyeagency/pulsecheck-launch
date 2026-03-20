'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { PieChart, Loader2 } from 'lucide-react';

interface SummaryItem {
  country_iso_code?: string;
  language_code?: string;
  domains_count?: number;
  [key: string]: unknown;
}

export default function TechSummaryPage() {
  const [technology, setTechnology] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResults, setRawResults] = useState<any[]>([]);
  const [countrySummary, setCountrySummary] = useState<SummaryItem[]>([]);
  const [languageSummary, setLanguageSummary] = useState<SummaryItem[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technology.trim()) return;

    setLoading(true);
    setError('');
    setRawResults([]);
    setCountrySummary([]);
    setLanguageSummary([]);

    try {
      const res = await fetch('/api/domain-analytics/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technology: technology.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const raw = data.results || [];
      setRawResults(raw);

      // Parse into country and language summaries
      const countries: SummaryItem[] = [];
      const languages: SummaryItem[] = [];

      for (const result of raw) {
        // Handle items array
        const items = result.items || [];
        for (const item of items) {
          if (item.country_iso_code) {
            countries.push(item);
          }
          if (item.language_code) {
            languages.push(item);
          }
        }

        // Handle top-level data
        if (result.countries && Array.isArray(result.countries)) {
          countries.push(...result.countries);
        }
        if (result.languages && Array.isArray(result.languages)) {
          languages.push(...result.languages);
        }
      }

      // Sort by domain count descending
      countries.sort((a, b) => (b.domains_count || 0) - (a.domains_count || 0));
      languages.sort((a, b) => (b.domains_count || 0) - (a.domains_count || 0));

      setCountrySummary(countries);
      setLanguageSummary(languages);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalDomains = countrySummary.reduce((sum, c) => sum + (c.domains_count || 0), 0);
  const maxCountryCount = Math.max(...countrySummary.map((c) => c.domains_count || 0), 1);
  const maxLangCount = Math.max(...languageSummary.map((l) => l.domains_count || 0), 1);

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Technology Summary</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            See domain counts by country and language for a specific technology.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Technology Name</label>
                <input
                  type="text"
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  placeholder="e.g. Shopify"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !technology.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Summary'}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          {(countrySummary.length > 0 || languageSummary.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Technology</p>
                <p className="text-white font-mono text-sm">{technology}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Total Domains</p>
                <p className="text-white font-mono text-lg">{totalDomains.toLocaleString()}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Countries</p>
                <p className="text-white font-mono text-lg">{countrySummary.length}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Languages</p>
                <p className="text-white font-mono text-lg">{languageSummary.length}</p>
              </div>
            </div>
          )}

          {/* Country breakdown */}
          {countrySummary.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden mb-8">
              <div className="px-6 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a]">
                <span className="text-sm text-white font-medium">Domains by Country</span>
              </div>
              <div className="p-6 space-y-2">
                {countrySummary.slice(0, 30).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#a1a1aa] font-mono w-8 text-right flex-shrink-0">
                      {item.country_iso_code || '?'}
                    </span>
                    <div className="flex-1 bg-[#1a1a1a] rounded h-5 overflow-hidden">
                      <div
                        className="h-full bg-[#EF5744] rounded transition-all"
                        style={{ width: `${((item.domains_count || 0) / maxCountryCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white font-mono w-20 text-right">
                      {(item.domains_count || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language breakdown */}
          {languageSummary.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden mb-8">
              <div className="px-6 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a]">
                <span className="text-sm text-white font-medium">Domains by Language</span>
              </div>
              <div className="p-6 space-y-2">
                {languageSummary.slice(0, 20).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#a1a1aa] font-mono w-8 text-right flex-shrink-0">
                      {item.language_code || '?'}
                    </span>
                    <div className="flex-1 bg-[#1a1a1a] rounded h-5 overflow-hidden">
                      <div
                        className="h-full bg-[#c93a2a] rounded transition-all"
                        style={{ width: `${((item.domains_count || 0) / maxLangCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white font-mono w-20 text-right">
                      {(item.domains_count || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw fallback */}
          {rawResults.length > 0 && countrySummary.length === 0 && languageSummary.length === 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <p className="text-xs text-[#8b8b93] mb-3 font-medium">Raw Result</p>
              <pre className="text-xs text-[#a1a1aa] font-mono whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto">
                {JSON.stringify(rawResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
