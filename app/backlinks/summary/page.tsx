'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { BarChart3, Loader2 } from 'lucide-react';

interface SummaryResult {
  target?: string;
  total_backlinks?: number;
  referring_domains?: number;
  referring_main_domains?: number;
  rank?: number;
  backlinks_spam_score?: number;
  broken_backlinks?: number;
  referring_ips?: number;
  referring_subnets?: number;
  referring_pages?: number;
  dofollow?: number;
  nofollow?: number;
}

export default function BacklinksSummaryPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SummaryResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/backlinks/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const item = data.results?.[0] || null;
      setResult(item);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const metrics = result
    ? [
        { label: 'Total Backlinks', value: result.total_backlinks?.toLocaleString() ?? '-' },
        { label: 'Referring Domains', value: result.referring_domains?.toLocaleString() ?? '-' },
        { label: 'Referring Main Domains', value: result.referring_main_domains?.toLocaleString() ?? '-' },
        { label: 'Rank', value: result.rank ?? '-' },
        { label: 'Spam Score', value: result.backlinks_spam_score ?? '-' },
        { label: 'Broken Backlinks', value: result.broken_backlinks?.toLocaleString() ?? '-' },
        { label: 'Referring IPs', value: result.referring_ips?.toLocaleString() ?? '-' },
        { label: 'Referring Subnets', value: result.referring_subnets?.toLocaleString() ?? '-' },
        { label: 'Referring Pages', value: result.referring_pages?.toLocaleString() ?? '-' },
        { label: 'Dofollow', value: result.dofollow?.toLocaleString() ?? '-' },
        { label: 'Nofollow', value: result.nofollow?.toLocaleString() ?? '-' },
      ]
    : [];

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Backlink Summary</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Get an overview of backlink metrics for any domain.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Target Domain</label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading || !target.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-semibold disabled:opacity-50 transition-colors"
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

          {/* Results */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-[#141414] border border-[#2a2a2a] rounded p-5"
                >
                  <p className="text-[#8b8b93] text-xs font-medium uppercase tracking-wide mb-2">
                    {m.label}
                  </p>
                  <p className="text-white text-2xl font-bold font-mono">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !result && target && (
            <div className="text-center py-12 text-[#8b8b93] text-sm">
              No results found. Try a different domain.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
