'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Users, Loader2, Download } from 'lucide-react';

interface CompetitorResult {
  domain?: string;
  avg_position?: number;
  intersections?: number;
  full_domain_metrics?: {
    organic?: {
      etv?: number;
      count?: number;
    };
    paid?: {
      etv?: number;
      count?: number;
    };
  };
  estimated_paid_traffic_cost?: number;
}

export default function SERPCompetitorsPage() {
  const [keywordsText, setKeywordsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<CompetitorResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsText
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!keywords.length) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/labs/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location_code: 2840, language_code: 'en' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items || [];
      setResults(items);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Domain', 'Avg Position', 'Intersections', 'Organic ETV', 'Organic Keywords', 'Paid ETV'];
    const rows = results.map((r) => [
      r.domain || '',
      r.avg_position ?? '',
      r.intersections ?? '',
      r.full_domain_metrics?.organic?.etv ?? '',
      r.full_domain_metrics?.organic?.count ?? '',
      r.full_domain_metrics?.paid?.etv ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'serp-competitors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">SERP Competitors</h1>
          </div>

          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-6">
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Keywords (one per line)
            </label>
            <textarea
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={4}
              placeholder="seo tools&#10;keyword research&#10;backlink checker"
              className="w-full bg-[#141414] border-2 border-[#2a2a2a] text-white rounded px-3 py-2 text-sm focus:border-[#EF5744] outline-none resize-none"
            />
            <button
              type="submit"
              disabled={loading || !keywordsText.trim()}
              className="mt-4 px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {loading ? 'Finding...' : 'Find Competitors'}
            </button>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">{results.length} competing domains</span>
                <button onClick={exportCSV} className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors">
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-3 text-[#8b8b93] font-medium">Domain</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">Avg Position</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">Intersections</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">Organic ETV</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] font-medium">Organic KWs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-5 py-3 text-white font-medium">{item.domain}</td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{item.avg_position?.toFixed(1) ?? '-'}</td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{item.intersections?.toLocaleString() ?? '-'}</td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">
                          {item.full_domain_metrics?.organic?.etv?.toLocaleString() ?? '-'}
                        </td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">
                          {item.full_domain_metrics?.organic?.count?.toLocaleString() ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
