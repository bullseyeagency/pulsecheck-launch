'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Globe, Loader2 } from 'lucide-react';

interface DomainMetrics {
  target?: string;
  domain_rank?: number;
  organic_etv?: number;
  organic_count?: number;
  organic_is_lost?: number;
  organic_is_new?: number;
  paid_etv?: number;
  paid_count?: number;
  estimated_paid_traffic_cost?: number;
  backlinks?: number;
  referring_domains?: number;
}

export default function DomainOverviewPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<DomainMetrics | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setMetrics(null);

    try {
      const res = await fetch('/api/labs/domain-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim(), location_code: 2840, language_code: 'en' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const item = data.results?.[0]?.items?.[0] || data.results?.[0] || null;
      setMetrics(item);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const metricCards = metrics ? [
    { label: 'Domain Rank', value: metrics.domain_rank?.toLocaleString() ?? 'N/A' },
    { label: 'Organic Traffic (ETV)', value: metrics.organic_etv?.toLocaleString() ?? 'N/A' },
    { label: 'Organic Keywords', value: metrics.organic_count?.toLocaleString() ?? 'N/A' },
    { label: 'New Organic KWs', value: metrics.organic_is_new?.toLocaleString() ?? 'N/A' },
    { label: 'Lost Organic KWs', value: metrics.organic_is_lost?.toLocaleString() ?? 'N/A' },
    { label: 'Paid Traffic (ETV)', value: metrics.paid_etv?.toLocaleString() ?? 'N/A' },
    { label: 'Paid Keywords', value: metrics.paid_count?.toLocaleString() ?? 'N/A' },
    { label: 'Est. Paid Traffic Cost', value: metrics.estimated_paid_traffic_cost != null ? `$${metrics.estimated_paid_traffic_cost.toLocaleString()}` : 'N/A' },
    { label: 'Backlinks', value: metrics.backlinks?.toLocaleString() ?? 'N/A' },
    { label: 'Referring Domains', value: metrics.referring_domains?.toLocaleString() ?? 'N/A' },
  ] : [];

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Domain Rank Overview</h1>
          </div>

          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-6">
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Target Domain
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="example.com"
              className="w-full bg-[#141414] border-2 border-[#2a2a2a] text-white rounded px-3 py-2 text-sm focus:border-[#EF5744] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !target.trim()}
              className="mt-4 px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {loading ? 'Analyzing...' : 'Get Overview'}
            </button>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {metrics && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {metrics.target || target}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {metricCards.map((card, idx) => (
                  <div key={idx} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <p className="text-[#8b8b93] text-xs font-medium mb-2">{card.label}</p>
                    <p className="text-white text-xl font-bold">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
