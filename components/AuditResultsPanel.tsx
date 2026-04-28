'use client';

import { ArrowRight, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

function gradeColor(grade: string) {
  if (grade?.startsWith('A')) return 'text-emerald-400';
  if (grade?.startsWith('B')) return 'text-green-400';
  if (grade?.startsWith('C')) return 'text-yellow-400';
  if (grade?.startsWith('D')) return 'text-orange-400';
  return 'text-red-400';
}

function scoreColor(s: number | null | undefined) {
  if (!s) return 'text-[#555]';
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBarColor(s: number | null | undefined) {
  if (!s) return '#333';
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#eab308';
  return '#ef4444';
}

export function AuditResultsPanel({
  auditId,
  report,
}: {
  auditId: string;
  report: Record<string, unknown> | null;
}) {
  if (!report) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-2">Audit complete</p>
        <p className="text-[#8b8b93] mb-6">View the full report for all findings and recommendations.</p>
        <a
          href={`/scan/${auditId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-bold px-6 py-3 rounded-lg transition-colors"
        >
          View Full Report <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const scores = (report.scores as Record<string, number>) || {};
  const grade = (report.overallGrade as string) || 'C';
  const totalIssues = (report.totalIssues as Record<string, number>) || {};
  const issueCount = (totalIssues.critical || 0) + (totalIssues.high || 0) + (totalIssues.medium || 0) + (totalIssues.low || 0);
  const topOpportunities = (report.topOpportunities as Array<{ keyword: string; volume: number; difficulty: number }>) || [];
  const topCompetitors = (report.topCompetitors as Array<{ domain: string; keywords: number; overlap: number }>) || [];
  const totalKeywords = report.totalKeywords as number | undefined;
  const estimatedTraffic = report.estimatedTraffic as number | undefined;

  const categories = [
    { key: 'pagespeedMobile', label: 'Mobile Speed' },
    { key: 'pagespeedDesktop', label: 'Desktop Speed' },
    { key: 'seo', label: 'SEO' },
    { key: 'accessibility', label: 'Accessibility' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Grade + summary */}
      <div className="flex items-center gap-6 bg-[#141414] border border-[#1f1f1f] rounded-xl p-6">
        <div className="text-center flex-shrink-0">
          <div className={`text-6xl font-black ${gradeColor(grade)}`}>{grade}</div>
          <div className="text-xs text-[#8b8b93] mt-1">Overall Grade</div>
        </div>
        <div className="flex-1">
          {issueCount > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-[#EF5744]" />
              <span className="font-semibold text-white">{issueCount} issues found</span>
            </div>
          )}
          <p className="text-sm text-[#8b8b93] leading-relaxed mb-3">
            {issueCount > 0
              ? `${totalIssues.critical || 0} critical · ${totalIssues.high || 0} high · ${totalIssues.medium || 0} medium · ${totalIssues.low || 0} low`
              : 'Your digital presence looks solid. See the full report for recommendations.'}
          </p>
          {(totalKeywords != null || estimatedTraffic != null) && (
            <div className="flex gap-4">
              {totalKeywords != null && (
                <div>
                  <span className="text-lg font-bold text-white">{totalKeywords.toLocaleString()}</span>
                  <span className="text-xs text-[#8b8b93] ml-1">ranked keywords</span>
                </div>
              )}
              {estimatedTraffic != null && (
                <div>
                  <span className="text-lg font-bold text-white">{estimatedTraffic.toLocaleString()}</span>
                  <span className="text-xs text-[#8b8b93] ml-1">est. monthly visits</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category scores */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b8b93] uppercase tracking-widest mb-4">Performance Scores</h3>
        <div className="grid grid-cols-4 gap-3">
          {categories.map(({ key, label }) => {
            const score = scores[key] ?? null;
            return (
              <div key={key} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
                <div className={`text-2xl font-black mb-1 ${scoreColor(score)}`}>
                  {score != null ? score : '—'}
                </div>
                <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score || 0}%`, background: scoreBarColor(score) }}
                  />
                </div>
                <div className="text-xs text-[#8b8b93] leading-tight">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyword opportunities */}
      {topOpportunities.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#8b8b93] uppercase tracking-widest mb-4">Keyword Opportunities</h3>
          <div className="space-y-2">
            {topOpportunities.slice(0, 5).map((opp, i) => (
              <div key={i} className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-lg px-4 py-3">
                <span className="text-sm text-white">{opp.keyword}</span>
                <div className="flex items-center gap-4 text-xs text-[#8b8b93]">
                  <span>{opp.volume?.toLocaleString()} searches/mo</span>
                  <span className={opp.difficulty < 30 ? 'text-emerald-400' : opp.difficulty < 60 ? 'text-yellow-400' : 'text-red-400'}>
                    {opp.difficulty < 30 ? 'Low' : opp.difficulty < 60 ? 'Medium' : 'High'} competition
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {topCompetitors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#8b8b93] uppercase tracking-widest mb-4">Competitor Snapshot</h3>
          <div className="space-y-2">
            {topCompetitors.slice(0, 3).map(c => (
              <div key={c.domain} className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-lg px-4 py-3">
                <span className="text-sm text-white">{c.domain}</span>
                <div className="flex items-center gap-4 text-xs text-[#8b8b93]">
                  {c.keywords > 0 && <span>{c.keywords.toLocaleString()} keywords</span>}
                  {c.overlap > 0 && <span>{c.overlap} shared</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href={`/scan/${auditId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#EF5744] hover:bg-[#c93a2a] text-white font-bold px-5 py-3 rounded-lg transition-colors"
        >
          View Full Report <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="https://dalyadvertising.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 border border-[#2a2a2a] hover:border-[#EF5744] text-white font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Talk to an Expert <ChevronRight className="h-4 w-4" />
        </a>
      </div>

      <p className="text-center text-xs text-[#555] pb-4">
        PulseCheck by{' '}
        <a href="https://dalyadvertising.com" className="text-[#EF5744] hover:underline" target="_blank" rel="noopener noreferrer">
          Daly Advertising
        </a>
      </p>
    </div>
  );
}
