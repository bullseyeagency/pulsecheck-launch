'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Globe, Loader2 } from 'lucide-react';

interface TechnologyItem {
  name?: string;
  version?: string;
  icon?: string;
  categories?: string[];
}

interface TechnologyGroup {
  [category: string]: TechnologyItem[];
}

export default function DomainLookupPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [technologies, setTechnologies] = useState<TechnologyGroup>({});
  const [rawResult, setRawResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError('');
    setTechnologies({});
    setRawResult(null);

    try {
      const res = await fetch('/api/domain-analytics/domain-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const result = data.results?.[0];
      setRawResult(result);

      // Group technologies by category
      if (result?.technologies) {
        const grouped: TechnologyGroup = {};
        const techs = Array.isArray(result.technologies) ? result.technologies : [];

        for (const tech of techs) {
          const cats = tech.categories || ['Other'];
          for (const cat of cats) {
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(tech);
          }
        }

        setTechnologies(grouped);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categoryCount = Object.keys(technologies).length;
  const techCount = Object.values(technologies).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      <Navbar />
      <div className="ml-64 min-h-screen bg-[#0a0a0a]">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-[#EF5744]" />
            <h1 className="text-2xl font-bold text-white">Domain Technology Lookup</h1>
          </div>
          <p className="text-[#a1a1aa] mb-8">
            Discover all technologies detected on a specific domain.
          </p>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-[#141414] border border-[#2a2a2a] rounded p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm text-[#a1a1aa] mb-1.5">Domain</label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full px-3 py-2 bg-[#141414] border-2 border-[#2a2a2a] text-white rounded text-sm focus:border-[#EF5744] focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !target.trim()}
                className="px-5 py-2 bg-[#c93a2a] hover:bg-[#a83020] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Summary */}
          {rawResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Domain</p>
                <p className="text-white font-mono text-sm">{rawResult.target || target}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Technologies</p>
                <p className="text-white font-mono text-lg">{techCount}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Categories</p>
                <p className="text-white font-mono text-lg">{categoryCount}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4">
                <p className="text-xs text-[#8b8b93] mb-1">Country</p>
                <p className="text-white font-mono text-sm">{rawResult.country_iso_code || '-'}</p>
              </div>
            </div>
          )}

          {/* Technologies grouped by category */}
          {categoryCount > 0 && (
            <div className="space-y-4">
              {Object.entries(technologies)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, techs]) => (
                  <div key={category} className="bg-[#141414] border border-[#2a2a2a] rounded overflow-hidden">
                    <div className="px-6 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{category}</span>
                      <span className="text-xs text-[#8b8b93] font-mono">{techs.length}</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {techs.map((tech, i) => (
                        <div
                          key={`${tech.name}-${i}`}
                          className="flex items-center gap-3 px-3 py-2 rounded border border-[#2a2a2a] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        >
                          {tech.icon && (
                            <img
                              src={tech.icon}
                              alt=""
                              className="w-5 h-5 flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">{tech.name || 'Unknown'}</p>
                            {tech.version && (
                              <p className="text-[#8b8b93] text-xs font-mono">v{tech.version}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Fallback: raw JSON if technologies is not an array */}
          {rawResult && categoryCount === 0 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded p-6">
              <p className="text-xs text-[#8b8b93] mb-3 font-medium">Raw Result</p>
              <pre className="text-xs text-[#a1a1aa] font-mono whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto">
                {JSON.stringify(rawResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
