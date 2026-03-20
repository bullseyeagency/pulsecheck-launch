'use client';

import Link from 'next/link';
import {
  Zap,
  Clock,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileJson,
  Download,
  Award,
  DollarSign,
  Building2,
  Briefcase,
  User,
  Store
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#EF5744]" />
              <span className="text-xl font-bold text-white">PulseCheck Campaign Builder</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-[#a1a1aa] hover:text-white text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-[#a1a1aa] hover:text-white text-sm font-medium">How It Works</a>
              <a href="#pricing" className="text-[#a1a1aa] hover:text-white text-sm font-medium">Pricing</a>
              <Link
                href="/campaign-builder"
                className="px-4 py-2 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] transition-colors text-sm font-medium"
              >
                Start Building
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(239,87,68,0.04)] border border-[#EF5744] rounded-full text-sm text-[#EF5744] font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Campaign Automation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Build Google Ads Campaigns<br />
            in <span className="text-[#EF5744]">Minutes</span>, Not <span className="text-[#8b8b93]">Weeks</span>
          </h1>
          <p className="text-xl text-[#a1a1aa] mb-8 max-w-3xl mx-auto leading-relaxed">
            Launch professional, multi-location Google Ads campaigns 10x faster with AI-generated copy,
            automated keyword organization, and one-click exports—all in a single workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/campaign-builder"
              className="px-8 py-4 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] transition-colors text-lg font-semibold flex items-center gap-2 border-2 border-[#2a2a2a]"
            >
              Start Building Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 border-2 border-[#2a2a2a] text-[#d4d4d8] rounded-lg hover:border-[#8b8b93] transition-colors text-lg font-semibold"
            >
              See How It Works
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-[#8b8b93]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>90% faster setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Zero manual repetition</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-[#c93a2a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">93%</div>
              <div className="text-[rgba(255,255,255,0.7)]">Time Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">30 min</div>
              <div className="text-[rgba(255,255,255,0.7)]">Avg. Campaign Build</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">$1,605</div>
              <div className="text-[rgba(255,255,255,0.7)]">Saved Per Campaign</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">&infin;</div>
              <div className="text-[rgba(255,255,255,0.7)]">Locations Scalable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-[#141414]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              The Hidden Tax on Your Time
            </h2>
            <p className="text-xl text-[#a1a1aa] max-w-3xl mx-auto">
              Building Google Ads campaigns for multiple locations is tedious, error-prone, and kills your productivity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a]">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Wasted Hours</h3>
              <p className="text-[#a1a1aa]">
                Spending 5-15+ hours per campaign on manual keyword copying, ad writing, and CSV creation—taking weeks to launch.
              </p>
            </div>
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a]">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Costly Errors</h3>
              <p className="text-[#a1a1aa]">
                Match type syntax mistakes, character limit violations, and inconsistent naming hurt performance and waste budget.
              </p>
            </div>
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a]">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Limited Scale</h3>
              <p className="text-[#a1a1aa]">
                Can't take on more clients or expand to new locations because campaign setup is the bottleneck—losing revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-20 px-4" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              4 Tools. 1 Workflow. Complete Automation.
            </h2>
            <p className="text-xl text-[#a1a1aa] max-w-3xl mx-auto">
              From keyword research to Google Ads Editor import—everything automated in a single platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tool 1 */}
            <div className="bg-[#141414] p-6 rounded-xl border-2 border-[#EF5744]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#c93a2a] text-white rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-bold text-white">Campaign Builder</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#d4d4d8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Structure campaigns with locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Find keywords via DataForSEO API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Auto-generate geo + near me variants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Triad ad groups (Core/Geo/NearMe)</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-[#EF5744] font-semibold">45 min to 10 min</div>
            </div>

            {/* Tool 2 */}
            <div className="bg-[#141414] p-6 rounded-xl border-2 border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#c93a2a] text-white rounded-lg flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-bold text-white">Ad Copy Builder</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#d4d4d8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>AI generates 15 headlines + 4 descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Dynamic keyword insertion in H1</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Validates character limits (30/90)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Approval workflow with edits</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-[#EF5744] font-semibold">20 min/ad to 30 sec/ad</div>
            </div>

            {/* Tool 3 */}
            <div className="bg-[#141414] p-6 rounded-xl border-2 border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#c93a2a] text-white rounded-lg flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-bold text-white">Bulk Campaign</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#d4d4d8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Manage 50+ campaigns in one view</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Search & Replace across all keywords</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Filter by location, ad group, match type</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Export to CSV for Google Ads Editor</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-[#EF5744] font-semibold">45 min to 5 min</div>
            </div>

            {/* Tool 4 */}
            <div className="bg-[#141414] p-6 rounded-xl border-2 border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#c93a2a] text-white rounded-lg flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="font-bold text-white">Bulk Ads</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#d4d4d8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Edit 180+ headlines at once</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Search & Replace ad copy globally</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Table view for spreadsheet editing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#EF5744] mt-0.5 flex-shrink-0" />
                  <span>Export ad copy CSV</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-[#EF5744] font-semibold">30 min to 10 min</div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 bg-[#141414]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for Every Google Ads Professional
            </h2>
            <p className="text-xl text-[#a1a1aa]">
              Whether you're an agency, freelancer, or in-house marketer—we've got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Agency Owners */}
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a] hover:border-[#8b8b93] transition-colors">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Agency Owners</h3>
              <p className="text-[#a1a1aa] mb-4">
                Scale from 12 to 35 clients without hiring. Your team stops doing data entry and starts doing strategy.
              </p>
              <div className="text-sm font-semibold text-[#EF5744]">-&gt; 3x client capacity</div>
            </div>

            {/* PPC Specialists */}
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a] hover:border-[#8b8b93] transition-colors">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">PPC Specialists</h3>
              <p className="text-[#a1a1aa] mb-4">
                Save 10+ hours/week. Hit impossible deadlines. Get your evenings and weekends back.
              </p>
              <div className="text-sm font-semibold text-[#EF5744]">-&gt; Zero overtime</div>
            </div>

            {/* Freelancers */}
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a] hover:border-[#8b8b93] transition-colors">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Freelancers</h3>
              <p className="text-[#a1a1aa] mb-4">
                Compete with agencies 10x your size. Take on 5 clients instead of 2. Deliver in 3 days, not 3 weeks.
              </p>
              <div className="text-sm font-semibold text-[#EF5744]">-&gt; Double your income</div>
            </div>

            {/* Small Business */}
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a] hover:border-[#8b8b93] transition-colors">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Small Businesses</h3>
              <p className="text-[#a1a1aa] mb-4">
                Run professional campaigns without $3K/month agencies. Save $30K+/year and keep control.
              </p>
              <div className="text-sm font-semibold text-[#EF5744]">-&gt; DIY like a pro</div>
            </div>

            {/* Multi-Location */}
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a] hover:border-[#8b8b93] transition-colors">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Location</h3>
              <p className="text-[#a1a1aa] mb-4">
                Expand from 5 to 50 cities instantly. Consistent messaging. No per-location fees.
              </p>
              <div className="text-sm font-semibold text-[#EF5744]">-&gt; Infinite scale</div>
            </div>

            {/* E-commerce */}
            <div className="bg-[#141414] p-8 rounded-xl border border-[#2a2a2a] hover:border-[#8b8b93] transition-colors">
              <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#EF5744]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">E-commerce</h3>
              <p className="text-[#a1a1aa] mb-4">
                Seasonal refreshes in minutes. Test new products fast. Update copy across 100+ campaigns.
              </p>
              <div className="text-sm font-semibold text-[#EF5744]">-&gt; Ship campaigns daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features That Save Hours
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-[#EF5744]" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered Ad Copy</h3>
                <p className="text-[#a1a1aa] mb-3">
                  OpenAI GPT-3.5 generates 15 headlines + 4 descriptions per ad group. Context-aware copy for Core, Geo, and Near Me campaigns.
                </p>
                <div className="text-sm text-[#EF5744] font-medium">-&gt; 95% time reduction vs. manual</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-xl flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-[#EF5744]" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Auto-Generate Geo Keywords</h3>
                <p className="text-[#a1a1aa] mb-3">
                  One click converts base keywords to location-specific variants. Updates all keywords when locations change.
                </p>
                <div className="text-sm text-[#EF5744] font-medium">-&gt; No manual copying ever</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-[#EF5744]" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Triad Ad Group Strategy</h3>
                <p className="text-[#a1a1aa] mb-3">
                  Instantly create Core (product), Geo (location), and Near Me (proximity) ad groups with correct match types.
                </p>
                <div className="text-sm text-[#EF5744] font-medium">-&gt; Industry best practice built-in</div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-xl flex items-center justify-center">
                  <FileJson className="h-6 w-6 text-[#EF5744]" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Template Import/Export</h3>
                <p className="text-[#a1a1aa] mb-3">
                  Save successful campaigns as templates. Import to reuse structure for new clients or products instantly.
                </p>
                <div className="text-sm text-[#EF5744] font-medium">-&gt; Build once, reuse forever</div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-xl flex items-center justify-center">
                  <Download className="h-6 w-6 text-[#EF5744]" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Google Ads Editor Export</h3>
                <p className="text-[#a1a1aa] mb-3">
                  One-click CSV exports formatted for Google Ads Editor. Keywords and ad copy ready to import immediately.
                </p>
                <div className="text-sm text-[#EF5744] font-medium">-&gt; No manual CSV creation</div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[rgba(239,87,68,0.12)] rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-[#EF5744]" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Automatic Validation</h3>
                <p className="text-[#a1a1aa] mb-3">
                  Enforces Google's rules: 30 char headlines, 90 char descriptions, min 3 headlines, min 2 descriptions, valid URLs.
                </p>
                <div className="text-sm text-[#EF5744] font-medium">-&gt; Zero upload errors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-[#141414]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              How We Compare
            </h2>
            <p className="text-xl text-[#a1a1aa]">
              See why agencies and specialists choose PulseCheck over alternatives
            </p>
          </div>
          <div className="bg-[#141414] rounded-xl border-2 border-[#2a2a2a] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#141414] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#EF5744]">PulseCheck</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#8b8b93]">Google Ads Editor</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#8b8b93]">WordStream</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#8b8b93]">Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                <tr className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4 text-sm text-white">AI Ad Copy</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">Generic</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4 text-sm text-white">Geo Keyword Auto-Gen</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4 text-sm text-white">Triad Strategy Built-in</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">Manual</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4 text-sm text-white">Bulk Search & Replace</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">Limited</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-[#8b8b93] mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4 text-sm text-white">Template Import</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                  <td className="px-6 py-4 text-center text-[#8b8b93]">&times;</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-4 text-sm text-white">Cost</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-[#EF5744]">Free</td>
                  <td className="px-6 py-4 text-center text-sm text-[#a1a1aa]">Free</td>
                  <td className="px-6 py-4 text-center text-sm text-[#a1a1aa]">$500-2K/mo</td>
                  <td className="px-6 py-4 text-center text-sm text-[#a1a1aa]">Time</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a] bg-[rgba(239,87,68,0.04)]">
                  <td className="px-6 py-4 text-sm font-bold text-white">Setup Time</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-[#EF5744]">30 min</td>
                  <td className="px-6 py-4 text-center text-sm text-[#a1a1aa]">3 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-[#a1a1aa]">2 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-[#a1a1aa]">6 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-[#a1a1aa]">
              Start free. Scale when you're ready. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-[#141414] rounded-xl border-2 border-[#2a2a2a] p-8">
              <div className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wide mb-2">Free Trial</div>
              <div className="text-4xl font-bold text-white mb-1">$0</div>
              <div className="text-sm text-[#8b8b93] mb-6">No credit card required</div>
              <Link
                href="/campaign-builder"
                className="block w-full px-6 py-3 bg-[#141414] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors text-center font-semibold mb-6 border border-[#2a2a2a]"
              >
                Start Free
              </Link>
              <ul className="space-y-3 text-sm text-[#d4d4d8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>3 campaigns per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Up to 5 locations per campaign</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>50 AI ad copies per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Full CSV export</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Template library access</span>
                </li>
              </ul>
            </div>

            {/* Starter */}
            <div className="bg-[#141414] rounded-xl border-2 border-[#EF5744] p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#EF5744] text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold text-[#EF5744] uppercase tracking-wide mb-2">Starter</div>
              <div className="text-4xl font-bold text-white mb-1">$49<span className="text-lg text-[#8b8b93]">/mo</span></div>
              <div className="text-sm text-[#8b8b93] mb-6">30-day money back guarantee</div>
              <Link
                href="/campaign-builder"
                className="block w-full px-6 py-3 bg-[#c93a2a] text-white rounded-lg hover:bg-[#a83020] transition-colors text-center font-semibold mb-6"
              >
                Try Risk-Free
              </Link>
              <ul className="space-y-3 text-sm text-[#d4d4d8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited AI ad copy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Save campaigns to dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Bulk Campaign Generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Bulk Ads Generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Priority email support</span>
                </li>
              </ul>
            </div>

            {/* Agency */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-[#2a2a2a] p-8 text-white">
              <div className="text-sm font-semibold text-[#EF5744] uppercase tracking-wide mb-2">Agency</div>
              <div className="text-4xl font-bold mb-1">$199<span className="text-lg text-[#8b8b93]">/mo</span></div>
              <div className="text-sm text-[#8b8b93] mb-6">For teams & white-label</div>
              <Link
                href="/campaign-builder"
                className="block w-full px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-center font-semibold mb-6"
              >
                Book Demo
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Everything in Starter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>5 team member seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>White-label exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Priority support (24hr)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Custom templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#EF5744] flex-shrink-0 mt-0.5" />
                  <span>Campaign performance tracking</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-sm text-[#8b8b93]">
              <span className="font-semibold">Annual plans save 20%</span> &bull; Starter: $470/year &bull; Agency: $1,910/year
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#c93a2a] to-[#a83020]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Wasting Time on Manual Campaign Setup
          </h2>
          <p className="text-xl text-[rgba(255,255,255,0.7)] mb-8">
            Join hundreds of agencies, freelancers, and marketers who've reclaimed 10-20 hours per week with PulseCheck Campaign Builder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/campaign-builder"
              className="px-8 py-4 bg-white text-[#c93a2a] rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold flex items-center gap-2 border-2 border-[#2a2a2a]"
            >
              Start Building Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-[rgba(255,255,255,0.7)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>30-day refund</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t-2 border-[#2a2a2a] text-[#8b8b93] py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-[#EF5744]" />
            <span className="text-xl font-bold text-white">PulseCheck Campaign Builder</span>
          </div>
          <p className="text-sm mb-4">
            Built by Bullseye Agency for digital marketers who value their time.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/campaign-builder" className="hover:text-white transition-colors">Campaign Builder</Link>
            <Link href="/ad-copy-builder" className="hover:text-white transition-colors">Ad Copy Builder</Link>
            <Link href="/bulk-campaign-generator" className="hover:text-white transition-colors">Bulk Tools</Link>
          </div>
          <div className="mt-8 pt-8 border-t border-[#2a2a2a] text-xs">
            &copy; 2026 Bullseye Agency. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
