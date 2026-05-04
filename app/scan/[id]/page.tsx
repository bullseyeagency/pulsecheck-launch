'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Download, Share2, RefreshCw, Loader2, FileText,
  AlertTriangle, AlertCircle, Info, ChevronUp, ChevronDown,
  Gauge, KeyRound, Globe, Users, Megaphone, Lightbulb, BarChart3,
  ArrowUpDown, Search, MapPin, TrendingUp, Zap,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
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
  keyword_opportunities: { keyword: string; volume: number; competition: string; ci: number; cpc: number; opportunity: string }[];
  ad_status: { target_running: boolean; competitors_running: boolean; details: string };
  local_pack: { position: number; name: string; rating: number; reviews: number }[];
  organic_top5: { position: number; domain: string; url: string; keyword: string }[];
  keyword_gap: { keyword: string; competitor: string; competitor_position: number; volume: number }[];
  recommendations: { priority: string; category: string; title: string; description: string; impact: string }[];
  // Business-facing enriched fields
  competitors_summary: { name: string; domain: string; position: number; rating: number; reviews: number }[];
  gbp: { found: boolean; rating: number | null; reviews: number | null } | null;
  meta_ads_running: boolean;
  tiktok_ads_running: boolean;
  category_grades: {
    speed: { grade: string; score: number | null; label: string };
    seo: { grade: string; score: number; label: string };
    local: { grade: string; label: string };
    ads: { grade: string; label: string };
    meta: { grade: string; label: string };
    tiktok: { grade: string; label: string };
  };
  top_issues: { severity: string; title: string; business_impact: string; category: string }[];
  geo: {
    score: number; grade: string; label: string;
    signals: {
      blockedBots: string[]; hasLlmsTxt: boolean; hasCanonical: boolean;
      hasDateModified: boolean; httpsOnly: boolean; hasArticleSchema: boolean;
      hasFaqSchema: boolean; hasAuthorSchema: boolean; hasOrganizationSchema: boolean;
    };
  } | null;
  eeat: {
    score: number; grade: string; label: string;
    dimensions: {
      experience: { score: number; signals: string[]; missing: string[] };
      expertise: { score: number; signals: string[]; missing: string[] };
      authoritativeness: { score: number; signals: string[]; missing: string[] };
      trustworthiness: { score: number; signals: string[]; missing: string[] };
    };
  } | null;
  ai_mode: { queries: { query: string; clientCited: boolean; citedDomains: string[]; snippet: string }[] } | null;
  competitor_ads: Record<string, {
    domain: string;
    googleAds: { running: boolean; creative_count: number };
    metaAds: { running: boolean; ad_count: number };
  }> | null;
}

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
function gradeBg(grade: string) {
  if (grade === 'A' || grade === 'A+') return 'bg-emerald-500/10 border-emerald-500/30';
  if (grade === 'B' || grade === 'B+') return 'bg-blue-500/10 border-blue-500/30';
  if (grade === 'C' || grade === 'C+') return 'bg-yellow-500/10 border-yellow-500/30';
  if (grade === 'D') return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
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
function severityBadge(s: string) {
  const m: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return m[s] || m.low;
}
function severityDot(s: string) {
  const m: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };
  return m[s] || 'bg-[#555]';
}
function opportunityBadge(l: string) {
  const m: Record<string, string> = {
    HIGHEST: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    HIGH: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-[#2a2a2a] text-[#8b8b93] border-[#2a2a2a]',
  };
  return m[l] || m.LOW;
}
function priorityBadge(p: string) {
  const m: Record<string, string> = {
    P0: 'bg-red-500/15 text-red-400 border-red-500/30',
    P1: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    P2: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    P3: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return m[p] || m.P3;
}

function plainEnglishIssue(raw: string): string {
  if (raw.toLowerCase().includes('mobile pagespeed') || raw.toLowerCase().includes('mobile speed'))
    return 'Your website loads slowly on phones';
  if (raw.toLowerCase().includes('desktop pagespeed') || raw.toLowerCase().includes('desktop speed'))
    return 'Your website is slow on desktop';
  if (raw.toLowerCase().includes('meta description'))
    return "Google can't tell what your page is about";
  if (raw.toLowerCase().includes('backlink'))
    return "Low authority — Google doesn't trust your site yet";
  if (raw.toLowerCase().includes('title tag') || (raw.toLowerCase().includes('title') && !raw.toLowerCase().includes('meta')))
    return "Your page titles aren't optimized for search";
  return raw;
}

function computeSpeedGrade(mobile: number | null, desktop: number | null): { grade: string; score: number | null; label: string } {
  if (mobile === null && desktop === null) return { grade: 'N/A', score: null, label: 'Could not measure' };
  const scores = [mobile, desktop].filter((s): s is number => s !== null);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  let grade = 'F';
  if (avg >= 90) grade = 'A';
  else if (avg >= 75) grade = 'B';
  else if (avg >= 60) grade = 'C';
  else if (avg >= 45) grade = 'D';
  const mLabel = mobile !== null ? `${mobile} mobile` : null;
  const dLabel = desktop !== null ? `${desktop} desktop` : null;
  const label = [mLabel, dLabel].filter(Boolean).join(' · ') || 'Could not measure';
  return { grade, score: avg, label };
}

function computeSeoGrade(count: number): { grade: string; score: number; label: string } {
  let grade = 'F';
  if (count >= 500) grade = 'A';
  else if (count >= 200) grade = 'B';
  else if (count >= 100) grade = 'C';
  else if (count >= 50) grade = 'D';
  return { grade, score: count, label: `${count.toLocaleString()} keywords ranking` };
}

function computeLocalGrade(gbp: AuditData['gbp']): { grade: string; label: string } {
  if (!gbp || !gbp.found) return { grade: 'D', label: 'Not found on Google Maps' };
  if (gbp.rating !== null && gbp.rating >= 4.5) return { grade: 'A', label: `${gbp.rating} stars · ${(gbp.reviews || 0).toLocaleString()} reviews` };
  if (gbp.rating !== null && gbp.rating >= 4.0) return { grade: 'B', label: `${gbp.rating} stars · ${(gbp.reviews || 0).toLocaleString()} reviews` };
  return { grade: 'C', label: gbp.rating !== null ? `${gbp.rating} stars · ${(gbp.reviews || 0).toLocaleString()} reviews` : 'Listed on Google Maps' };
}

/* -------------------------------------------------------------------------- */
/*  Transform                                                                  */
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractPsiScore = (data: any): number | null => {
    if (!data) return null;
    const d = data.lighthouseResult ?? data;
    const score = d?.categories?.performance?.score;
    return typeof score === 'number' ? Math.round(score * 100) : null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractOpportunities = (data: any): { title: string; description: string }[] => {
    const d = data?.lighthouseResult ?? data;
    if (!d?.audits) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(d.audits as Record<string, any>)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((a: any) => a.details?.type === 'opportunity' && typeof a.score === 'number' && a.score < 0.9)
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => ({ title: a.title || '', description: a.description || '' }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rankItems: any[] = rankingsData.items || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rankedKeywords = rankItems.slice(0, 100).map((item: any) => {
    const kd = item.keyword_data || {};
    const se = item.ranked_serp_element?.serp_item || {};
    return { keyword: kd.keyword || '', position: se.rank_absolute || se.position || 0, url: se.url || '', volume: kd.keyword_info?.search_volume || 0, traffic_est: Math.round(se.etv || 0) };
  });

  const positionDistribution: Record<string, number> = { '1-3': 0, '4-10': 0, '11-20': 0, '21-50': 0, '51-100': 0 };
  for (const kw of rankedKeywords) {
    if (kw.position <= 3) positionDistribution['1-3']++;
    else if (kw.position <= 10) positionDistribution['4-10']++;
    else if (kw.position <= 20) positionDistribution['11-20']++;
    else if (kw.position <= 50) positionDistribution['21-50']++;
    else if (kw.position <= 100) positionDistribution['51-100']++;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kwItems: any[] = Array.isArray(keywordData.items) ? keywordData.items : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keywordOpportunities = kwItems.slice(0, 50).map((item: any) => {
    const vol = item.search_volume || 0;
    const ci = item.competition_index || 0;
    let opportunity = 'LOW';
    if (vol > 1000 && ci < 30) opportunity = 'HIGHEST';
    else if (vol > 500 && ci < 50) opportunity = 'HIGH';
    else if (vol > 100 && ci < 70) opportunity = 'MEDIUM';
    return { keyword: item.keyword || '', volume: vol, competition: item.competition || 'UNKNOWN', ci, cpc: item.cpc || 0, opportunity };
  });

  // Local pack: new shape comes from gbpData.localPack (Record<query, LocalPackEntry[]>)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gbpLocalPack: any[] = (() => {
    const lp = raw.gbpData?.localPack;
    if (!lp || typeof lp !== 'object') return [];
    const firstKey = Object.keys(lp)[0];
    return firstKey ? (lp[firstKey] || []) : [];
  })();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localPack = gbpLocalPack.slice(0, 5).map((item: any, i: number) => ({
    position: item.position || i + 1, name: item.title || item.name || '', rating: item.rating || 0,
    reviews: typeof item.reviews === 'number' ? item.reviews : parseInt(String(item.reviews || '').replace(/\D/g, '')) || 0,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organicResults: any[] = serpData.organic?.organic_results || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organic_top5 = organicResults.slice(0, 5).map((item: any, i: number) => {
    let domain = item.domain || '';
    if (!domain && item.link) { try { domain = new URL(item.link).hostname.replace(/^www\./, ''); } catch { domain = ''; } }
    return { position: item.position || i + 1, domain, url: item.link || '', keyword: `${raw.industry} ${raw.location}` };
  });

  // Ad status: new shape is { running, creative_count, advertiser_id, ... }
  const adStatus = {
    target_running: adsData.running === true,
    competitors_running: false,
    details: adsData.running ? `${adsData.creative_count || 0} active ad creatives found` : 'No active ads detected',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitors: any[] = competitorData.competitors || [];
  const keywordGap: AuditData['keyword_gap'] = [];
  for (const comp of competitors.slice(0, 3)) {
    for (const item of (comp.rankings?.items || [])) {
      const kd = item.keyword_data || {};
      const se = item.ranked_serp_element?.serp_item || {};
      const vol = kd.keyword_info?.search_volume || 0;
      if (vol === 0) continue;
      keywordGap.push({ keyword: kd.keyword || '', competitor: comp.domain || '', competitor_position: se.rank_absolute || se.position || 0, volume: vol });
      if (keywordGap.filter(k => k.competitor === comp.domain).length >= 10) break;
    }
  }

  const issueTotal = (totalIssues.critical || 0) + (totalIssues.high || 0) + (totalIssues.medium || 0) + (totalIssues.low || 0);

  // --- Business-facing enriched fields ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitorAdsData: Record<string, any> = raw.competitorAdsData || {};
  // Build competitive snapshot from local pack (real business names, pack positions, ratings)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitors_summary = gbpLocalPack.slice(0, 5).map((item: any, i: number) => ({
    name: item.title || item.name || `Competitor ${i + 1}`,
    domain: '',
    position: item.position || i + 1,
    rating: item.rating || 0,
    reviews: typeof item.reviews === 'number' ? item.reviews : parseInt(String(item.reviews || '').replace(/\D/g, '')) || 0,
  }));

  // GBP: new shape is { gbp: { found, rating, reviews, ... }, localPack: {...}, clientPackPosition: ... }
  const gbpRaw = raw.gbpData?.gbp || (raw.gbpData?.found !== undefined ? raw.gbpData : null);
  const gbp: AuditData['gbp'] = gbpRaw
    ? { found: !!gbpRaw.found, rating: gbpRaw.rating || null, reviews: gbpRaw.reviews || null }
    : null;

  const meta_ads_running: boolean = raw.metaAdsData?.running === true;
  const tiktok_ads_running: boolean = raw.tiktokAdsData?.running === true;

  const mobileScore = extractPsiScore(mobile) ?? scores.pagespeedMobile ?? null;
  const desktopScore = extractPsiScore(desktop) ?? scores.pagespeedDesktop ?? null;
  const rankedCount = report.totalKeywords || rankedKeywords.length;

  const speedGrade = computeSpeedGrade(mobileScore, desktopScore);
  const seoGrade = computeSeoGrade(rankedCount);
  const localGrade = computeLocalGrade(gbp);
  const adsGrade = adStatus.target_running
    ? { grade: 'A', label: 'Running Google Ads' }
    : { grade: 'F', label: 'Not running ads — competitors may be' };
  const metaGrade = meta_ads_running
    ? { grade: 'A', label: 'Running Meta ads' }
    : { grade: 'F', label: 'Not found on Meta' };
  const tiktokGrade = tiktok_ads_running
    ? { grade: 'A', label: `${raw.tiktokAdsData?.ad_count || 0} active TikTok ads` }
    : { grade: 'F', label: 'Not advertising on TikTok' };

  const category_grades = {
    speed: speedGrade,
    seo: seoGrade,
    local: localGrade,
    ads: adsGrade,
    meta: metaGrade,
    tiktok: tiktokGrade,
  };

  const impactMap: Record<string, string> = {
    critical: 'This is costing you customers right now',
    high: 'This is limiting your growth',
    medium: 'This could be improved',
  };

  const top_issues = (report.issues || [])
    .filter((issue: { severity: string }) => issue.severity === 'critical' || issue.severity === 'high')
    .slice(0, 5)
    .map((issue: { severity: string; title: string; category: string }) => ({
      severity: issue.severity,
      title: plainEnglishIssue(issue.title ?? ''),
      business_impact: impactMap[issue.severity] || 'This could be improved',
      category: issue.category,
    }));

  return {
    id: raw.id, url: raw.url, domain: raw.domain, industry: raw.industry, location: raw.location,
    status: raw.status, created_at: raw.createdAt,
    overall_grade: report.overallGrade || 'N/A',
    pagespeed_mobile: mobileScore,
    pagespeed_desktop: desktopScore,
    pagespeed_mobile_vitals: extractVitals(mobile),
    pagespeed_desktop_vitals: extractVitals(desktop),
    pagespeed_mobile_opportunities: extractOpportunities(mobile),
    pagespeed_desktop_opportunities: extractOpportunities(desktop),
    ranked_keywords_count: rankedCount,
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
    competitors_summary,
    gbp,
    meta_ads_running,
    tiktok_ads_running,
    category_grades,
    top_issues,
    geo: raw.geoData && !(raw.geoData as any).error ? raw.geoData as AuditData['geo'] : null,
    eeat: raw.eeatData && !(raw.eeatData as any).error ? raw.eeatData as AuditData['eeat'] : null,
    ai_mode: raw.aiModeData && !(raw.aiModeData as any).error ? raw.aiModeData as AuditData['ai_mode'] : null,
    competitor_ads: Object.keys(competitorAdsData).length > 0 ? competitorAdsData as AuditData['competitor_ads'] : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function ScanReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issueSort, setIssueSort] = useState<'severity' | 'category'>('severity');
  const [kwSort, setKwSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'volume', dir: 'desc' });
  const [copied, setCopied] = useState(false);
  const [techExpanded, setTechExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/audit/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load audit');
        setData(transformAudit(json.audit));
        fetch(`/api/audit/${id}/viewed`, { method: 'POST' }).catch(() => {});
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load audit');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedIssues = useCallback(() => {
    if (!data?.issues) return [];
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...data.issues].sort((a, b) =>
      issueSort === 'severity' ? (order[a.severity] ?? 4) - (order[b.severity] ?? 4) : a.category.localeCompare(b.category)
    );
  }, [data?.issues, issueSort]);

  const sortedOpportunities = useCallback(() => {
    if (!data?.keyword_opportunities) return [];
    return [...data.keyword_opportunities].sort((a, b) => {
      const key = kwSort.key as keyof typeof a;
      const aVal = a[key], bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') return kwSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
      return kwSort.dir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [data?.keyword_opportunities, kwSort]);

  const toggleKwSort = (key: string) =>
    setKwSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });

  const PublicHeader = () => (
    <header className="border-b border-[#1a1a1a] px-6 py-4 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#EF5744] rounded flex items-center justify-center">
            <Search className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">PulseCheck</span>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/api/audit/${id}/export/html`, '_blank')}
              className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export HTML
            </button>
            <button
              onClick={() => window.open(`/api/audit/${id}/export/pdf`, '_blank')}
              className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button
              onClick={handleShare}
              className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" /> {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              onClick={() => router.push(`/scan?url=${encodeURIComponent(data.url)}`)}
              className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] border border-[#2a2a2a] rounded hover:text-white hover:border-[#EF5744] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-run
            </button>
          </div>
        )}
      </div>
    </header>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PublicHeader />
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 text-[#EF5744] animate-spin" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PublicHeader />
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-6">
          <p className="text-red-400">{error || 'Audit not found'}</p>
        </div>
      </div>
    </div>
  );

  const groupedRecs = (data.recommendations || []).reduce<Record<string, typeof data.recommendations>>(
    (acc, rec) => { if (!acc[rec.priority]) acc[rec.priority] = []; acc[rec.priority].push(rec); return acc; }, {}
  );

  const criticalCount = (data.issues || []).filter(i => i.severity === 'critical').length;
  const highPriorityOpps = sortedOpportunities()
    .filter(k => k.opportunity === 'HIGHEST' || k.opportunity === 'HIGH')
    .slice(0, 5);

  // Plain-English conclusions
  const conclusions = (() => {
    const points: { icon: string; heading: string; body: string }[] = [];
    const g = data.overall_grade;

    // Overall verdict
    if (g === 'A' || g === 'A+') {
      points.push({ icon: '✓', heading: 'Strong overall presence', body: `${data.domain} is well-optimized and visible online. There are still opportunities to pull further ahead of competitors.` });
    } else if (g === 'B' || g === 'B+') {
      points.push({ icon: '↑', heading: 'Good foundation, room to grow', body: `${data.domain} is doing better than average, but competitors are likely outranking you on several important searches.` });
    } else if (g === 'C' || g === 'C+') {
      points.push({ icon: '!', heading: 'Visible gaps that are costing you customers', body: `${data.domain} has the basics covered but is losing leads to businesses that have invested more in their online presence.` });
    } else {
      points.push({ icon: '✗', heading: 'Customers searching for you can\'t find you', body: `${data.domain} is largely invisible online. Most people searching for ${data.industry} in ${data.location || 'your area'} will land on a competitor's site instead.` });
    }

    // Speed
    const sp = data.category_grades.speed;
    if (sp.grade === 'D' || sp.grade === 'F') {
      points.push({ icon: '⚡', heading: 'Your website loads too slowly', body: `A slow site drives people away before they ever see your services — especially on mobile. Google also ranks faster sites higher.` });
    }

    // Local / GBP
    const lc = data.category_grades.local;
    if (lc.grade === 'D' || lc.grade === 'F') {
      points.push({ icon: '📍', heading: 'Hard to find on Google Maps', body: `When someone nearby searches for ${data.industry}, your business may not appear in the map results — sending that customer to a competitor.` });
    } else if (lc.grade === 'C') {
      points.push({ icon: '📍', heading: 'Google Maps presence needs work', body: `You\'re listed on Google Maps but your rating or review count is lower than competitors, which reduces how often you get clicked.` });
    }

    // Keyword opportunity
    const topOpp = highPriorityOpps[0];
    if (topOpp) {
      points.push({ icon: '🔍', heading: `${topOpp.volume.toLocaleString()} people search "${topOpp.keyword}" every month`, body: `That's potential customers you're not reaching. Ranking for this term alone could meaningfully increase your website traffic.` });
    }

    // Competitor gap
    const topGap = data.keyword_gap?.[0];
    if (topGap) {
      points.push({ icon: '⚔', heading: `${topGap.competitor} is ranking #${topGap.competitor_position} for "${topGap.keyword}"`, body: `That's a search with ${topGap.volume.toLocaleString()} monthly searches where a competitor is taking customers that could be yours.` });
    }

    // Ads
    if (data.category_grades.ads.grade === 'F' && data.competitors_summary.length > 0) {
      points.push({ icon: '📢', heading: 'Competitors may be running ads against your name', body: `If you\'re not running Google Ads, competitors could be showing up at the top of search results when someone looks for your business.` });
    }

    return points;
  })();

  const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PublicHeader />

      {/* Share toast */}
      {copied && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-4 py-2 text-sm text-white shadow-lg">
          Share link copied!
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ------------------------------------------------------------------ */}
        {/* Section 1: Hero                                                     */}
        {/* ------------------------------------------------------------------ */}
        <motion.section {...fadeUp}>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Grade */}
              <div className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 flex items-center justify-center ${gradeBg(data.overall_grade)}`}>
                <span className={`text-5xl font-black ${gradeColor(data.overall_grade)}`}>{data.overall_grade}</span>
              </div>

              {/* Domain info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{data.domain}</h1>
                <p className="text-[#8b8b93] text-sm mt-1">
                  {data.industry}{data.location ? ` · ${data.location}` : ''}
                  {data.created_at ? ` · Audited ${new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
                </p>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-sm text-white">
                    <Globe className="h-3.5 w-3.5 text-[#EF5744]" />
                    {data.ranked_keywords_count.toLocaleString()} keywords ranking
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-sm text-white">
                    <TrendingUp className="h-3.5 w-3.5 text-[#EF5744]" />
                    ~{data.est_monthly_traffic.toLocaleString()} monthly visitors
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${data.total_issues > 5 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#1e1e1e] border-[#2a2a2a] text-white'}`}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {data.total_issues} issues found
                  </span>
                </div>
              </div>
            </div>

            {/* Critical banner */}
            {criticalCount > 0 && (
              <div className="mt-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium">
                  {criticalCount} critical {criticalCount === 1 ? 'issue' : 'issues'} found that {criticalCount === 1 ? 'is' : 'are'} actively hurting your business.
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 1b: Plain-English Conclusions                              */}
        {/* ------------------------------------------------------------------ */}
        {conclusions.length > 0 && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.04 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">What This Means For Your Business</h2>
              <p className="text-[#8b8b93] text-sm mt-1">The bottom line — no technical jargon.</p>
            </div>
            <div className="space-y-3">
              {conclusions.map((c, i) => (
                <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-start gap-4">
                  <span className="text-lg flex-shrink-0 mt-0.5 w-6 text-center">{c.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{c.heading}</p>
                    <p className="text-[#a1a1aa] text-sm mt-1 leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 2: Digital Pulse — 5 category scorecards                   */}
        {/* ------------------------------------------------------------------ */}
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Your Digital Presence at a Glance</h2>
            <p className="text-[#8b8b93] text-sm mt-1">Five areas that determine whether customers find you — or your competitor.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                icon: <Gauge className="h-4 w-4" />,
                label: 'Website Speed',
                grade: data.category_grades.speed.grade,
                sublabel: data.category_grades.speed.label,
              },
              {
                icon: <Search className="h-4 w-4" />,
                label: 'Search Visibility',
                grade: data.category_grades.seo.grade,
                sublabel: data.category_grades.seo.label,
              },
              {
                icon: <MapPin className="h-4 w-4" />,
                label: 'Google Maps',
                grade: data.category_grades.local.grade,
                sublabel: data.category_grades.local.label,
              },
              {
                icon: <Megaphone className="h-4 w-4" />,
                label: 'Google Ads',
                grade: data.category_grades.ads.grade,
                sublabel: data.category_grades.ads.label,
              },
              {
                icon: <Zap className="h-4 w-4" />,
                label: 'Meta Ads',
                grade: data.category_grades.meta.grade,
                sublabel: data.category_grades.meta.label,
              },
              {
                icon: <Users className="h-4 w-4" />,
                label: 'TikTok Ads',
                grade: data.category_grades.tiktok.grade,
                sublabel: data.category_grades.tiktok.label,
              },
            ].map((card) => (
              <div key={card.label} className={`bg-[#141414] border rounded-xl p-4 flex flex-col items-center text-center ${gradeBg(card.grade)}`}>
                <div className={`mb-1 ${gradeColor(card.grade)}`}>{card.icon}</div>
                <p className="text-[#8b8b93] text-[10px] uppercase tracking-wider font-medium mb-2">{card.label}</p>
                <span className={`text-4xl font-black ${gradeColor(card.grade)}`}>{card.grade}</span>
                <p className="text-[#8b8b93] text-[11px] mt-2 leading-tight">{card.sublabel}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 3: What's Hurting Your Business                            */}
        {/* ------------------------------------------------------------------ */}
        {data.top_issues && data.top_issues.length > 0 && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">What We Found</h2>
              <p className="text-[#8b8b93] text-sm mt-1">Issues affecting your online visibility, ranked by impact.</p>
            </div>

            <div className="space-y-3">
              {data.top_issues.map((issue, i) => (
                <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${severityDot(issue.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{issue.title}</p>
                    <p className="text-[#8b8b93] text-sm mt-1">{issue.business_impact}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded text-[10px] text-[#8b8b93] uppercase tracking-wider">
                      {issue.category}
                    </span>
                  </div>
                  <span className={`flex-shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${severityBadge(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 4: Competitive Snapshot                                    */}
        {/* ------------------------------------------------------------------ */}
        {data.competitors_summary && data.competitors_summary.length > 0 && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Competitive Snapshot</h2>
              <p className="text-[#8b8b93] text-sm mt-1">
                How you rank against businesses showing up when people search {data.industry}{data.location ? ` in ${data.location}` : ''}.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Business</th>
                      <th className="text-center px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Pack Rank</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Rating</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Your row */}
                    <tr className="border-b border-[#2a2a2a] border-l-2 border-l-[#EF5744] bg-[#EF5744]/5">
                      <td className="px-5 py-3 text-white font-semibold">You ({data.domain})</td>
                      <td className="px-5 py-3 text-center">
                        {data.gbp?.found ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-[#2a2a2a] text-[#8b8b93] border-[#2a2a2a]">Not in pack</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-red-500/15 text-red-400 border-red-500/30">No listing</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-white font-semibold">{data.gbp?.rating ? `⭐ ${data.gbp.rating}` : '—'}</td>
                      <td className="px-5 py-3 text-right text-white font-semibold">{data.gbp?.reviews ? data.gbp.reviews.toLocaleString() : '—'}</td>
                    </tr>
                    {/* Competitor rows */}
                    {data.competitors_summary.slice(0, 5).map((comp, i) => (
                      <tr key={i} className={`border-b border-[#1f1f1f] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                        <td className="px-5 py-3 text-[#a1a1aa]">{comp.name}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${comp.position <= 3 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-[#2a2a2a] text-[#8b8b93] border-[#2a2a2a]'}`}>
                            #{comp.position}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{comp.rating ? `⭐ ${comp.rating}` : '—'}</td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{comp.reviews ? comp.reviews.toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 4b: Competitor Ad Intelligence                             */}
        {/* ------------------------------------------------------------------ */}
        {data.competitor_ads && Object.keys(data.competitor_ads).length > 0 && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.16 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Competitor Ad Intelligence</h2>
              <p className="text-[#8b8b93] text-sm mt-1">
                Where your top competitors are spending ad budget across Google and Meta.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Competitor</th>
                      <th className="text-center px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Google Ads</th>
                      <th className="text-center px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Meta Ads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(data.competitor_ads).map((comp, i) => (
                      <tr key={comp.domain} className={`border-b border-[#1f1f1f] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                        <td className="px-5 py-3 text-[#a1a1aa] font-medium">{comp.domain}</td>
                        <td className="px-4 py-3 text-center">
                          {comp.googleAds.running ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              {comp.googleAds.creative_count} ads
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-[#2a2a2a] text-[#555] border-[#2a2a2a]">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comp.metaAds.running ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              {comp.metaAds.ad_count} ads
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-[#2a2a2a] text-[#555] border-[#2a2a2a]">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 4c: Keyword Gap                                           */}
        {/* ------------------------------------------------------------------ */}
        {data.keyword_gap && data.keyword_gap.length > 0 && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.18 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Competitor Keyword Opportunities</h2>
              <p className="text-[#8b8b93] text-sm mt-1">
                Keywords your competitors rank for that you&apos;re missing out on.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Keyword</th>
                      <th className="text-left px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium hidden md:table-cell">Competitor</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Their Rank</th>
                      <th className="text-right px-5 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Monthly Searches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keyword_gap.slice(0, 15).map((kw, i) => (
                      <tr key={i} className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                        <td className="px-5 py-3 text-white font-medium">{kw.keyword}</td>
                        <td className="px-5 py-3 text-[#a1a1aa] hidden md:table-cell">{kw.competitor}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-mono font-bold ${kw.competitor_position <= 3 ? 'text-emerald-400' : kw.competitor_position <= 10 ? 'text-blue-400' : 'text-[#a1a1aa]'}`}>
                            #{kw.competitor_position}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-[#a1a1aa]">{kw.volume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 5: Keyword Opportunities                                   */}
        {/* ------------------------------------------------------------------ */}
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Keywords Worth Targeting</h2>
            <p className="text-[#8b8b93] text-sm mt-1">
              High-volume searches related to your business that you&apos;re not currently ranking for.
            </p>
          </div>

          {highPriorityOpps.length > 0 ? (
            <div className="space-y-3">
              {highPriorityOpps.map((kw, i) => (
                <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <KeyRound className="h-4 w-4 text-[#EF5744] flex-shrink-0" />
                    <span className="text-white font-medium truncate">{kw.keyword}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-xs text-[#a1a1aa]">
                      <BarChart3 className="h-3 w-3 text-[#EF5744]" />
                      {kw.volume.toLocaleString()} searches/mo
                    </span>
                    {kw.cpc > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-xs text-[#a1a1aa]">
                        ${kw.cpc.toFixed(2)}/click
                      </span>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${opportunityBadge(kw.opportunity)}`}>
                      {kw.opportunity === 'HIGHEST' ? 'Top Pick' : 'High'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
              <p className="text-[#8b8b93] text-sm">Run a new audit to see keyword opportunities.</p>
            </div>
          )}
        </motion.section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 5b: E-E-A-T                                               */}
        {/* ------------------------------------------------------------------ */}
        {data.eeat && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.22 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Trust & Authority (E-E-A-T)</h2>
              <p className="text-[#8b8b93] text-sm mt-1">
                How Google evaluates your site's Experience, Expertise, Authoritativeness, and Trustworthiness.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${gradeBg(data.eeat.grade)}`}>
                  <span className={`text-3xl font-black ${gradeColor(data.eeat.grade)}`}>{data.eeat.grade}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{data.eeat.label}</p>
                  <p className="text-[#8b8b93] text-sm mt-0.5">Score: {data.eeat.score}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['experience', 'expertise', 'authoritativeness', 'trustworthiness'] as const).map((dim) => {
                  const d = data.eeat!.dimensions[dim];
                  const label = { experience: 'Experience', expertise: 'Expertise', authoritativeness: 'Authority', trustworthiness: 'Trust' }[dim];
                  return (
                    <div key={dim} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                      <p className="text-[#8b8b93] text-[10px] uppercase tracking-wider mb-1">{label}</p>
                      <p className={`text-2xl font-black ${d.score >= 80 ? 'text-emerald-400' : d.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{d.score}<span className="text-xs font-normal text-[#555]">/100</span></p>
                      {d.missing.length > 0 && (
                        <p className="text-[#8b8b93] text-[10px] mt-1 leading-tight">{d.missing[0]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 5c: GEO — AI Search Visibility                             */}
        {/* ------------------------------------------------------------------ */}
        {data.geo && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.23 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">AI Search Visibility (GEO)</h2>
              <p className="text-[#8b8b93] text-sm mt-1">
                How likely your business is to appear in ChatGPT, Perplexity, and Google AI Overviews.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${gradeBg(data.geo.grade)}`}>
                  <span className={`text-3xl font-black ${gradeColor(data.geo.grade)}`}>{data.geo.grade}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{data.geo.label}</p>
                  <p className="text-[#8b8b93] text-sm mt-0.5">Score: {data.geo.score}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'AI Crawlable', pass: data.geo.signals.blockedBots.length === 0, detail: data.geo.signals.blockedBots.length > 0 ? `${data.geo.signals.blockedBots.length} bots blocked` : 'All AI bots allowed' },
                  { label: 'Content Schema', pass: data.geo.signals.hasArticleSchema || data.geo.signals.hasFaqSchema, detail: data.geo.signals.hasArticleSchema ? 'Article schema' : data.geo.signals.hasFaqSchema ? 'FAQ schema' : 'No content schema' },
                  { label: 'Author Markup', pass: data.geo.signals.hasAuthorSchema, detail: data.geo.signals.hasAuthorSchema ? 'Author found' : 'No author markup' },
                  { label: 'llms.txt', pass: data.geo.signals.hasLlmsTxt, detail: data.geo.signals.hasLlmsTxt ? 'File present' : 'Not found' },
                ].map((item) => (
                  <div key={item.label} className={`bg-[#1a1a1a] border rounded-lg p-3 ${item.pass ? 'border-emerald-500/20' : 'border-[#2a2a2a]'}`}>
                    <p className="text-[#8b8b93] text-[10px] uppercase tracking-wider mb-1">{item.label}</p>
                    <div className={`flex items-center gap-1.5 ${item.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className="text-sm font-bold">{item.pass ? '✓' : '✗'}</span>
                      <span className="text-xs">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
              {data.geo.signals.blockedBots.length > 0 && (
                <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">Blocked: {data.geo.signals.blockedBots.join(', ')} — these power ChatGPT, Claude, and Perplexity. Unblock them to appear in AI answers.</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 5d: AI Mode Citation                                       */}
        {/* ------------------------------------------------------------------ */}
        {data.ai_mode && data.ai_mode.queries.length > 0 && (
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.24 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Google AI Overview Citations</h2>
              <p className="text-[#8b8b93] text-sm mt-1">
                Whether your business appears in Google's AI-generated answers for key searches.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {data.ai_mode.queries.map((q, i) => (
                <div key={i} className={`px-5 py-4 ${i < data.ai_mode!.queries.length - 1 ? 'border-b border-[#1f1f1f]' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">&ldquo;{q.query}&rdquo;</p>
                      {q.snippet && (
                        <p className="text-[#8b8b93] text-xs mt-1.5 leading-relaxed line-clamp-2">{q.snippet}</p>
                      )}
                      {q.citedDomains.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {q.citedDomains.slice(0, 5).map((d, j) => (
                            <span key={j} className={`inline-block px-2 py-0.5 rounded text-[10px] border ${d === data.domain.replace(/^www\./, '') ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold' : 'bg-[#1e1e1e] text-[#8b8b93] border-[#2a2a2a]'}`}>
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${q.clientCited ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {q.clientCited ? '✓ Cited' : '✗ Not cited'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {data.ai_mode.queries.every(q => !q.clientCited) && (
              <div className="mt-3 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
                <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-sm">Your site isn't appearing in Google AI answers for these searches. Improving E-E-A-T signals, structured data, and content depth can increase your chances of being cited.</p>
              </div>
            )}
          </motion.section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Section 6: CTA                                                     */}
        {/* ------------------------------------------------------------------ */}
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="bg-[#141414] border border-[#EF5744]/40 rounded-xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EF5744]/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EF5744]/15 border border-[#EF5744]/30 rounded-full text-xs text-[#EF5744] font-medium mb-4">
                <Lightbulb className="h-3.5 w-3.5" /> Free Strategy Call
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to fix these issues?</h2>
              <p className="text-[#a1a1aa] text-sm sm:text-base max-w-lg mx-auto mb-6">
                Our team at Daly Advertising specializes in growing local businesses through SEO, paid ads, and digital strategy. We&apos;ll show you exactly what to fix and how.
              </p>
              <a
                href="https://dalyadvertising.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#EF5744] hover:bg-[#d94a39] text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm"
              >
                Get a Free Strategy Call
              </a>
              <p className="text-[#555] text-xs mt-4">No commitment. No pushy sales calls.</p>
            </div>
          </div>
        </motion.section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 7: Technical Details (collapsible)                         */}
        {/* ------------------------------------------------------------------ */}
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <button
            onClick={() => setTechExpanded(prev => !prev)}
            className="flex items-center gap-2 text-[#8b8b93] hover:text-white transition-colors text-sm font-medium w-full text-left"
          >
            {techExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {techExpanded ? 'Hide Technical Details' : 'View Technical Details'}
          </button>

          {techExpanded && (
            <div className="mt-6 space-y-8">

              {/* PageSpeed Details */}
              <div>
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-[#EF5744]" /> PageSpeed Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {(['mobile', 'desktop'] as const).map((device) => {
                    const score = device === 'mobile' ? data.pagespeed_mobile : data.pagespeed_desktop;
                    const vitals = (device === 'mobile' ? data.pagespeed_mobile_vitals : data.pagespeed_desktop_vitals) as Record<string, unknown> | null;
                    const opportunities = device === 'mobile' ? data.pagespeed_mobile_opportunities : data.pagespeed_desktop_opportunities;
                    return (
                      <div key={device} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
                        <p className="text-[#8b8b93] text-xs uppercase tracking-wider mb-4 font-semibold">{device === 'mobile' ? 'Mobile' : 'Desktop'}</p>
                        <div className="flex justify-center mb-5">
                          <div className={`w-20 h-20 rounded-full border-4 ${scoreBorderColor(score)} flex items-center justify-center`}>
                            <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score ?? '--'}</span>
                          </div>
                        </div>
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
                                    {pass !== undefined && <span className={`w-2 h-2 rounded-full ${pass ? 'bg-emerald-500' : 'bg-red-500'}`} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {opportunities && opportunities.length > 0 && (
                          <div>
                            <p className="text-xs text-[#8b8b93] uppercase tracking-wider font-medium mb-2">Top Opportunities</p>
                            <ul className="space-y-1.5">
                              {opportunities.slice(0, 5).map((opp, i) => (
                                <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-2">
                                  <ChevronUp className="h-3 w-3 text-[#EF5744] flex-shrink-0 mt-0.5" />{opp.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All Ranked Keywords */}
              {data.ranked_keywords && data.ranked_keywords.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#EF5744]" /> All Ranked Keywords
                    <span className="text-xs font-normal text-[#8b8b93]">({data.ranked_keywords.length})</span>
                  </h3>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2a2a]">
                            <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Keyword</th>
                            <th className="text-left px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Position</th>
                            <th className="text-right px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Volume</th>
                            <th className="text-right px-4 py-3 text-[#8b8b93] text-xs uppercase tracking-wider font-medium">Traffic Est.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.ranked_keywords.map((kw, i) => (
                            <tr key={i} className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                              <td className="px-4 py-2.5 text-white">{kw.keyword}</td>
                              <td className="px-4 py-2.5"><span className={`font-mono font-bold ${kw.position <= 3 ? 'text-emerald-400' : kw.position <= 10 ? 'text-blue-400' : 'text-[#a1a1aa]'}`}>{kw.position}</span></td>
                              <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{kw.volume?.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-[#a1a1aa]">{kw.traffic_est?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-[#EF5744]" /> Recommendations
                  </h3>
                  {['P0', 'P1', 'P2', 'P3'].map((priority) => {
                    const recs = groupedRecs[priority];
                    if (!recs || recs.length === 0) return null;
                    return (
                      <div key={priority} className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${priorityBadge(priority)}`}>{priority}</span>
                          <span className="text-[#8b8b93] text-xs">{priority === 'P0' ? 'Critical' : priority === 'P1' ? 'High' : priority === 'P2' ? 'Medium' : 'Low'} Priority</span>
                        </div>
                        <div className="space-y-2">
                          {recs.map((rec, i) => (
                            <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                {priority === 'P0' ? <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" /> : priority === 'P1' ? <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" /> : <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-white text-sm font-semibold">{rec.title}</p>
                                    <span className="text-[#8b8b93] text-[10px] uppercase tracking-wider">{rec.category}</span>
                                  </div>
                                  <p className="text-[#a1a1aa] text-sm">{rec.description}</p>
                                  {rec.impact && <p className="text-[#8b8b93] text-xs mt-2">Expected impact: {rec.impact}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* All Issues Table */}
              {data.issues && data.issues.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#EF5744]" /> All Issues
                    </h3>
                    <button onClick={() => setIssueSort(issueSort === 'severity' ? 'category' : 'severity')} className="text-xs text-[#8b8b93] hover:text-white flex items-center gap-1 transition-colors">
                      <ArrowUpDown className="h-3 w-3" /> Sort by {issueSort === 'severity' ? 'category' : 'severity'}
                    </button>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
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
                          <tr key={i} className={`border-b border-[#1f1f1f] hover:bg-[rgba(255,255,255,0.02)] ${i % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111]'}`}>
                            <td className="px-4 py-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${severityBadge(issue.severity)}`}>{issue.severity}</span></td>
                            <td className="px-4 py-2.5 text-white">{issue.issue}</td>
                            <td className="px-4 py-2.5 text-[#a1a1aa] hidden md:table-cell">{issue.description}</td>
                            <td className="px-4 py-2.5 text-[#8b8b93] hidden lg:table-cell">{issue.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </motion.section>

        {/* Footer */}
        <div className="border-t border-[#1a1a1a] pt-8 pb-4 text-center">
          <p className="text-[#555] text-xs">Generated by PulseCheck &middot; <a href="/scan" className="text-[#EF5744] hover:underline">Run a new audit</a></p>
        </div>

      </div>
    </div>
  );
}
