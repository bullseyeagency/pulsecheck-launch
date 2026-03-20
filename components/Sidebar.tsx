'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hammer, Table, FileText, Sparkles, BarChart3, Home, Combine,
  FolderKanban, LogOut, TrendingUp, ChevronDown, Globe, Code,
  Search, BarChart2, PieChart, Layers, Bot, BrainCircuit,
  MessageSquare, Activity, KeyRound, MapPin, Newspaper, Type,
  Link2, Users, Clock,
  FileSearch, ScanText, Hash, Zap, Heart,
  FlaskConical, Lightbulb, Gauge,
  ShoppingCart, Building2, Store, Star, Share2,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

type NavLink = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  step?: number;
};

const builderSteps: NavLink[] = [
  { href: '/campaign-builder', icon: Hammer, label: 'Keyword Research', step: 1 },
  { href: '/json-merger', icon: Combine, label: 'Merge JSON', step: 2 },
  { href: '/ad-copy-builder', icon: Sparkles, label: 'Ad Copy Builder', step: 3 },
  { href: '/bulk-campaign-generator', icon: Table, label: 'Prepare Campaigns', step: 4 },
  { href: '/bulk-ads-generator', icon: FileText, label: 'Prepare Ads', step: 5 },
];

const domainAnalyticsItems: NavLink[] = [
  { href: '/domain-analytics/by-technology', icon: Code, label: 'By Technology' },
  { href: '/domain-analytics/by-html-terms', icon: Search, label: 'By HTML Terms' },
  { href: '/domain-analytics/domain-lookup', icon: Globe, label: 'Domain Lookup' },
  { href: '/domain-analytics/tech-stats', icon: BarChart2, label: 'Technology Stats' },
  { href: '/domain-analytics/summary', icon: PieChart, label: 'Tech Summary' },
  { href: '/domain-analytics/aggregation', icon: Layers, label: 'Co-used Tech' },
];

const aiOptimizationItems: NavLink[] = [
  { href: '/ai-optimization/mentions', icon: MessageSquare, label: 'LLM Mentions' },
  { href: '/ai-optimization/keyword-volume', icon: Activity, label: 'AI Keyword Volume' },
  { href: '/ai-optimization/llm-responses', icon: Bot, label: 'LLM Responses' },
  { href: '/ai-optimization/analytics', icon: BrainCircuit, label: 'Mentions Analytics' },
];

const keywordsDataItems: NavLink[] = [
  { href: '/keywords-data/search-volume', icon: BarChart3, label: 'Search Volume' },
  { href: '/keywords-data/keywords-for-site', icon: Globe, label: 'Keywords for Site' },
  { href: '/keywords-data/keywords-for-keywords', icon: KeyRound, label: 'Related Keywords' },
  { href: '/keywords-data/ad-traffic', icon: TrendingUp, label: 'Ad Traffic' },
  { href: '/keywords-data/google-trends', icon: Activity, label: 'Google Trends' },
];

const serpItems: NavLink[] = [
  { href: '/serp/google-organic', icon: Search, label: 'Google Organic' },
  { href: '/serp/google-maps', icon: MapPin, label: 'Google Maps' },
  { href: '/serp/google-news', icon: Newspaper, label: 'Google News' },
  { href: '/serp/google-autocomplete', icon: Type, label: 'Autocomplete' },
];

const backlinksItems: NavLink[] = [
  { href: '/backlinks/summary', icon: BarChart3, label: 'Summary' },
  { href: '/backlinks/list', icon: Link2, label: 'Backlinks List' },
  { href: '/backlinks/referring-domains', icon: Globe, label: 'Referring Domains' },
  { href: '/backlinks/competitors', icon: Users, label: 'Competitors' },
  { href: '/backlinks/history', icon: Clock, label: 'History' },
];

const onPageItems: NavLink[] = [
  { href: '/on-page/instant-audit', icon: FileSearch, label: 'Instant Audit' },
  { href: '/on-page/keyword-density', icon: Hash, label: 'Keyword Density' },
  { href: '/on-page/lighthouse', icon: Zap, label: 'Lighthouse' },
];

const contentItems: NavLink[] = [
  { href: '/content-analysis/search', icon: ScanText, label: 'Citation Search' },
  { href: '/content-analysis/sentiment', icon: Heart, label: 'Sentiment Analysis' },
  { href: '/content-analysis/trends', icon: TrendingUp, label: 'Phrase Trends' },
];

const labsItems: NavLink[] = [
  { href: '/labs/keyword-overview', icon: Search, label: 'Keyword Overview' },
  { href: '/labs/keyword-ideas', icon: Lightbulb, label: 'Keyword Ideas' },
  { href: '/labs/keyword-difficulty', icon: Gauge, label: 'Keyword Difficulty' },
  { href: '/labs/competitors', icon: Users, label: 'SERP Competitors' },
  { href: '/labs/ranked-keywords', icon: TrendingUp, label: 'Ranked Keywords' },
  { href: '/labs/domain-overview', icon: Globe, label: 'Domain Overview' },
];

const merchantItems: NavLink[] = [
  { href: '/merchant/products', icon: ShoppingCart, label: 'Product Search' },
  { href: '/merchant/sellers', icon: Store, label: 'Seller Search' },
  { href: '/merchant/reviews', icon: Star, label: 'Product Reviews' },
];

const businessItems: NavLink[] = [
  { href: '/business/listings', icon: Building2, label: 'Business Listings' },
  { href: '/business/reviews', icon: MessageSquare, label: 'Google Reviews' },
  { href: '/business/social', icon: Share2, label: 'Social Media' },
];

const gscItems: NavLink[] = [
  { href: '/gsc', icon: Globe, label: 'URL Indexing' },
];

const managerLinks: NavLink[] = [
  { href: '/campaigns', icon: FolderKanban, label: 'Campaign Manager' },
  { href: '/campaigns/keywords', icon: TrendingUp, label: 'Keywords Over Time' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const builderActive = builderSteps.some((s) => pathname === s.href);
  const domainActive = domainAnalyticsItems.some((s) => pathname === s.href);
  const aiActive = aiOptimizationItems.some((s) => pathname === s.href);
  const keywordsDataActive = keywordsDataItems.some((s) => pathname === s.href);
  const serpActive = serpItems.some((s) => pathname === s.href);
  const backlinksActive = backlinksItems.some((s) => pathname === s.href);
  const onPageActive = onPageItems.some((s) => pathname === s.href);
  const contentActive = contentItems.some((s) => pathname === s.href);
  const labsActive = labsItems.some((s) => pathname === s.href);
  const [builderOpen, setBuilderOpen] = useState(builderActive);
  const [domainOpen, setDomainOpen] = useState(domainActive);
  const [aiOpen, setAiOpen] = useState(aiActive);
  const [keywordsDataOpen, setKeywordsDataOpen] = useState(keywordsDataActive);
  const [serpOpen, setSerpOpen] = useState(serpActive);
  const [backlinksOpen, setBacklinksOpen] = useState(backlinksActive);
  const [onPageOpen, setOnPageOpen] = useState(onPageActive);
  const [contentOpen, setContentOpen] = useState(contentActive);
  const [labsOpen, setLabsOpen] = useState(labsActive);
  const merchantActive = merchantItems.some((s) => pathname === s.href);
  const [merchantOpen, setMerchantOpen] = useState(merchantActive);
  const businessActive = businessItems.some((s) => pathname === s.href);
  const [businessOpen, setBusinessOpen] = useState(businessActive);
  const gscActive = gscItems.some((s) => pathname === s.href);
  const [gscOpen, setGscOpen] = useState(gscActive);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-[rgba(239,87,68,0.12)] text-[#EF5744]'
        : 'text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  const subLinkClass = (active: boolean) =>
    `flex items-center gap-2 px-2 py-1.5 rounded text-[13px] font-medium transition-all duration-200 ${
      active
        ? 'bg-[rgba(239,87,68,0.12)] text-[#EF5744]'
        : 'text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  const sectionToggleClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
      active
        ? 'text-[#EF5744]'
        : 'text-[#8b8b93] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r-2 border-[#2a2a2a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center h-14 border-b-2 border-[#2a2a2a] px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#EF5744]" />
          <span className="text-base font-bold text-white tracking-tight">PulseCheck</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {/* Home */}
        <Link href="/landing" className={navLinkClass(pathname === '/landing')}>
          <Home className="h-4 w-4 flex-shrink-0" />
          <span>Home</span>
        </Link>

        {/* Campaign Builder */}
        <div>
          <button onClick={() => setBuilderOpen(!builderOpen)} className={sectionToggleClass(builderActive)}>
            <div className="flex items-center gap-2.5">
              <Hammer className="h-4 w-4 flex-shrink-0" />
              <span>Campaign Builder</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${builderOpen ? 'rotate-180' : ''}`} />
          </button>
          {builderOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {builderSteps.map(({ href, icon: Icon, label, step }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <span className={`text-[10px] font-bold w-4 text-center flex-shrink-0 font-mono ${isActive ? 'text-[#EF5744]' : 'text-[#8b8b93]'}`}>{step}</span>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Domain Analytics */}
        <div>
          <button onClick={() => setDomainOpen(!domainOpen)} className={sectionToggleClass(domainActive)}>
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 flex-shrink-0" />
              <span>Domain Analytics</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${domainOpen ? 'rotate-180' : ''}`} />
          </button>
          {domainOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {domainAnalyticsItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Optimization */}
        <div>
          <button onClick={() => setAiOpen(!aiOpen)} className={sectionToggleClass(aiActive)}>
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="h-4 w-4 flex-shrink-0" />
              <span>AI Optimization</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${aiOpen ? 'rotate-180' : ''}`} />
          </button>
          {aiOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {aiOptimizationItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Keywords Data */}
        <div>
          <button onClick={() => setKeywordsDataOpen(!keywordsDataOpen)} className={sectionToggleClass(keywordsDataActive)}>
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 flex-shrink-0" />
              <span>Keywords Data</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${keywordsDataOpen ? 'rotate-180' : ''}`} />
          </button>
          {keywordsDataOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {keywordsDataItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* SERP */}
        <div>
          <button onClick={() => setSerpOpen(!serpOpen)} className={sectionToggleClass(serpActive)}>
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 flex-shrink-0" />
              <span>SERP</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${serpOpen ? 'rotate-180' : ''}`} />
          </button>
          {serpOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {serpItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Backlinks */}
        <div>
          <button onClick={() => setBacklinksOpen(!backlinksOpen)} className={sectionToggleClass(backlinksActive)}>
            <div className="flex items-center gap-2.5">
              <Link2 className="h-4 w-4 flex-shrink-0" />
              <span>Backlinks</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${backlinksOpen ? 'rotate-180' : ''}`} />
          </button>
          {backlinksOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {backlinksItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* On-Page */}
        <div>
          <button onClick={() => setOnPageOpen(!onPageOpen)} className={sectionToggleClass(onPageActive)}>
            <div className="flex items-center gap-2.5">
              <FileSearch className="h-4 w-4 flex-shrink-0" />
              <span>On-Page</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${onPageOpen ? 'rotate-180' : ''}`} />
          </button>
          {onPageOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {onPageItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Analysis */}
        <div>
          <button onClick={() => setContentOpen(!contentOpen)} className={sectionToggleClass(contentActive)}>
            <div className="flex items-center gap-2.5">
              <ScanText className="h-4 w-4 flex-shrink-0" />
              <span>Content</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${contentOpen ? 'rotate-180' : ''}`} />
          </button>
          {contentOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {contentItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* DataForSEO Labs */}
        <div>
          <button onClick={() => setLabsOpen(!labsOpen)} className={sectionToggleClass(labsActive)}>
            <div className="flex items-center gap-2.5">
              <FlaskConical className="h-4 w-4 flex-shrink-0" />
              <span>Labs</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${labsOpen ? 'rotate-180' : ''}`} />
          </button>
          {labsOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {labsItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Merchant */}
        <div>
          <button onClick={() => setMerchantOpen(!merchantOpen)} className={sectionToggleClass(merchantActive)}>
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="h-4 w-4 flex-shrink-0" />
              <span>Merchant</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${merchantOpen ? 'rotate-180' : ''}`} />
          </button>
          {merchantOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {merchantItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Business Data */}
        <div>
          <button onClick={() => setBusinessOpen(!businessOpen)} className={sectionToggleClass(businessActive)}>
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span>Business Data</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${businessOpen ? 'rotate-180' : ''}`} />
          </button>
          {businessOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {businessItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Console */}
        <div>
          <button onClick={() => setGscOpen(!gscOpen)} className={sectionToggleClass(gscActive)}>
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 flex-shrink-0" />
              <span>Search Console</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-[#8b8b93] transition-transform duration-200 ${gscOpen ? 'rotate-180' : ''}`} />
          </button>
          {gscOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#2a2a2a] pl-2">
              {gscItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} className={subLinkClass(isActive)}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Manager */}
        <div className="pt-2">
          <div className="px-3 pb-1 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[#EF5744] uppercase tracking-widest font-mono">
              Account Manager
            </span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>
          {managerLinks.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={navLinkClass(pathname === href)}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t-2 border-[#2a2a2a] p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 rounded text-sm font-medium transition-all duration-200 text-[#8b8b93] hover:text-[#EF5744] hover:bg-[rgba(239,87,68,0.04)] border-2 border-[#2a2a2a] hover:border-[#EF5744]"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
        <div className="text-xs text-[#8b8b93] text-center font-mono uppercase tracking-widest">
          <p className="font-semibold text-white">Daly Advertising</p>
          <p className="mt-0.5 text-[10px]">Google Ads Tools</p>
        </div>
      </div>
    </aside>
  );
}
