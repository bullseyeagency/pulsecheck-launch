'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Zap, Loader2 } from 'lucide-react';

const ALL_CATEGORIES = [
  { id: 'performance', label: 'Performance' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'seo', label: 'SEO' },
];

interface CategoryScore {
  id: string;
  title: string;
  score: number;
}

interface AuditItem {
  id: string;
  title: string;
  description?: string;
  score?: number | null;
  displayValue?: string;
}

export default function LighthousePage() {
  const [url, setUrl] = useState('');
  const [categories, setCategories] = useState<string[]>(['performance', 'accessibility', 'best-practices', 'seo']);
  const [forMobile, setForMobile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<CategoryScore[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || categories.length === 0) return;

    setLoading(true);
    setError('');
    setScores([]);
    setAudits([]);

    try {
      const res = await fetch('/api/on-page/lighthouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          categories,
          for_mobile: forMobile,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const result = data.results?.[0];
      if (!result) {
        setError('No data returned.');
        return;
      }

      // Parse categories scores
      const cats = result.categories;
      if (cats && typeof cats === 'object') {
        const parsed: CategoryScore[] = [];
        for (const [id, info] of Object.entries(cats)) {
          const catInfo = info as { title?: string; score?: number };
          parsed.push({
            id,
            title: catInfo.title || id,
            score: Math.round((catInfo.score || 0) * 100),
          });
        }
        setScores(parsed);
      }

      // Parse audits
      const auditData = result.audits;
      if (auditData && typeof auditData === 'object') {
        const parsed: AuditItem[] = [];
        for (const [id, info] of Object.entries(auditData)) {
          const a = info as AuditItem;
          if (a.score !== undefined && a.score !== null && a.score < 1) {
            parsed.push({ id, title: a.title, description: a.description, score: a.score, displayValue: a.displayValue });
          }
        }
        parsed.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
        setAudits(parsed.slice(0, 20));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreRing = (score: number) => {
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (score / 100) * circumference;
    return { circumference, offset };
  };

  return (
    <>
      <Navbar />
      <main className="ml-64 min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Zap className="h-7 w-7 text-[#EF5744]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Lighthouse Audit</h1>
              <p className="text-[#8b8b93] text-sm mt-1">
                Run a Lighthouse performance audit on any URL.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Page URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-2.5 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded focus:border-[#EF5744] outline-none placeholder:text-[#8b8b93] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Categories</label>
                <div className="flex flex-wrap gap-3">
                  {ALL_CATEGORIES.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="accent-[#EF5744]"
                      />
                      <span className="text-sm text-[#a1a1aa]">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forMobile}
                    onChange={() => setForMobile(!forMobile)}
                    className="accent-[#EF5744]"
                  />
                  <span className="text-sm text-[#a1a1aa]">Mobile audit</span>
                </label>

                <button
                  type="submit"
                  disabled={loading || categories.length === 0}
                  className="px-6 py-2.5 bg-[#c93a2a] hover:bg-[#a83020] text-white font-semibold rounded disabled:opacity-50 transition-colors text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running...
                    </span>
                  ) : (
                    'Run Lighthouse'
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

          {/* Score Cards */}
          {scores.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {scores.map((s) => {
                const color = getScoreColor(s.score);
                const { circumference, offset } = getScoreRing(s.score);
                return (
                  <div key={s.id} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 flex flex-col items-center">
                    <svg width="100" height="100" className="mb-3">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-700"
                      />
                      <text x="50" y="50" textAnchor="middle" dy="0.35em" fill={color} fontSize="24" fontWeight="bold">
                        {s.score}
                      </text>
                    </svg>
                    <p className="text-[#a1a1aa] text-sm font-medium text-center">{s.title}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Key Audits */}
          {audits.length > 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <p className="text-white font-semibold mb-4">Key Audit Items</p>
              <div className="space-y-3">
                {audits.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded bg-[#0a0a0a] border border-[#2a2a2a]/50">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: getScoreColor(Math.round((a.score ?? 0) * 100)) }}
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{a.title}</p>
                      {a.displayValue && (
                        <p className="text-[#8b8b93] text-xs mt-0.5">{a.displayValue}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
