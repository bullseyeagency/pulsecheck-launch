'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { MessageSquare, Loader2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface MentionResult {
  question?: string;
  answer?: string;
  ai_search_volume?: number;
  sources?: { url?: string; title?: string }[];
  brand_entities?: string[];
  fan_out_queries?: string[];
}

export default function LLMMentionsPage() {
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState<'domain' | 'keyword'>('domain');
  const [platform, setPlatform] = useState('google');
  const [locationCode, setLocationCode] = useState(2840);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<MentionResult[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setExpandedCards(new Set());

    try {
      const res = await fetch('/api/ai-optimization/mentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: target.trim(),
          targetType,
          platform,
          location_code: locationCode,
          limit,
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

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">LLM Mentions</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Target input */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Domain or Keyword
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={targetType === 'domain' ? 'example.com' : 'seo tools'}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none text-sm"
                  required
                />
              </div>

              {/* Target type toggle */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Target Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('domain')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium border-2 transition-all ${
                      targetType === 'domain'
                        ? 'border-[#EF5744] bg-[rgba(239,87,68,0.12)] text-[#EF5744]'
                        : 'border-[#2a2a2a] text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    Domain
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('keyword')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium border-2 transition-all ${
                      targetType === 'keyword'
                        ? 'border-[#EF5744] bg-[rgba(239,87,68,0.12)] text-[#EF5744]'
                        : 'border-[#2a2a2a] text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    Keyword
                  </button>
                </div>
              </div>

              {/* Platform */}
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

              {/* Location code */}
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

            {/* Limit slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                Results Limit: <span className="text-white font-mono">{limit}</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full accent-[#EF5744]"
              />
              <div className="flex justify-between text-xs text-[#8b8b93] mt-1">
                <span>10</span>
                <span>100</span>
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
                'Search Mentions'
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
            <div className="space-y-3">
              <p className="text-sm text-[#a1a1aa] mb-4">
                Found <span className="text-white font-mono">{results.length}</span> mentions
              </p>

              {results.map((item, index) => {
                const expanded = expandedCards.has(index);
                return (
                  <div
                    key={index}
                    className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCard(index)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#8b8b93] mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{item.question || 'No question'}</p>
                        {!expanded && item.answer && (
                          <p className="text-xs text-[#8b8b93] mt-1 truncate">{item.answer}</p>
                        )}
                      </div>
                      {item.ai_search_volume != null && (
                        <span className="text-xs font-mono text-[#EF5744] bg-[rgba(239,87,68,0.12)] px-2 py-0.5 rounded flex-shrink-0">
                          Vol: {item.ai_search_volume.toLocaleString()}
                        </span>
                      )}
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-[#2a2a2a] pt-4 ml-7">
                        {/* Answer */}
                        {item.answer && (
                          <div>
                            <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">Answer</h4>
                            <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{item.answer}</p>
                          </div>
                        )}

                        {/* Sources */}
                        {item.sources && item.sources.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">Sources</h4>
                            <ul className="space-y-1">
                              {item.sources.map((src, si) => (
                                <li key={si} className="flex items-center gap-1.5 text-xs">
                                  <ExternalLink className="h-3 w-3 text-[#8b8b93] flex-shrink-0" />
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#EF5744] hover:underline truncate"
                                  >
                                    {src.title || src.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Brand entities */}
                        {item.brand_entities && item.brand_entities.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">Brand Entities</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {item.brand_entities.map((entity, ei) => (
                                <span
                                  key={ei}
                                  className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-white px-2 py-0.5 rounded"
                                >
                                  {entity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fan-out queries */}
                        {item.fan_out_queries && item.fan_out_queries.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">Fan-out Queries</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {item.fan_out_queries.map((query, qi) => (
                                <span
                                  key={qi}
                                  className="text-xs bg-[rgba(239,87,68,0.08)] border border-[rgba(239,87,68,0.2)] text-[#EF5744] px-2 py-0.5 rounded"
                                >
                                  {query}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
