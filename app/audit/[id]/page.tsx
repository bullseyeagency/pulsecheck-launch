'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import {
  Download, Share2, RefreshCw, Loader2, FileText,
  AlertTriangle, AlertCircle, Info, ChevronUp,
  Gauge, KeyRound, Globe, Users, Megaphone, Lightbulb, BarChart3,
  ArrowUpDown,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AuditData {
  id: string;
  url: string;
  domain: string;
  industry: string;
  location: string;
  status: string;
  created_at: string;
  overall_grade: string;
  pagespeed_mobile: number | null;
  pagespeed_desktop: number | null;
  pagespeed_mobile_vitals: Record<string, unknown> | null;
  pagespeed_desktop_vitals: Record<string, unknown> | null;
  pagespeed_mobile_opportunities: { title: string; description: string }[];
  pagespeed_desktop_opportunities: { title: string; description: string }[];
  ranked_keywords_count: number;
  est_monthly_traffic: number;
  total_issues: number;
  issues: { severity: string; issue: string; description: string; category: string }[];
  ranked_keywords: { keyword: string; position: number; url: string; volume: number; traffic_est: number }[];
  position_distribution: Record<string, number>;
  keyword_opportunities: {
    keyword: string;
    volume: number;
    competition: string;
    ci: number;
    cpc: number;
    opportunity: string;
  }[];
  ad_status: { target_running: boolean; competitors_running: boolean; details: string };
  local_pack: { position: number; name: string; rating: number; reviews: number }[];
  organic_top5: { position: number; domain: string; url: string; keyword: string }[];
  keyword_gap: { keyword: string; competitor: string; competitor_position: number; volume: number }[];
  recommendations: {
    priority: string;
    category: string;
    title: string;
    description: string;
    impact: string;
  }[];
}

/* -------------------------------------------------------------------------- */
/*  Section IDs                                                                */
/* -------------------------------------------------------------------------- */

const SECTIONS = [
  { id: 'executive-summary', label: 'Executive Summary', icon: BarChart3 },
  { id: 'technical-issues', label: 'Technical Issues', icon: AlertTriangle },
  { id: 'pagespeed', label: 'PageSpeed', icon: Gauge },
  { id: 'rankings', label: 'Current Rankings', icon: Globe },
  { id: 'opportunities', label: 'Keyword Opportunities', icon: KeyRound },
  { id: 'competitive', label: 'Competitive Landscape', icon: Users },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function gradeColor(grade: string) {
  if (grade === 'A' || grade === 'A+') return 'text-emerald-400';
  if (grade === 'B' || grade === 'B+') return 'text-blue-400';
  if (grade === 'C' || grade === 'C+') return 'text-yellow-400';
  if (grade === 'D') return 'text-orange-400';
  return 'text-red-400';
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-[#8b8b93]';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBorderColor(score: number | null) {
  if (score === null) return 'border-[#2a2a2a]';
  if (score >= 80) return 'border-emerald-500';
  if (score >= 50) return 'border-yellow-500';
  return 'border-red-500';
}

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return map[severity] || map.low;
}

function opportunityBadge(level: string) {
  const map: Record<string, string> = {
    HIGHEST: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    HIGH: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-[#2a2a2a] text-[#8b8b93] border-[#2a2a2a]',
  };
  return map[level] || map.LOW;
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    P0: 'bg-red-500/15 text-red-400 border-red-500/30',
    P1: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    P2: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    P3: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return map[priority] || map.P3;
}

/* -------------------------------------------------------------------------- */
/*  Transform raw DB audit → AuditData                                        */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAudit(raw: any): AuditData {
  const report = raw.report || {};
  const scores = report.scores || {};
  const totalIssues = report.totalIssues || {};
  const pageSpeedData = raw.pageSpeedData || {};
  const rankingsData = raw.rankingsData || {};
  const keywordData = raw.keywordData || {};
  const serpData = raw.serpData || {};
  const adsData = raw.adsData || {};
  const competitorData = raw.competitorData || {};

  const mobile = pageSpeedData.mobile;
  const desktop = pageSpeedData.desktop;

  const extractPsiScore = (data: any): number | null => {
    if (!data) return null;
    const d = data.lighthouseResult ?? data;
    const score = d?.categories?.performance?.score;
    return typeof score === 'number' ? Math.round(score * 100) : null;
  };

  const extractPsiCategoryScore = (data: any, category: string): number => {
    if (!data) return 0;
    const d = data.lighthouseResult ?? data;
    const score = d?.categories?.[category]?.score;
    return typeof score === 'number' ? Math.round(score * 100) : 0;
  };

  const extractVitals = (data: any) => {
    const d = data?.lighthouseResult ?? data;
    if (!d?.audits) return null;
    const a = d.audits;
    const v = (key: string) => a[key]?.displayValue ?? a[key]?.numericValue ?? null;
    const p = (key: string) => (typeof a[key]?.score === 'number' ? a[key].score >= 0.9 : undefined);
    return {
      fcp: v('first-contentful-paint'), fcp_pass: p('first-contentful-paint'),
      lcp: v('largest-contentful-paint'), lcp_pass: p('largest-contentful-paint'),
      tbt: v('total-blocking-time'), tbt_pass: p('total-blocking-time'),
      cls: v('cumulative-layout-shift'), cls_pass: p('cumulative-layout-shift'),
    };
  };

  const extractOpportunities = (data: any): { title: string; description: string }[] => {
    const d = data?.lighthouseResult ?? data;
    if (!d?.audits) return [];
    return Object.values(d.audits as Record<string, any>)
      .filter((a: any) => a.details?.type === 'opportunity' && typeof a.score === 'number' && a.score < 0.9)
      .slice(0, 5)
      .map((a: any) => ({ title: a.title || '', description: a.description || '' }));
  };

  // Ranked keywords from DataForSEO ranked_keywords response
  const rankItems: any[] = rankingsData.items || [];
  const rankedKeywords = rankItems.slice(0, 100).map((item: any) => {
    const kd = item.keyword_data || {};
    const se = item.ranked_serp_element?.serp_item || {};
    return {
      keyword: kd.keyword || '',
      position: se.rank_absolute || se.position || 0,
      url: se.url || '',
      volume: kd.keyword_info?.search_volume || 0,
      traffic_est: Math.round(se.etv || 0),
    };
  });

  const positionDistribution: Record<string, number> = { '1-3': 0, '4-10': 0, '11-20': 0, '21-50': 0, '51-100': 0 };
  for (const kw of rankedKeywords) {
    if (kw.position <= 3) positionDistribution['1-3']++;
    else if (kw.position <= 10) positionDistribution['4-10']++;
    else if (kw.position <= 20) positionDistribution['11-20']++;
    else if (kw.position <= 50) positionDistribution['21-50']++;
    else if (kw.position <= 100) positionDistribution['51-100']++;
  }

  // Keyword opportunities from DataForSEO keyword volume response
  const kwItems: any[] = Array.isArray(keywordData.items)
    ? keywordData.items
    : Array.isArray(keywordData.volume)
    ? []
    : [];
  const keywordOpportunities = kwItems.slice(0, 50).map((item: any) => {
    const vol = item.search_volume || 0;
    const ci = item.competition_index || 0;
    let opportunity = 'LOW';
    if (vol > 1000 && ci < 30) opportunity = 'HIGHEST';
    else if (vol > 500 && ci < 50) opportunity = 'HIGH';
    else if (vol > 100 && ci < 70) opportunity = 'MEDIUM';
    return {
      keyword: item.keyword || '',
      volume: vol,
      competition: item.competition || 'UNKNOWN',
      ci,
      cpc: item.cpc || 0,
      opportunity,
    };
  });

  // SERP — SearchAPI returns organic_results / local_results at top level
  const organicResults: any[] = serpData.organic?.organic_results || [];
  const localResults: any[] = serpData.maps?.local_results || [];

  const localPack = localResults.slice(0, 5).map((item: any, i: number) => ({
    position: item.position || i + 1,
    name: item.title || '',
    rating: item.rating || 0,
    reviews: typeof item.reviews === 'number' ? item.reviews : parseInt(String(item.reviews).replace(/\D/g, '')) || 0,
  }));

  const organic_top5 = organicResults.slice(0, 5).map((item: any, i: number) => {
    let domain = item.domain || '';
    if (!domain && item.link) {
      try { domain = new URL(item.link).hostname.replace(/^www\./, ''); } catch { domain = ''; }
    }
    return { position: item.position || i + 1, domain, url: item.link || '', keyword: `${raw.industry} ${raw.location}` };
  });

  // Ad status
  const targetAds: any[] = adsData.transparency?.ad_creatives || adsData.transparency?.ads || [];
  const paidAds: any[] = adsData.paidAds?.ads || [];
  const adStatus = {
    target_running: targetAds.length > 0,
    competitors_running: paidAds.length > 0,
    details: targetAds.length > 0 ? `${targetAds.length} active ad creatives found` : 'No active ads detected',
  };

  // Keyword gap from competitor rankings
  const competitors: any[] = competitorData.competitors || [];
  const keywordGap: AuditData['keyword_gap'] = [];
  for (const comp of competitors.slice(0, 3)) {
    const compItems: any[] = comp.rankings?.items || [];
    for (const item of compItems) {
      const kd = item.keyword_data || {};
      const se = item.ranked_serp_element?.serp_item || {};
      const vol = kd.keyword_info?.search_volume || 0;
      if (vol === 0) continue; // skip brand/niche keywords with no tracked volume
      keywordGap.push({
        keyword: kd.keyword || '',
        competitor: comp.domain || '',
        competitor_position: se.rank_absolute || se.position || 0,
        volume: vol,
      });
      if (keywordGap.filter(k => k.competitor === comp.domain).length >= 10) break;
    }
  }

  const issueTotal = (totalIssues.critical || 0) + (totalIssues.high || 0) + (totalIssues.medium || 0) + (totalIssues.low || 0);

  return {
    id: raw.id,
    url: raw.url,
    domain: raw.domain,
    industry: raw.industry,
    location: raw.location,
    status: raw.status,
    created_at: raw.createdAt,
    overall_grade: report.overallGrade || 'N/A',
    pagespeed_mobile: extractPsiScore(mobile) ?? scores.pagespeedMobile ?? null,
    pagespeed_desktop: extractPsiScore(desktop) ?? scores.pagespeedDesktop ?? null,
    pagespeed_mobile_vitals: extractVitals(mobile),
    pagespeed_desktop_vitals: extractVitals(desktop),
    pagespeed_mobile_opportunities: extractOpportunities(mobile),
    pagespeed_desktop_opportunities: extractOpportunities(desktop),
    ranked_keywords_count: report.totalKeywords || rankedKeywords.length,
    est_monthly_traffic: report.estimatedTraffic || 0,
    total_issues: issueTotal,
    issues: report.issues || [],
    ranked_keywords: rankedKeywords,
    position_distribution: positionDistribution,
    keyword_opportunities: keywordOpportunities,
    ad_status: adStatus,
    local_pack: localPack,
    organic_top5,
    keyword_gap: keywordGap,
    recommendations: report.recommendations || [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [issueSort, setIssueSort] = useState<'severity' | 'category'>('severity');
  const [kwSort, setKwSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'volume', dir: 'desc' });
  const [copied, setCopied] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/audit/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load audit');
        setData(transformAudit(json.audit));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load audit');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* Intersection observer for active section */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id: sId }) => {
      const el = sectionRefs.current[sId];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(sId);
        },
        { rootMargin: '-20% 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [data]);

  const scrollTo = (sId: string) => {
    sectionRefs.current[sId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExport = async (format: 'html' | 'pdf') => {
    window.open(`/api/audit/${id}/export/${format}`, '_blank');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedIssues = useCallback(() => {
    if (!data?.issues) return [];
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...data.issues].sort((a, b) => {
      if (issueSort === 'severity') return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
      return a.category.localeCompare(b.category);
    });
  }, [data?.issues, issueSort]);

  const sortedOpportunities = useCallback(() => {
    if (!data?.keyword_opportunities) return [];
    return [...data.keyword_opportunities].sort((a, b) => {
      const key = kwSort.key as keyof typeof a;
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return kwSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return kwSort.dir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data?.keyword_opportunities, kwSort]);

  const toggleKwSort = (key: string) => {
    setKwSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="ml-64 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#EF5744] animate-spin" />
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
          <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500/30 rounded p-6">
            <p className="text-red-400">{error || 'Audit not found'}</p>
          </div>
        </main>
      </>
    );
  }

  const groupedRecs = (data.recommendations || []).reduce<Record<string, typeof data.recommendations>>(
    (acc, rec) => {
      if (!acc[rec.priority]) acc[rec.priority] = [];
      acc[rec.priority].push(rec);
      return acc;
    },
    {}
  );

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a]">
        {/* Action bar */}
        <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#2a2a2a] px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">{data.domain}</p>
              <p className="text-[#8b8b93] text-xs">
                {data.industry} &middot; {data.location} &middot;{' '}
                {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('html')}
                className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export HTML
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Export PDF
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={() => router.push(`/audit?url=${encodeURIComponent(data.url)}`)}
                className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Re-run
              </button>
            </div>
          </div>
        </div>

        <div className="flex max-w-7xl mx-auto">
          {/* Section nav */}
          <nav className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] w-48 flex-shrink-0 py-6 pr-4 overflow-y-auto">
            <ul className="space-y-1">
              {SECTIONS.map(({ id: sId, label, icon: Icon }) => (
                <li key={sId}>
                  <button
                    onClick={() => scrollTo(sId)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                      activeSection === sId
                        ? 'bg-[rgba(239,87,68,0.12)] text-[#EF5744]'
                        : 'text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Report content */}
          <div className="flex-1 py-6 px-4 lg:px-8 space-y-8 min-w-0">
            {/* ---- SECTION 1: Executive Summary ---- */}
            <section
              ref={(el) => { sectionRefs.current['executive-summary'] = el; }}
              id="executive-summary"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#EF5744]" />
                Executive Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  {
                    label: 'Overall Grade',
                    value: data.overall_grade || 'N/A',
                    className: gradeColor(data.overall_grade),
                    large: true,
                  },
                  {
                    label: 'Mobile Score',
                    value: data.pagespeed_mobile ?? 'N/A',
                    className: scoreColor(data.pagespeed_mobile),
                  },
                  {
                    label: 'Desktop Score',
                    value: data.pagespeed_desktop ?? 'N/A',
                    className: scoreColor(data.pagespeed_desktop),
                  },
                  { label: 'Ranked Keywords', value: data.ranked_keywords_count ?? 0, className: 'text-white' },
                  {
                    label: 'Est. Monthly Traffic',
                    value:
                      data.est_monthly_traffic != null
                        ? data.est_monthly_traffic.toLocaleString()
                        : 'N/A',
                    className: 'text-white',
                  },
                  {
                    label: 'Total Issues',
                    value: data.total_issues ?? 0,
                    className: (data.total_issues ?? 0) > 10 ? 'text-red-400' : (data.total_issues ?? 0) > 5 ? 'text-yellow-400' : 'text-emerald-400',
                  },
                ].map((card) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#141414] border border-[#2a2a2a] rounded p-4"
                  >
                    <p className="text-[#8b8b93] text-[10px] uppercase tracking-wider mb-1">{card.label}</p>
                    <p className={`font-bold ${card.large ? 'text-3xl' : 'text-xl'} ${card.className}`}>
                      {card.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ---- SECTION 2: Technical Issues ---- */}
            <section
              ref={(el) => { sectionRefs.current['technical-issues'] = el; }}
              id="technical-issues"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#EF5744]" />
                  Technical SEO Issues
                </h2>
                <button
                  onClick={() => setIssueSort(issueSort === 'severity' ? 'category' : 'severity')}
                  className="text-xs text-[#8b8b93] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Sort by {issueSort === 'severity' ? 'category' : 'severity'}
                </button>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Severity</th>
                      <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Issue</th>
                      <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden md:table-cell">Description</th>
                      <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIssues().map((issue, i) => (
                      <tr
                        key={i}
                        className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                          i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${severityBadge(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-white">{issue.issue}</td>
                        <td className="px-4 py-2.5 text-[#a1a1aa] hidden md:table-cell">{issue.description}</td>
                        <td className="px-4 py-2.5 text-[#8b8b93] hidden lg:table-cell">{issue.category}</td>
                      </tr>
                    ))}
                    {(!data.issues || data.issues.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#8b8b93]">
                          No issues found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---- SECTION 3: PageSpeed ---- */}
            <section
              ref={(el) => { sectionRefs.current['pagespeed'] = el; }}
              id="pagespeed"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#EF5744]" />
                PageSpeed Analysis
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(['mobile', 'desktop'] as const).map((device) => {
                  const score = device === 'mobile' ? data.pagespeed_mobile : data.pagespeed_desktop;
                  const vitals = (device === 'mobile' ? data.pagespeed_mobile_vitals : data.pagespeed_desktop_vitals) as Record<string, unknown> | null;
                  const opportunities = device === 'mobile' ? data.pagespeed_mobile_opportunities : data.pagespeed_desktop_opportunities;

                  return (
                    <div key={device} className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
                      <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-4 font-semibold">
                        {device === 'mobile' ? 'Mobile' : 'Desktop'}
                      </p>

                      {/* Score circle */}
                      <div className="flex justify-center mb-6">
                        <div className={`w-24 h-24 rounded-full border-4 ${scoreBorderColor(score)} flex items-center justify-center`}>
                          <span className={`text-3xl font-bold ${scoreColor(score)}`}>
                            {score ?? '--'}
                          </span>
                        </div>
                      </div>

                      {/* Core Web Vitals */}
                      {vitals && (
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-[#8b8b93] uppercase tracking-wider font-medium">Core Web Vitals</p>
                          {(['FCP', 'LCP', 'TBT', 'CLS'] as const).map((metric) => {
                            const val = vitals[metric.toLowerCase()] as string | number | undefined;
                            const pass = vitals[`${metric.toLowerCase()}_pass`] as boolean | undefined;
                            return (
                              <div key={metric} className="flex items-center justify-between text-sm">
                                <span className="text-[#a1a1aa]">{metric}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-mono text-xs">{val ?? '--'}</span>
                                  {pass !== undefined && (
                                    <span className={`w-2 h-2 rounded-full ${pass ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Opportunities */}
                      {opportunities && opportunities.length > 0 && (
                        <div>
                          <p className="text-xs text-[#8b8b93] uppercase tracking-wider font-medium mb-2">
                            Top Opportunities
                          </p>
                          <ul className="space-y-1.5">
                            {opportunities.slice(0, 5).map((opp, i) => (
                              <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-2">
                                <ChevronUp className="h-3 w-3 text-[#EF5744] flex-shrink-0 mt-0.5" />
                                {opp.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ---- SECTION 4: Current Rankings ---- */}
            <section
              ref={(el) => { sectionRefs.current['rankings'] = el; }}
              id="rankings"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#EF5744]" />
                Current Rankings
                {data.ranked_keywords && (
                  <span className="text-xs font-normal text-[#8b8b93] ml-2">
                    ({data.ranked_keywords.length} keywords)
                  </span>
                )}
              </h2>

              {/* Position distribution */}
              {data.position_distribution && (
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { range: '1-3', color: 'bg-emerald-500' },
                    { range: '4-10', color: 'bg-blue-500' },
                    { range: '11-20', color: 'bg-yellow-500' },
                    { range: '21-50', color: 'bg-orange-500' },
                    { range: '51-100', color: 'bg-red-500' },
                  ].map(({ range, color }) => (
                    <div key={range} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
                      <div className={`w-2 h-2 rounded-full ${color} mx-auto mb-1.5`} />
                      <p className="text-white font-bold text-lg">{data.position_distribution[range] ?? 0}</p>
                      <p className="text-[#8b8b93] text-[10px] uppercase tracking-wider">Pos {range}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Keyword</th>
                        <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Position</th>
                        <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden md:table-cell">URL</th>
                        <th className="text-right px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Volume</th>
                        <th className="text-right px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Traffic Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.ranked_keywords || []).map((kw, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                            i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'
                          }`}
                        >
                          <td className="px-4 py-2.5 text-white">{kw.keyword}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-mono font-bold ${kw.position <= 3 ? 'text-emerald-400' : kw.position <= 10 ? 'text-blue-400' : 'text-[#a1a1aa]'}`}>
                              {kw.position}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#8b8b93] font-mono text-xs max-w-[200px] truncate hidden md:table-cell">{kw.url}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{kw.volume?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{kw.traffic_est?.toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!data.ranked_keywords || data.ranked_keywords.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[#8b8b93]">
                            No ranked keywords found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ---- SECTION 5: Keyword Opportunities ---- */}
            <section
              ref={(el) => { sectionRefs.current['opportunities'] = el; }}
              id="opportunities"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#EF5744]" />
                Keyword Opportunities
              </h2>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        {[
                          { key: 'keyword', label: 'Keyword', align: 'text-left' },
                          { key: 'volume', label: 'Volume', align: 'text-right' },
                          { key: 'competition', label: 'Competition', align: 'text-left' },
                          { key: 'ci', label: 'CI', align: 'text-right' },
                          { key: 'cpc', label: 'CPC', align: 'text-right' },
                          { key: 'opportunity', label: 'Opportunity', align: 'text-left' },
                        ].map((col) => (
                          <th
                            key={col.key}
                            className={`${col.align} px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium cursor-pointer hover:text-white transition-colors`}
                            onClick={() => toggleKwSort(col.key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              {kwSort.key === col.key && (
                                <ArrowUpDown className="h-3 w-3 text-[#EF5744]" />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOpportunities().map((kw, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                            i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'
                          }`}
                        >
                          <td className="px-4 py-2.5 text-white">{kw.keyword}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{kw.volume?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-[#a1a1aa]">{kw.competition}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa] font-mono">{kw.ci}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa] font-mono">${kw.cpc?.toFixed(2)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${opportunityBadge(kw.opportunity)}`}>
                              {kw.opportunity}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!data.keyword_opportunities || data.keyword_opportunities.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-[#8b8b93]">
                            No keyword opportunities found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ---- SECTION 6: Competitive Landscape ---- */}
            <section
              ref={(el) => { sectionRefs.current['competitive'] = el; }}
              id="competitive"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#EF5744]" />
                Competitive Landscape
              </h2>

              {/* Ad Status */}
              {data.ad_status && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Megaphone className="h-4 w-4 text-[#EF5744]" />
                    <p className="text-white font-semibold text-sm">Ad Status</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${data.ad_status.target_running ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[#a1a1aa] text-sm">
                        Target {data.ad_status.target_running ? 'is running ads' : 'is not running ads'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${data.ad_status.competitors_running ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[#a1a1aa] text-sm">
                        Competitors {data.ad_status.competitors_running ? 'are running ads' : 'are not running ads'}
                      </span>
                    </div>
                  </div>
                  {data.ad_status.details && (
                    <p className="text-[#8b8b93] text-xs mt-3">{data.ad_status.details}</p>
                  )}
                </div>
              )}

              {/* Local Pack */}
              {data.local_pack && data.local_pack.length > 0 && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden mb-4">
                  <div className="px-4 py-3 border-b border-[#2a2a2a]">
                    <p className="text-white font-semibold text-sm">Local Pack Leaders</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Pos</th>
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Practice</th>
                        <th className="text-right px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Rating</th>
                        <th className="text-right px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Reviews</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.local_pack.map((item, i) => (
                        <tr key={i} className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                          <td className="px-4 py-2.5 text-[#a1a1aa] font-mono">{item.position}</td>
                          <td className="px-4 py-2.5 text-white">{item.name}</td>
                          <td className="px-4 py-2.5 text-right text-yellow-400 font-mono">{item.rating}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{item.reviews?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Organic Top 5 */}
              {data.organic_top5 && data.organic_top5.length > 0 && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden mb-4">
                  <div className="px-4 py-3 border-b border-[#2a2a2a]">
                    <p className="text-white font-semibold text-sm">Organic Top 5</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Pos</th>
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Domain</th>
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden md:table-cell">Keyword</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.organic_top5.map((item, i) => (
                        <tr key={i} className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                          <td className="px-4 py-2.5 text-[#a1a1aa] font-mono">{item.position}</td>
                          <td className="px-4 py-2.5 text-white">{item.domain}</td>
                          <td className="px-4 py-2.5 text-[#8b8b93] hidden md:table-cell">{item.keyword}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Keyword Gap */}
              {data.keyword_gap && data.keyword_gap.length > 0 && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2a2a2a]">
                    <p className="text-white font-semibold text-sm">Keyword Gap</p>
                    <p className="text-[#8b8b93] text-xs mt-0.5">Keywords competitors rank for that you don&apos;t</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Keyword</th>
                        <th className="text-left px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Competitor</th>
                        <th className="text-right px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Position</th>
                        <th className="text-right px-4 py-2.5 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.keyword_gap.map((item, i) => (
                        <tr key={i} className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                          <td className="px-4 py-2.5 text-white">{item.keyword}</td>
                          <td className="px-4 py-2.5 text-[#a1a1aa]">{item.competitor}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#a1a1aa]">{item.competitor_position}</td>
                          <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{item.volume?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ---- SECTION 7: Recommendations ---- */}
            <section
              ref={(el) => { sectionRefs.current['recommendations'] = el; }}
              id="recommendations"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#EF5744]" />
                Recommendations
              </h2>

              {['P0', 'P1', 'P2', 'P3'].map((priority) => {
                const recs = groupedRecs[priority];
                if (!recs || recs.length === 0) return null;
                return (
                  <div key={priority} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${priorityBadge(priority)}`}>
                        {priority}
                      </span>
                      <span className="text-[#8b8b93] text-xs">
                        {priority === 'P0' ? 'Critical' : priority === 'P1' ? 'High' : priority === 'P2' ? 'Medium' : 'Low'} Priority
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recs.map((rec, i) => (
                        <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                          <div className="flex items-start gap-3">
                            {priority === 'P0' ? (
                              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                            ) : priority === 'P1' ? (
                              <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-white text-sm font-semibold">{rec.title}</p>
                                <span className="text-[#8b8b93] text-[10px] uppercase tracking-wider">{rec.category}</span>
                              </div>
                              <p className="text-[#a1a1aa] text-sm">{rec.description}</p>
                              {rec.impact && (
                                <p className="text-[#8b8b93] text-xs mt-2">
                                  Expected impact: {rec.impact}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {(!data.recommendations || data.recommendations.length === 0) && (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded p-8 text-center">
                  <p className="text-[#8b8b93]">No recommendations available.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
