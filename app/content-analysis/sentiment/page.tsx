'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Heart, Loader2 } from 'lucide-react';

interface SentimentData {
  sentiment_connotations?: {
    positive?: number;
    negative?: number;
    neutral?: number;
  };
  connotation_types?: Record<string, number>;
  total_count?: number;
  positive_count?: number;
  negative_count?: number;
  neutral_count?: number;
}

export default function SentimentAnalysisPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SentimentData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/content-analysis/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');

      const result = json.results?.[0];
      if (result) {
        setData(result);
      } else {
        setError('No sentiment data returned.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sentimentPercentages = () => {
    if (!data?.sentiment_connotations) return null;
    const { positive = 0, negative = 0, neutral = 0 } = data.sentiment_connotations;
    const total = positive + negative + neutral || 1;
    return {
      positive: ((positive / total) * 100).toFixed(1),
      negative: ((negative / total) * 100).toFixed(1),
      neutral: ((neutral / total) * 100).toFixed(1),
      positiveRaw: positive,
      negativeRaw: negative,
      neutralRaw: neutral,
    };
  };

  const connotationLabels: Record<string, { label: string; color: string }> = {
    anger: { label: 'Anger', color: 'bg-red-500' },
    happiness: { label: 'Happiness', color: 'bg-green-500' },
    love: { label: 'Love', color: 'bg-pink-500' },
    sadness: { label: 'Sadness', color: 'bg-blue-500' },
    fun: { label: 'Fun', color: 'bg-yellow-500' },
    share: { label: 'Share', color: 'bg-purple-500' },
  };

  const pct = sentimentPercentages();

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-7 w-7 text-[#EF5744]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Sentiment Analysis</h1>
              <p className="text-[#8b8b93] text-sm mt-1">
                Analyze public sentiment around any keyword or phrase.
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
                  placeholder="e.g. artificial intelligence"
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
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze'
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
          {pct && (
            <div className="space-y-6">
              {/* Sentiment breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 text-center">
                  <p className="text-green-400 text-3xl font-bold">{pct.positive}%</p>
                  <p className="text-[#8b8b93] text-sm mt-2">Positive</p>
                  <div className="w-full bg-[#2a2a2a] rounded-full h-2 mt-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct.positive}%` }} />
                  </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 text-center">
                  <p className="text-yellow-400 text-3xl font-bold">{pct.neutral}%</p>
                  <p className="text-[#8b8b93] text-sm mt-2">Neutral</p>
                  <div className="w-full bg-[#2a2a2a] rounded-full h-2 mt-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${pct.neutral}%` }} />
                  </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 text-center">
                  <p className="text-red-400 text-3xl font-bold">{pct.negative}%</p>
                  <p className="text-[#8b8b93] text-sm mt-2">Negative</p>
                  <div className="w-full bg-[#2a2a2a] rounded-full h-2 mt-3">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${pct.negative}%` }} />
                  </div>
                </div>
              </div>

              {/* Stacked sentiment bar */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                <p className="text-white font-semibold mb-4">Overall Sentiment Distribution</p>
                <div className="flex rounded-full overflow-hidden h-4">
                  <div className="bg-green-500 transition-all" style={{ width: `${pct.positive}%` }} />
                  <div className="bg-yellow-500 transition-all" style={{ width: `${pct.neutral}%` }} />
                  <div className="bg-red-500 transition-all" style={{ width: `${pct.negative}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-[#8b8b93]">
                  <span>Positive: {pct.positiveRaw.toLocaleString()}</span>
                  <span>Neutral: {pct.neutralRaw.toLocaleString()}</span>
                  <span>Negative: {pct.negativeRaw.toLocaleString()}</span>
                </div>
              </div>

              {/* Connotation types */}
              {data?.connotation_types && Object.keys(data.connotation_types).length > 0 && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                  <p className="text-white font-semibold mb-4">Connotation Types</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(data.connotation_types).map(([type, count]) => {
                      const info = connotationLabels[type] || { label: type, color: 'bg-gray-500' };
                      const total = Object.values(data.connotation_types!).reduce((a, b) => a + b, 0) || 1;
                      const pctVal = ((count / total) * 100).toFixed(1);
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[#a1a1aa] text-sm capitalize">{info.label}</span>
                            <span className="text-white text-sm font-semibold">{pctVal}%</span>
                          </div>
                          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                            <div className={`${info.color} h-2 rounded-full transition-all`} style={{ width: `${pctVal}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
