'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { BrainCircuit, Loader2, ExternalLink } from 'lucide-react';

interface AggregatedMetric {
  total_mentions?: number;
  avg_position?: number;
  total_sources?: number;
  total_queries?: number;
  [key: string]: unknown;
}

interface TopDomain {
  domain?: string;
  mentions_count?: number;
  avg_position?: number;
}

interface TopPage {
  url?: string;
  title?: string;
  mentions_count?: number;
}

export default function MentionsAnalyticsPage() {
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState('google');
  const [locationCode, setLocationCode] = useState(2840);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aggregated, setAggregated] = useState<AggregatedMetric[]>([]);
  const [topDomains, setTopDomains] = useState<TopDomain[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setAggregated([]);
    setTopDomains([]);
    setTopPages([]);

    try {
      const res = await fetch('/api/ai-optimization/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          platform,
          location_code: locationCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const aggItems = data.aggregated?.[0]?.items || data.aggregated || [];
      const domainItems = data.topDomains?.[0]?.items || data.topDomains || [];
      const pageItems = data.topPages?.[0]?.items || data.topPages || [];

      setAggregated(aggItems);
      setTopDomains(domainItems);
      setTopPages(pageItems);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const hasResults = aggregated.length > 0 || topDomains.length > 0 || topPages.length > 0;

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <BrainCircuit className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Mentions Analytics</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Keyword
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="seo tools"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                >
                  <option value="google">Google AI Overview</option>
                  <option value="chat_gpt">ChatGPT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Location Code
                </label>
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
                  Analyzing...
                </span>
              ) : (
                'Analyze Mentions'
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
          {hasResults && (
            <div className="space-y-6">
              {/* Aggregated Metrics */}
              {aggregated.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">
                    Aggregated Metrics
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {aggregated.map((metric, i) => {
                      const entries = Object.entries(metric).filter(
                        ([key]) => key !== 'type' && key !== 'se_type' && key !== 'keyword'
                      );
                      return entries.map(([key, value]) => (
                        <div
                          key={`${i}-${key}`}
                          className="bg-[#141414] border border-[#2a2a2a] rounded p-4"
                        >
                          <p className="text-xs text-[#8b8b93] uppercase tracking-wider">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-lg text-white font-mono mt-1">
                            {typeof value === 'number' ? value.toLocaleString() : String(value ?? '-')}
                          </p>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}

              {/* Top Domains */}
              {topDomains.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">
                    Top Domains
                  </h2>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-left">
                          <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                            Domain
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider text-right">
                            Mentions
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider text-right">
                            Avg Position
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a2a]">
                        {topDomains.map((domain, index) => (
                          <tr key={index} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            <td className="px-4 py-3 text-sm text-white">{domain.domain}</td>
                            <td className="px-4 py-3 text-sm text-white font-mono text-right">
                              {domain.mentions_count?.toLocaleString() ?? '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-white font-mono text-right">
                              {domain.avg_position != null ? domain.avg_position.toFixed(1) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Pages */}
              {topPages.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">
                    Top Pages
                  </h2>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-left">
                          <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                            Page
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider text-right">
                            Mentions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a2a]">
                        {topPages.map((page, index) => (
                          <tr key={index} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm text-white truncate">{page.title || page.url}</p>
                                  {page.url && (
                                    <a
                                      href={page.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-[#EF5744] hover:underline truncate mt-0.5"
                                    >
                                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                      {page.url}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-white font-mono text-right">
                              {page.mentions_count?.toLocaleString() ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
