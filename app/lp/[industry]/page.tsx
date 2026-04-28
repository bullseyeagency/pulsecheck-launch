'use client';

import { useState, useRef, useCallback, useEffect, use } from 'react';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, XCircle, Loader2, Globe,
  Gauge, KeyRound, Search, Link2, MapPin, Eye, Users, Star, Share2, Building2,
  ChevronRight, BarChart3, Zap, CheckCircle2,
} from 'lucide-react';
import { getIndustry } from '@/lib/lp-industries';
import { AuditResultsPanel } from '@/components/AuditResultsPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = 'idle' | 'crawling' | 'running' | 'gate' | 'results';

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
  { name: 'Google Ads Activity', icon: Eye, field: 'ad_transparency' },
  { name: 'Competitor Analysis', icon: Users, field: 'competitors' },
  { name: 'Google Business Profile', icon: Star, field: 'gbp' },
  { name: 'Meta Ads Intelligence', icon: Share2, field: 'meta_ads' },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function gradeColor(grade: string) {
  if (grade?.startsWith('A')) return 'text-emerald-400';
  if (grade?.startsWith('B')) return 'text-green-400';
  if (grade?.startsWith('C')) return 'text-yellow-400';
  if (grade?.startsWith('D')) return 'text-orange-400';
  return 'text-red-400';
}

function StepIcon({ status }: { status: StepStatus['status'] }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 text-[#EF5744] animate-spin flex-shrink-0" />;
  if (status === 'complete') return <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
  return <span className="w-4 h-4 rounded-full border border-[#2a2a2a] flex-shrink-0 inline-block" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IndustryLandingPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = use(params);
  const _config = getIndustry(industry);
  if (!_config) notFound();
  const config = _config!;
  const router = useRouter();
  const searchParams = useSearchParams();
  const bypass = searchParams.get('bypass') === '1';

  const [pageState, setPageState] = useState<PageState>('idle');
  const [url, setUrl] = useState('');
  const [domain, setDomain] = useState('');
  const [auditId, setAuditId] = useState('');
  const [error, setError] = useState('');
  const [steps, setSteps] = useState<StepStatus[]>(
    STEP_DEFINITIONS.map(d => ({ ...d, status: 'pending' }))
  );
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const belowHeroRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const pollAuditStatus = useCallback((id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit/${id}`);
        const json = await res.json();
        if (!res.ok || !json.audit) return;
        const audit = json.audit;

        setSteps(prev =>
          prev.map(step => {
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
          if (bypass) {
            router.push(`/scan/${id}`);
          } else {
            if (audit.report) setReport(audit.report as Record<string, unknown>);
            setPageState('gate');
          }
        }
      } catch { /* retry */ }
    }, 2000);
  }, [bypass, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    setError('');
    const d = getDomain(normalized);
    setDomain(d);
    setPageState('crawling');
    setTimeout(() => belowHeroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    try {
      const crawlRes = await fetch('/api/audit/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });
      const crawlData = await crawlRes.json();
      if (!crawlRes.ok) throw new Error(crawlData.error || 'Crawl failed');

      setPageState('running');
      setSteps(STEP_DEFINITIONS.map(d2 => ({ ...d2, status: 'pending' })));

      const runRes = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalized,
          domain: d,
          industry: config.industry,
          location: crawlData.location || 'United States',
          crawlData: crawlData.crawlData || {},
        }),
      });
      const runData = await runRes.json();
      if (!runRes.ok) throw new Error(runData.error || 'Audit failed to start');

      setAuditId(runData.id);
      pollAuditStatus(runData.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPageState('idle');
    }
  }

  function handleGateSubmit(name: string, email: string, phone: string) {
    if (!auditId) return;
    // Fire-and-forget contact save, redirect straight to full report
    fetch(`/api/audit/${auditId}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    }).catch(() => {});
    router.push(`/scan/${auditId}`);
  }

  const isActive = pageState !== 'idle';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#EF5744] rounded flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">PulseCheck</span>
            <span className="hidden sm:inline text-xs text-[#555]">by Daly Advertising</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#EF5744]/10 border border-[#EF5744]/25">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF5744] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#EF5744]" />
              </span>
              <span className="text-xs text-[#EF5744]">Free audits live</span>
            </div>
            <Link href="/auth/signin" className="text-xs text-[#8b8b93] hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#EF5744]/40 text-[#EF5744] text-xs font-semibold uppercase tracking-wide mb-5">
                Free {config.name} Digital Audit
              </div>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                {config.headline.split(new RegExp(`(${config.name})`, 'i')).map((part, i) =>
                  part.toLowerCase() === config.name.toLowerCase() ? (
                    <span key={i} className="bg-[#EF5744] text-white px-2 py-0.5 rounded-md">{part}</span>
                  ) : part
                )}
              </h1>
              <p className="text-lg text-[#8b8b93] leading-relaxed mb-7">
                {config.subheadline}
              </p>
              <ul className="space-y-3">
                {[
                  '10-point analysis: SEO, speed, ads, local & reputation',
                  'Side-by-side competitor comparison',
                  'Plain-English findings with priority recommendations',
                ].map(point => (
                  <li key={point} className="flex items-center gap-3 text-sm text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-8 shadow-2xl">
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-sm text-[#555] line-through">$350</span>
                <span className="text-3xl font-black text-[#EF5744]">FREE</span>
              </div>
              <h2 className="text-xl font-bold mb-1">Run Your Free {config.name} Audit</h2>
              <p className="text-sm text-[#8b8b93] mb-6">Takes ~2 minutes. No account needed.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="yourbusiness.com"
                    required
                    disabled={isActive}
                    className="w-full pl-9 pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg focus:outline-none focus:border-[#EF5744] transition-colors text-sm placeholder-[#555] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isActive}
                  className="w-full flex items-center justify-center gap-2 bg-[#EF5744] hover:bg-[#c93a2a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {isActive
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
                    : <>Get My Free {config.name} Audit <ArrowRight className="h-4 w-4" /></>}
                </button>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <p className="text-center text-xs text-[#555]">Free · No credit card · No account required</p>
              </form>
              <p className="mt-4 text-xs text-[#555] leading-relaxed">
                We analyze 10 data sources including Google PageSpeed, DataForSEO, Google Maps, and Meta Ad Library.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic sections */}
      <div ref={belowHeroRef}>
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {pageState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

              {/* Stats */}
              <section className="py-14 px-4 bg-[#141414] border-y border-[#1f1f1f]">
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                  {[
                    { stat: '80%', label: 'more leads generated by businesses using marketing automation — HubSpot 2024' },
                    { stat: '37%', label: 'higher conversion rates with AI-powered marketing vs. traditional — HubSpot 2025' },
                    { stat: '10', label: 'data sources analyzed per audit — not just an SEO score' },
                  ].map(({ stat, label }) => (
                    <div key={stat}>
                      <div className="text-4xl sm:text-5xl font-black text-white mb-2">{stat}</div>
                      <div className="text-sm text-[#8b8b93]">{label}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Industry-specific problems */}
              <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold">
                      Why most {config.name.toLowerCase()} businesses are invisible online
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {config.problems.map(({ title, desc }) => (
                      <div key={title} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6">
                        <h3 className="font-bold text-white mb-2">{title}</h3>
                        <p className="text-sm text-[#8b8b93] leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* How it works */}
              <section className="py-20 px-4 bg-[#0d0d0d]">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
                  </div>
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-0">
                    {[
                      { step: '1', title: 'Enter your website URL', desc: 'Paste your URL and we crawl your site in seconds — detecting your location and structure automatically.' },
                      { step: '2', title: `We run 10 checks on your ${config.name} presence`, desc: 'Our system hits 10 data sources simultaneously: Google PageSpeed, DataForSEO, Google Maps, Meta Ad Library, and more.' },
                      { step: '3', title: 'Get your full report', desc: 'Plain-English findings with a competitor comparison, keyword opportunities, and prioritized recommendations.' },
                    ].map(({ step, title, desc }, i) => (
                      <div key={step} className="flex flex-col lg:flex-row items-center flex-1 gap-6">
                        <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-xs">
                          <div className="w-12 h-12 rounded-full bg-[#EF5744] flex items-center justify-center text-white font-bold text-lg mb-4 flex-shrink-0">
                            {step}
                          </div>
                          <h3 className="font-bold text-white mb-2">{title}</h3>
                          <p className="text-sm text-[#8b8b93] leading-relaxed">{desc}</p>
                        </div>
                        {i < 2 && (
                          <div className="hidden lg:flex items-center justify-center flex-1">
                            <ChevronRight className="h-8 w-8 text-[#EF5744]/30" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Testimonial */}
              <section className="py-20 px-4">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="flex justify-center gap-0.5 mb-6">
                    {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xl text-white leading-relaxed mb-6">"{config.testimonial.quote}"</p>
                  <div>
                    <p className="font-bold text-white">{config.testimonial.name}</p>
                    <p className="text-sm text-[#8b8b93]">{config.testimonial.role}</p>
                  </div>
                </div>
              </section>

              {/* Bottom CTA */}
              <section className="py-20 px-4 bg-[#141414] border-t border-[#1f1f1f]">
                <div className="max-w-6xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                        Ready to see what's holding your {config.name.toLowerCase()} business back?
                      </h2>
                      <ul className="space-y-3 mb-6">
                        {[
                          'Website speed score and Core Web Vitals fixes',
                          'Google search ranking gaps and missed keywords',
                          'Local Maps optimization status',
                          'Competitor ad intelligence (Google + Meta)',
                          'Domain authority and backlink profile',
                          'Plain-English recommendations — no jargon',
                        ].map(item => (
                          <li key={item} className="flex items-center gap-3 text-sm text-white">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-[#8b8b93] leading-relaxed">
                        We don't just run audits. We build revenue systems. PulseCheck is the diagnostic layer — your roadmap to becoming the most visible {config.name.toLowerCase()} business in your market.
                      </p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-8">
                      <div className="flex items-baseline gap-3 mb-5">
                        <span className="text-sm text-[#555] line-through">$350</span>
                        <span className="text-3xl font-black text-[#EF5744]">FREE</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">Run Your Free {config.name} Audit</h3>
                      <p className="text-sm text-[#8b8b93] mb-6">Takes ~2 minutes. No account needed.</p>
                      <a
                        href="#"
                        onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="block w-full text-center bg-[#EF5744] hover:bg-[#c93a2a] text-white font-bold py-3 rounded-lg transition-colors mb-3"
                      >
                        Get My Free {config.name} Audit →
                      </a>
                      <p className="text-xs text-[#555] text-center">
                        We analyze 10 data sources including Google PageSpeed, DataForSEO, Google Maps, and Meta Ad Library.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="border-t border-[#1a1a1a] py-8 px-4">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-[#555]">&copy; 2025 Daly Advertising · PulseCheck</p>
                  <div className="flex gap-6">
                    <a href="#" className="text-sm text-[#555] hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="text-sm text-[#555] hover:text-white transition-colors">Terms</a>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* CRAWLING */}
          {pageState === 'crawling' && (
            <motion.div key="crawling" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="py-24 px-4">
              <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-[#EF5744]/20 flex items-center justify-center">
                    <Globe className="h-7 w-7 text-[#EF5744]" />
                  </div>
                  <Loader2 className="absolute inset-0 w-16 h-16 text-[#EF5744]/60 animate-spin" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-2">Analyzing <span className="text-[#EF5744]">{domain}</span></p>
                  <p className="text-sm text-[#8b8b93]">Reading your website, detecting location...</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* RUNNING */}
          {pageState === 'running' && (
            <motion.div key="running" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="py-16 px-4">
              <div className="max-w-2xl mx-auto">
                {(() => {
                  const done = steps.filter(s => s.status === 'complete' || s.status === 'failed').length;
                  const pct = Math.round((done / steps.length) * 100);
                  return (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white">Auditing <span className="text-[#EF5744]">{domain}</span></p>
                        <span className="text-xs text-[#8b8b93]">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <motion.div className="h-full bg-[#EF5744] rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                      </div>
                    </div>
                  );
                })()}
                <div className="space-y-2">
                  {steps.map(step => {
                    const Icon = step.icon;
                    return (
                      <div key={step.field} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                        step.status === 'running' ? 'border-[#EF5744]/30 bg-[#EF5744]/5' :
                        step.status === 'complete' ? 'border-emerald-500/20 bg-emerald-500/5' :
                        step.status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                        'border-[#1f1f1f] bg-[#141414]'
                      }`}>
                        <Icon className={`h-4 w-4 flex-shrink-0 ${step.status === 'running' ? 'text-[#EF5744]' : step.status === 'complete' ? 'text-emerald-500' : step.status === 'failed' ? 'text-red-500' : 'text-[#444]'}`} />
                        <span className={`flex-1 text-sm ${step.status === 'pending' ? 'text-[#555]' : 'text-white'}`}>{step.name}</span>
                        <StepIcon status={step.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* GATE */}
          {pageState === 'gate' && (
            <motion.div key="gate" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="py-16 px-4">
              <GateSection domain={domain} industryName={config.name} onSubmit={handleGateSubmit} />
            </motion.div>
          )}

          {/* RESULTS */}
          {pageState === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="py-16 px-4">
              <AuditResultsPanel auditId={auditId} report={report} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

function GateSection({ domain, industryName, onSubmit }: { domain: string; industryName: string; onSubmit: (name: string, email: string, phone: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#EF5744]/15 border border-[#EF5744]/30 flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-[#EF5744]" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
        Your {industryName} audit for <span className="text-[#EF5744]">{domain}</span> is ready
      </h2>
      <p className="text-[#8b8b93] mb-8">
        We found issues affecting your visibility. Enter your info to unlock your full report — we'll email you a copy too.
      </p>
      <form onSubmit={e => { e.preventDefault(); if (!email.trim()) return; onSubmit(name.trim(), email.trim(), phone.trim()); }} className="space-y-3 text-left">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full bg-[#141414] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm placeholder-[#555] focus:outline-none focus:border-[#EF5744] transition-colors" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address *" required className="w-full bg-[#141414] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm placeholder-[#555] focus:outline-none focus:border-[#EF5744] transition-colors" />
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full bg-[#141414] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm placeholder-[#555] focus:outline-none focus:border-[#EF5744] transition-colors" />
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-bold py-3 rounded-lg transition-colors">
          <span>Unlock My Report</span><ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-center text-xs text-[#555]">No spam. We'll send your report and that's it.</p>
      </form>
    </div>
  );
}
