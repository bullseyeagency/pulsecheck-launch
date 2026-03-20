'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { FileSearch, Loader2 } from 'lucide-react';

interface PageMetrics {
  status_code?: number;
  size?: number;
  total_dom_size?: number;
  load_time?: number;
  title?: string;
  meta?: { description?: string };
  htags?: Record<string, string[]>;
  images_count?: number;
  images_size?: number;
  internal_links_count?: number;
  external_links_count?: number;
  words_count?: number;
  plain_text_word_count?: number;
  checks?: Record<string, boolean>;
  page_timing?: { time_to_interactive?: number; dom_complete?: number };
  spell?: { hunspell_language_model?: string };
  url?: string;
}

export default function InstantAuditPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setMetrics(null);

    try {
      const res = await fetch('/api/on-page/instant-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const items = data.results?.[0]?.items;
      if (items?.length) {
        setMetrics(items[0]);
      } else {
        setError('No data returned for this URL.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getHTagCount = (tag: string) => {
    if (!metrics?.htags?.[tag]) return 0;
    return metrics.htags[tag].length;
  };

  const issues = metrics?.checks
    ? Object.entries(metrics.checks).filter(([, v]) => v === true)
    : [];

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <FileSearch className="h-7 w-7 text-[#EF5744]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Instant Audit</h1>
              <p className="text-[#8b8b93] text-sm mt-1">
                Analyze any page for on-page SEO metrics instantly.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Page URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page"
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
                      Auditing...
                    </span>
                  ) : (
                    'Run Audit'
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
          {metrics && (
            <div className="space-y-6">
              {/* URL bar */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-1">Analyzed URL</p>
                <p className="text-white text-sm font-mono break-all">{metrics.url || url}</p>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Status Code', value: metrics.status_code ?? 'N/A' },
                  { label: 'Page Size', value: metrics.size ? `${(metrics.size / 1024).toFixed(1)} KB` : 'N/A' },
                  { label: 'Load Time', value: metrics.load_time ? `${metrics.load_time.toFixed(2)}s` : 'N/A' },
                  { label: 'Word Count', value: metrics.plain_text_word_count ?? metrics.words_count ?? 'N/A' },
                  { label: 'Images', value: metrics.images_count ?? 'N/A' },
                  { label: 'Internal Links', value: metrics.internal_links_count ?? 'N/A' },
                  { label: 'External Links', value: metrics.external_links_count ?? 'N/A' },
                  { label: 'DOM Size', value: metrics.total_dom_size ? `${(metrics.total_dom_size / 1024).toFixed(1)} KB` : 'N/A' },
                ].map((card) => (
                  <div key={card.label} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-1">{card.label}</p>
                    <p className="text-white text-xl font-bold">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Title & Meta */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 space-y-4">
                <div>
                  <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-1">Title</p>
                  <p className="text-white text-sm">{metrics.title || 'No title found'}</p>
                </div>
                <div>
                  <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-1">Meta Description</p>
                  <p className="text-[#a1a1aa] text-sm">{metrics.meta?.description || 'No meta description found'}</p>
                </div>
              </div>

              {/* Heading counts */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                <p className="text-white font-semibold mb-4">Heading Tags</p>
                <div className="grid grid-cols-3 gap-4">
                  {['h1', 'h2', 'h3'].map((tag) => (
                    <div key={tag} className="text-center">
                      <p className="text-[#EF5744] text-2xl font-bold">{getHTagCount(tag)}</p>
                      <p className="text-[#8b8b93] text-xs uppercase mt-1">{tag.toUpperCase()} tags</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues */}
              {issues.length > 0 && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                  <p className="text-white font-semibold mb-4">On-Page Issues ({issues.length})</p>
                  <div className="space-y-2">
                    {issues.map(([key]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-[#EF5744] flex-shrink-0" />
                        <span className="text-[#a1a1aa]">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
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
