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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">PulseCheck Campaign Builder</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</a>
              <Link
                href="/campaign-builder"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Campaign Automation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Build Google Ads Campaigns<br />
            in <span className="text-blue-600">Minutes</span>, Not <span className="text-gray-400">Weeks</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Launch professional, multi-location Google Ads campaigns 10x faster with AI-generated copy,
            automated keyword organization, and one-click exports—all in a single workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/campaign-builder"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              Start Building Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors text-lg font-semibold"
            >
              See How It Works
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
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
      <section className="py-12 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">93%</div>
              <div className="text-blue-100">Time Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">30 min</div>
              <div className="text-blue-100">Avg. Campaign Build</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">$1,605</div>
              <div className="text-blue-100">Saved Per Campaign</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">∞</div>
              <div className="text-blue-100">Locations Scalable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Hidden Tax on Your Time
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Building Google Ads campaigns for multiple locations is tedious, error-prone, and kills your productivity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Wasted Hours</h3>
              <p className="text-gray-600">
                Spending 5-15+ hours per campaign on manual keyword copying, ad writing, and CSV creation—taking weeks to launch.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Costly Errors</h3>
              <p className="text-gray-600">
                Match type syntax mistakes, character limit violations, and inconsistent naming hurt performance and waste budget.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Limited Scale</h3>
              <p className="text-gray-600">
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              4 Tools. 1 Workflow. Complete Automation.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From keyword research to Google Ads Editor import—everything automated in a single platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tool 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-bold text-gray-900">Campaign Builder</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Structure campaigns with locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Find keywords via DataForSEO API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-generate geo + near me variants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Triad ad groups (Core/Geo/NearMe)</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-blue-700 font-semibold">⏱️ 45 min → 10 min</div>
            </div>

            {/* Tool 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-bold text-gray-900">Ad Copy Builder</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>AI generates 15 headlines + 4 descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Dynamic keyword insertion in H1</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Validates character limits (30/90)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Approval workflow with edits</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-purple-700 font-semibold">⏱️ 20 min/ad → 30 sec/ad</div>
            </div>

            {/* Tool 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-bold text-gray-900">Bulk Campaign</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Manage 50+ campaigns in one view</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Search & Replace across all keywords</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Filter by location, ad group, match type</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Export to CSV for Google Ads Editor</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-green-700 font-semibold">⏱️ 45 min → 5 min</div>
            </div>

            {/* Tool 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="font-bold text-gray-900">Bulk Ads</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Edit 180+ headlines at once</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Search & Replace ad copy globally</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Table view for spreadsheet editing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Export ad copy CSV</span>
                </li>
              </ul>
              <div className="mt-4 text-xs text-orange-700 font-semibold">⏱️ 30 min → 10 min</div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Every Google Ads Professional
            </h2>
            <p className="text-xl text-gray-600">
              Whether you're an agency, freelancer, or in-house marketer—we've got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Agency Owners */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Agency Owners</h3>
              <p className="text-gray-600 mb-4">
                Scale from 12 to 35 clients without hiring. Your team stops doing data entry and starts doing strategy.
              </p>
              <div className="text-sm font-semibold text-blue-600">→ 3x client capacity</div>
            </div>

            {/* PPC Specialists */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">PPC Specialists</h3>
              <p className="text-gray-600 mb-4">
                Save 10+ hours/week. Hit impossible deadlines. Get your evenings and weekends back.
              </p>
              <div className="text-sm font-semibold text-purple-600">→ Zero overtime</div>
            </div>

            {/* Freelancers */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Freelancers</h3>
              <p className="text-gray-600 mb-4">
                Compete with agencies 10x your size. Take on 5 clients instead of 2. Deliver in 3 days, not 3 weeks.
              </p>
              <div className="text-sm font-semibold text-green-600">→ Double your income</div>
            </div>

            {/* Small Business */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Small Businesses</h3>
              <p className="text-gray-600 mb-4">
                Run professional campaigns without $3K/month agencies. Save $30K+/year and keep control.
              </p>
              <div className="text-sm font-semibold text-orange-600">→ DIY like a pro</div>
            </div>

            {/* Multi-Location */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Location</h3>
              <p className="text-gray-600 mb-4">
                Expand from 5 to 50 cities instantly. Consistent messaging. No per-location fees.
              </p>
              <div className="text-sm font-semibold text-red-600">→ Infinite scale</div>
            </div>

            {/* E-commerce */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">E-commerce</h3>
              <p className="text-gray-600 mb-4">
                Seasonal refreshes in minutes. Test new products fast. Update copy across 100+ campaigns.
              </p>
              <div className="text-sm font-semibold text-indigo-600">→ Ship campaigns daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features That Save Hours
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Ad Copy</h3>
                <p className="text-gray-600 mb-3">
                  OpenAI GPT-3.5 generates 15 headlines + 4 descriptions per ad group. Context-aware copy for Core, Geo, and Near Me campaigns.
                </p>
                <div className="text-sm text-blue-600 font-medium">→ 95% time reduction vs. manual</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Auto-Generate Geo Keywords</h3>
                <p className="text-gray-600 mb-3">
                  One click converts base keywords to location-specific variants. Updates all keywords when locations change.
                </p>
                <div className="text-sm text-green-600 font-medium">→ No manual copying ever</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Triad Ad Group Strategy</h3>
                <p className="text-gray-600 mb-3">
                  Instantly create Core (product), Geo (location), and Near Me (proximity) ad groups with correct match types.
                </p>
                <div className="text-sm text-purple-600 font-medium">→ Industry best practice built-in</div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileJson className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Template Import/Export</h3>
                <p className="text-gray-600 mb-3">
                  Save successful campaigns as templates. Import to reuse structure for new clients or products instantly.
                </p>
                <div className="text-sm text-orange-600 font-medium">→ Build once, reuse forever</div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Download className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Google Ads Editor Export</h3>
                <p className="text-gray-600 mb-3">
                  One-click CSV exports formatted for Google Ads Editor. Keywords and ad copy ready to import immediately.
                </p>
                <div className="text-sm text-red-600 font-medium">→ No manual CSV creation</div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Automatic Validation</h3>
                <p className="text-gray-600 mb-3">
                  Enforces Google's rules: 30 char headlines, 90 char descriptions, min 3 headlines, min 2 descriptions, valid URLs.
                </p>
                <div className="text-sm text-indigo-600 font-medium">→ Zero upload errors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How We Compare
            </h2>
            <p className="text-xl text-gray-600">
              See why agencies and specialists choose PulseCheck over alternatives
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">PulseCheck</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Google Ads Editor</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">WordStream</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">AI Ad Copy</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-400">Generic</td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Geo Keyword Auto-Gen</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Triad Strategy Built-in</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-400">Manual</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Bulk Search & Replace</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-400">Limited</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Template Import</td>
                  <td className="px-6 py-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                  <td className="px-6 py-4 text-center text-gray-300">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Cost</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-blue-600">Free</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Free</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$500-2K/mo</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Time</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">Setup Time</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-blue-600">30 min</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">3 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">2 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">6 hours</td>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free. Scale when you're ready. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Free Trial</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
              <div className="text-sm text-gray-500 mb-6">No credit card required</div>
              <Link
                href="/campaign-builder"
                className="block w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center font-semibold mb-6"
              >
                Start Free
              </Link>
              <ul className="space-y-3 text-sm">
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
            <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Starter</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$49<span className="text-lg text-gray-500">/mo</span></div>
              <div className="text-sm text-gray-500 mb-6">30-day money back guarantee</div>
              <Link
                href="/campaign-builder"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold mb-6"
              >
                Try Risk-Free
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited AI ad copy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Save campaigns to dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Bulk Campaign Generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Bulk Ads Generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Priority email support</span>
                </li>
              </ul>
            </div>

            {/* Agency */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-8 text-white">
              <div className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">Agency</div>
              <div className="text-4xl font-bold mb-1">$199<span className="text-lg text-gray-400">/mo</span></div>
              <div className="text-sm text-gray-400 mb-6">For teams & white-label</div>
              <Link
                href="/campaign-builder"
                className="block w-full px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-center font-semibold mb-6"
              >
                Book Demo
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Everything in Starter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>5 team member seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>White-label exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Priority support (24hr)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Custom templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Campaign performance tracking</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Annual plans save 20%</span> • Starter: $470/year • Agency: $1,910/year
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Wasting Time on Manual Campaign Setup
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of agencies, freelancers, and marketers who've reclaimed 10-20 hours per week with PulseCheck Campaign Builder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/campaign-builder"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold flex items-center gap-2 shadow-xl"
            >
              Start Building Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-blue-100">
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
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-blue-500" />
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
          <div className="mt-8 pt-8 border-t border-gray-800 text-xs">
            © 2026 Bullseye Agency. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
