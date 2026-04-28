'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Loader2, CheckCircle, XCircle,
  Gauge, KeyRound, Link2, MapPin, Eye, Users, ArrowRight,
  Star, Share2, Building2,
} from 'lucide-react';

type AuditState = 'idle' | 'crawling' | 'confirm' | 'running' | 'complete';

interface StepStatus {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  field: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
}

const STEP_DEFINITIONS = [
  { name: 'PageSpeed / Lighthouse', icon: Gauge, field: 'pagespeed' },
  { name: 'Keyword Research', icon: KeyRound, field: 'keywords' },
  { name: 'Ranked Keywords', icon: Search, field: 'ranked_keywords' },
  { name: 'Domain & Backlinks', icon: Link2, field: 'backlinks' },
  { name: 'SERP & Local Pack', icon: MapPin, field: 'serp' },
  { name: 'Google Ads', icon: Eye, field: 'ad_transparency' },
  { name: 'Competitor Analysis', icon: Users, field: 'competitors' },
  { name: 'Google Business Profile', icon: Star, field: 'gbp' },
  { name: 'Meta Ads', icon: Share2, field: 'meta_ads' },
  { name: 'Company Research', icon: Building2, field: 'exa' },
];

const DB_FIELD_MAP: Record<string, string> = {
  pagespeed: 'pageSpeedData',
  keywords: 'keywordData',
  ranked_keywords: 'rankingsData',
  backlinks: 'backlinksData',
  serp: 'serpData',
  ad_transparency: 'adsData',
  competitors: 'competitorData',
  gbp: 'gbpData',
  meta_ads: 'metaAdsData',
  exa: 'exaData',
};

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#EF5744] animate-spin" />
      </div>
    }>
      <ScanPageInner />
    </Suspense>
  );
}

function ScanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AuditState>('idle');
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [error, setError] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [crawlData, setCrawlData] = useState<Record<string, unknown> | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [steps, setSteps] = useState<StepStatus[]>(
    STEP_DEFINITIONS.map((d) => ({ ...d, status: 'pending' }))
  );
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const pollAuditStatus = useCallback((id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit/${id}`);
        const json = await res.json();
        if (!res.ok) return;
        const audit = json.audit;
        if (!audit) return;

        setSteps((prev) =>
          prev.map((step) => {
            const value = audit[DB_FIELD_MAP[step.field]];
            if (value === null || value === undefined) {
              return { ...step, status: audit.status === 'running' ? 'running' : 'pending' };
            }
            if (typeof value === 'object' && value !== null && (value as Record<string, unknown>).error) {
              return { ...step, status: 'failed' };
            }
            return { ...step, status: 'complete' };
          })
        );

        if (audit.status === 'complete' || audit.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (audit.status === 'complete') {
            setState('complete');
            setTimeout(() => router.push(`/scan/${id}`), 1000);
          }
        }
      } catch { /* retry */ }
    }, 2000);
  }, [router]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setState('crawling');
    try {
      const res = await fetch('/api/audit/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Crawl failed');
      setIndustry(data.industry || '');
      setLocation(data.location || '');
      setCrawlData(data.crawlData || null);
      setState('confirm');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('idle');
    }
  };

  const handleRunAudit = async () => {
    setError('');
    setState('running');
    setSteps(STEP_DEFINITIONS.map((d) => ({ ...d, status: 'pending' })));
    try {
      const domain = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`).hostname.replace(/^www\./, '');
      const res = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), domain, industry: industry.trim(), location: location.trim(), crawlData: crawlData || {}, ...(notifyEmail.trim() && { notifyEmail: notifyEmail.trim() }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start audit');
      pollAuditStatus(data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('confirm');
    }
  };

  const statusIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'pending': return <span className="w-5 h-5 rounded-full border-2 border-[#2a2a2a] inline-flex" />;
      case 'running': return <Loader2 className="h-5 w-5 text-[#EF5744] animate-spin" />;
      case 'complete': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#EF5744] rounded flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">PulseCheck</span>
          </div>
          <span className="text-[#8b8b93] text-xs">SEO Audit Tool</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        {state === 'idle' && (
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-3">Free SEO Audit</h1>
            <p className="text-[#8b8b93]">Enter any website URL to get a full SEO analysis in minutes.</p>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* IDLE */}
          {state === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <form onSubmit={handleCrawl}>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-3">Website URL</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8b93]" />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="e.g. yourwebsite.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border-2 border-[#2a2a2a] text-white rounded-lg focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Analyze
                    </button>
                  </div>
                  <p className="text-[#8b8b93] text-xs mt-4">
                    Includes PageSpeed, keyword research, rankings, backlinks, SERP, ads &amp; competitor analysis.
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {/* CRAWLING */}
          {state === 'crawling' && (
            <motion.div key="crawling" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-12 text-center"
            >
              <Loader2 className="h-10 w-10 text-[#EF5744] animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">Analyzing site…</p>
              <p className="text-[#8b8b93] text-sm mt-2">Scanning {url}</p>
            </motion.div>
          )}

          {/* CONFIRM */}
          {state === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
                <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-1">Scanning</p>
                <p className="text-white font-mono text-sm mb-6">{url}</p>
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
                  <p className="text-[#a1a1aa] text-sm mb-4">We detected the following. Edit if needed:</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8b8b93] uppercase tracking-wider mb-1.5">Industry</label>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. HVAC, Dentistry, Roofing"
                        className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded-lg focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8b8b93] uppercase tracking-wider mb-1.5">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Tampa, FL"
                        className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded-lg focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
                  <p className="text-[#a1a1aa] text-sm mb-1">Notify me when the report is ready</p>
                  <p className="text-[#8b8b93] text-xs mb-3">Optional — get an email with the report link when the audit finishes.</p>
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded-lg focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                  />
                </div>
                <button
                  onClick={handleRunAudit}
                  className="w-full py-3 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  Run Full Audit <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* RUNNING */}
          {state === 'running' && (
            <motion.div key="running" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
                <p className="text-white font-semibold mb-1">Running Full Audit</p>
                <p className="text-[#8b8b93] text-sm mb-6">{url}</p>
                <div className="space-y-3">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.field}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                          step.status === 'running' ? 'border-[#EF5744]/30 bg-[rgba(239,87,68,0.04)]'
                          : step.status === 'complete' ? 'border-emerald-500/20 bg-emerald-500/5'
                          : step.status === 'failed' ? 'border-red-500/20 bg-red-500/5'
                          : 'border-[#2a2a2a] bg-[#0a0a0a]'
                        }`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${
                          step.status === 'complete' ? 'text-emerald-500'
                          : step.status === 'running' ? 'text-[#EF5744]'
                          : step.status === 'failed' ? 'text-red-500'
                          : 'text-[#8b8b93]'
                        }`} />
                        <span className={`flex-1 text-sm font-medium ${step.status === 'pending' ? 'text-[#8b8b93]' : 'text-white'}`}>
                          {step.name}
                        </span>
                        {statusIcon(step.status)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPLETE */}
          {state === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#141414] border border-emerald-500/20 rounded-xl p-12 text-center"
            >
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">Audit Complete</p>
              <p className="text-[#8b8b93] text-sm mt-2">Loading your report…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
