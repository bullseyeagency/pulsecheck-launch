'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Globe, Search, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Download, FileText, History } from 'lucide-react';

interface SiteEntry {
  siteUrl: string;
  permissionLevel: string;
}

interface InspectionResult {
  url: string;
  verdict: string;
  coverageState: string;
  lastCrawlTime: string | null;
  crawledAs: string | null;
  robotsTxtState: string | null;
  indexingState: string | null;
}

export default function GSCPage() {
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [urlsInput, setUrlsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<InspectionResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [historyResults, setHistoryResults] = useState<any[]>([]);
  const [historySummary, setHistorySummary] = useState<{ total: number; indexed: number; partial: number; notIndexed: number } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch('/api/gsc/sites');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load sites');
        setSites(data.sites || []);
        if (data.sites?.length === 1) {
          setSelectedSite(data.sites[0].siteUrl);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load sites');
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  const loadFromSitemap = async () => {
    if (!selectedSite) return;
    setLoadingSitemaps(true);
    setError('');

    try {
      const res = await fetch('/api/gsc/sitemaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: selectedSite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sitemaps');

      const urls = data.urls || [];
      if (urls.length) {
        setUrlsInput(urls.join('\n'));
      } else {
        setError('No URLs found in sitemaps.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sitemaps');
    } finally {
      setLoadingSitemaps(false);
    }
  };

  const checkIndexStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !urlsInput.trim()) return;

    const urls = urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (!urls.length) return;

    setLoading(true);
    setError('');
    setResults([]);
    setProgress({ current: 0, total: urls.length });

    try {
      // Process one URL at a time for live streaming results
      const allResults: InspectionResult[] = [];

      for (let i = 0; i < urls.length; i++) {
        setProgress({ current: i + 1, total: urls.length });

        const res = await fetch('/api/gsc/inspect-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteUrl: selectedSite, urls: [urls[i]] }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Inspection failed');

        allResults.push(...(data.results || []));
        setResults([...allResults]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['URL', 'Verdict', 'Coverage State', 'Last Crawled', 'Crawled As', 'Robots.txt', 'Indexing State'];
    const rows = results.map((r) => [
      r.url,
      r.verdict,
      r.coverageState,
      r.lastCrawlTime || '',
      r.crawledAs || '',
      r.robotsTxtState || '',
      r.indexingState || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gsc-index-status.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadHistory = async () => {
    if (!selectedSite) return;
    setLoadingHistory(true);
    setShowHistory(true);
    try {
      const res = await fetch('/api/gsc/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: selectedSite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load history');
      setHistoryResults(data.results || []);
      setHistorySummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const verdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle className="h-3 w-3" />
            Indexed
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <AlertTriangle className="h-3 w-3" />
            Partial
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="h-3 w-3" />
            Not Indexed
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="h-3 w-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#2a2a2a] text-[#8b8b93] border border-[#2a2a2a]">
            <Clock className="h-3 w-3" />
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Summary counts
  const passCount = results.filter((r) => r.verdict === 'PASS').length;
  const failCount = results.filter((r) => r.verdict === 'FAIL').length;
  const partialCount = results.filter((r) => r.verdict === 'PARTIAL').length;
  const errorCount = results.filter((r) => r.verdict === 'ERROR' || r.verdict === 'UNKNOWN' || r.verdict === 'NEUTRAL').length;

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">GSC URL Indexing</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Check the Google Search Console index status for your URLs. Paste URLs manually or load from your sitemap.
          </p>

          {/* Form */}
          <form onSubmit={checkIndexStatus} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            {/* Site Selector */}
            <div className="mb-4">
              <label className="block text-sm text-[#a1a1aa] mb-1.5">Site</label>
              {loadingSites ? (
                <div className="flex items-center gap-2 text-[#8b8b93] text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading sites...
                </div>
              ) : (
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] outline-none transition-colors"
                >
                  <option value="">Select a site...</option>
                  {sites.map((site) => (
                    <option key={site.siteUrl} value={site.siteUrl}>
                      {site.siteUrl}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* URLs Input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-[#a1a1aa]">URLs (one per line)</label>
                <button
                  type="button"
                  onClick={loadFromSitemap}
                  disabled={!selectedSite || loadingSitemaps}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#a1a1aa] hover:text-white border border-[#2a2a2a] rounded transition-colors hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingSitemaps ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  Load from Sitemap
                </button>
              </div>
              <textarea
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                placeholder={'https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3'}
                rows={8}
                className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm font-mono focus:border-[#EF5744] outline-none transition-colors resize-none"
              />
              {urlsInput.trim() && (
                <p className="text-xs text-[#8b8b93] mt-1">
                  {urlsInput.split('\n').filter((u) => u.trim()).length} URLs
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !selectedSite || !urlsInput.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress.total > 0
                      ? `Checking ${progress.current}/${progress.total}...`
                      : 'Checking...'}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Check Index Status
                  </>
                )}
              </button>
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#2a2a2a] text-[#a1a1aa] hover:text-white rounded text-sm transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              )}
              <button
                type="button"
                onClick={loadHistory}
                disabled={!selectedSite || loadingHistory}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#2a2a2a] text-[#a1a1aa] hover:text-white rounded text-sm transition-colors hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingHistory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />}
                View History
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Summary Stats */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-xs text-[#8b8b93] mb-1">Indexed</div>
                <div className="text-2xl font-bold text-green-400 font-mono">{passCount}</div>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-xs text-[#8b8b93] mb-1">Not Indexed</div>
                <div className="text-2xl font-bold text-red-400 font-mono">{failCount}</div>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-xs text-[#8b8b93] mb-1">Partial</div>
                <div className="text-2xl font-bold text-yellow-400 font-mono">{partialCount}</div>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <div className="text-xs text-[#8b8b93] mb-1">Errors / Unknown</div>
                <div className="text-2xl font-bold text-[#8b8b93] font-mono">{errorCount}</div>
              </div>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-sm text-[#a1a1aa]">{results.length} URLs inspected</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-left">
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">URL</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Status</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Coverage</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Last Crawled</th>
                      <th className="px-4 py-3 text-[#8b8b93] font-medium">Crawled As</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {results.map((item, i) => (
                      <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs max-w-md truncate" title={item.url}>
                          {item.url}
                        </td>
                        <td className="px-4 py-3">{verdictBadge(item.verdict)}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] text-xs">{item.coverageState}</td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">
                          {formatDate(item.lastCrawlTime)}
                        </td>
                        <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">
                          {item.crawledAs || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History Panel */}
          {showHistory && historyResults.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <History className="h-5 w-5 text-[#EF5744]" />
                <h2 className="text-lg font-bold text-white">Indexing History</h2>
                <button onClick={() => setShowHistory(false)} className="ml-auto text-xs text-[#8b8b93] hover:text-white transition-colors">Close</button>
              </div>

              {historySummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="text-xs text-[#8b8b93] mb-1">Total Tracked</div>
                    <div className="text-2xl font-bold text-white font-mono">{historySummary.total}</div>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="text-xs text-[#8b8b93] mb-1">Indexed</div>
                    <div className="text-2xl font-bold text-green-400 font-mono">{historySummary.indexed}</div>
                    <div className="text-xs text-[#8b8b93] mt-1">{historySummary.total > 0 ? Math.round((historySummary.indexed / historySummary.total) * 100) : 0}%</div>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="text-xs text-[#8b8b93] mb-1">Not Indexed</div>
                    <div className="text-2xl font-bold text-red-400 font-mono">{historySummary.notIndexed}</div>
                    <div className="text-xs text-[#8b8b93] mt-1">{historySummary.total > 0 ? Math.round((historySummary.notIndexed / historySummary.total) * 100) : 0}%</div>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                    <div className="text-xs text-[#8b8b93] mb-1">Partial</div>
                    <div className="text-2xl font-bold text-yellow-400 font-mono">{historySummary.partial}</div>
                  </div>
                </div>
              )}

              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <div className="px-6 py-3 border-b border-[#2a2a2a]">
                  <span className="text-sm text-[#a1a1aa]">Last known status per URL</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1a1a1a] text-left">
                        <th className="px-4 py-3 text-[#8b8b93] font-medium">URL</th>
                        <th className="px-4 py-3 text-[#8b8b93] font-medium">Status</th>
                        <th className="px-4 py-3 text-[#8b8b93] font-medium">Coverage</th>
                        <th className="px-4 py-3 text-[#8b8b93] font-medium">Last Crawled</th>
                        <th className="px-4 py-3 text-[#8b8b93] font-medium">Checked At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {historyResults.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                          <td className="px-4 py-3 text-white font-mono text-xs max-w-md truncate" title={item.pageUrl}>
                            {item.pageUrl}
                          </td>
                          <td className="px-4 py-3">{verdictBadge(item.verdict)}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] text-xs">{item.coverageState || '-'}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">{formatDate(item.lastCrawlTime)}</td>
                          <td className="px-4 py-3 text-[#a1a1aa] font-mono text-xs">{formatDate(item.checkedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {showHistory && historyResults.length === 0 && !loadingHistory && (
            <div className="mt-8 text-center py-8 text-[#8b8b93] text-sm bg-[#141414] border border-[#2a2a2a] rounded">
              No inspection history for this site yet. Run a check first.
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && !showHistory && (
            <div className="text-center py-12 text-[#8b8b93] text-sm">
              Select a site and enter URLs to check their index status.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
