import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const audit = await prisma.audit.findUnique({
      where: { id },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    const html = buildHtmlReport(audit);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${audit.domain}-seo-audit-${dateStr}.html`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to export audit";
    console.error("[audit/[id]/export/html]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- HTML Report Builder ---

interface AuditRecord {
  id: string;
  url: string;
  domain: string;
  industry: string;
  location: string;
  status: string;
  crawlData: unknown;
  pageSpeedData: unknown;
  keywordData: unknown;
  rankingsData: unknown;
  backlinksData: unknown;
  serpData: unknown;
  adsData: unknown;
  competitorData: unknown;
  report: unknown;
  createdAt: Date;
}

function buildHtmlReport(audit: AuditRecord): string {
  const report = (audit.report || {}) as Record<string, unknown>;
  const crawl = (audit.crawlData || {}) as Record<string, unknown>;
  const issues = (report.issues || []) as Array<Record<string, unknown>>;
  const recommendations = (report.recommendations || []) as Array<
    Record<string, unknown>
  >;
  const scores = (report.scores || {}) as Record<string, number>;
  const totalIssues = (report.totalIssues || {}) as Record<string, number>;
  const topOpportunities = (report.topOpportunities || []) as Array<
    Record<string, unknown>
  >;
  const topCompetitors = (report.topCompetitors || []) as Array<
    Record<string, unknown>
  >;
  const keywords = (audit.keywordData as Record<string, unknown>) || {};
  const rankings = (audit.rankingsData as Record<string, unknown>) || {};
  const backlinks = (audit.backlinksData as Record<string, unknown>) || {};
  const dateStr = audit.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SEO Audit: ${esc(audit.domain)} | Daly Advertising</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0a; --surface: #141414; --surface2: #1e1e1e;
    --border: #2a2a2a; --text: #e0e0e0; --text-dim: #888;
    --accent: #EF5744; --accent-hover: #d94a39;
    --green: #22c55e; --yellow: #eab308; --orange: #f97316; --red: #ef4444;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Layout */
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 260px; position: sticky; top: 0; height: 100vh; overflow-y: auto; background: var(--surface); border-right: 1px solid var(--border); padding: 24px 16px; flex-shrink: 0; }
  .sidebar h2 { font-size: 14px; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .sidebar ul { list-style: none; }
  .sidebar li { margin-bottom: 4px; }
  .sidebar a { display: block; padding: 8px 12px; border-radius: 6px; color: var(--text-dim); font-size: 13px; transition: all 0.2s; }
  .sidebar a:hover, .sidebar a.active { background: var(--surface2); color: var(--text); text-decoration: none; }
  .main { flex: 1; padding: 40px; max-width: 1200px; }

  /* Sections */
  section { margin-bottom: 48px; }
  section h2 { font-size: 22px; font-weight: 700; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid var(--accent); }
  section h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; }

  /* Header */
  .header { margin-bottom: 40px; }
  .header h1 { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
  .header .meta { color: var(--text-dim); font-size: 14px; }

  /* Score Cards */
  .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .score-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; text-align: center; }
  .score-card .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 8px; }
  .score-card .value { font-size: 48px; font-weight: 800; }
  .score-card .value.grade { color: var(--accent); }

  /* Grade colors */
  .grade-a { color: var(--green) !important; }
  .grade-b { color: var(--green) !important; }
  .grade-c { color: var(--yellow) !important; }
  .grade-d { color: var(--orange) !important; }
  .grade-f { color: var(--red) !important; }

  /* Score colors */
  .score-high { color: var(--green); }
  .score-mid { color: var(--yellow); }
  .score-low { color: var(--red); }

  /* Tables */
  table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
  thead { background: var(--surface2); }
  th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); cursor: pointer; user-select: none; white-space: nowrap; }
  th:hover { color: var(--text); }
  th::after { content: ' \\2195'; font-size: 10px; }
  td { padding: 10px 16px; border-top: 1px solid var(--border); font-size: 14px; }
  tr:hover td { background: var(--surface2); }

  /* Badges */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-critical { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge-high { background: rgba(249,115,22,0.15); color: var(--orange); }
  .badge-medium { background: rgba(234,179,8,0.15); color: var(--yellow); }
  .badge-low { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge-p0 { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge-p1 { background: rgba(249,115,22,0.15); color: var(--orange); }
  .badge-p2 { background: rgba(234,179,8,0.15); color: var(--yellow); }
  .badge-p3 { background: rgba(34,197,94,0.15); color: var(--green); }

  /* Issue cards */
  .issue-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .issue-card .issue-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .issue-card .issue-title { font-weight: 600; }
  .issue-card .issue-desc { color: var(--text-dim); font-size: 14px; }
  .issue-card .issue-category { font-size: 12px; color: var(--text-dim); }

  /* Tech list */
  .tech-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .tech-tag { background: var(--surface2); border: 1px solid var(--border); padding: 4px 12px; border-radius: 16px; font-size: 13px; }

  /* Footer */
  .footer { margin-top: 60px; padding: 24px 0; border-top: 1px solid var(--border); text-align: center; color: var(--text-dim); font-size: 13px; }

  /* Summary stat */
  .stat-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; min-width: 140px; }
  .stat .stat-label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }

  @media print {
    .sidebar { display: none; }
    .main { padding: 20px; max-width: 100%; }
    body { background: white; color: #111; }
    table, .score-card, .issue-card, .stat { border-color: #ddd; background: #f9f9f9; }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { padding: 20px; }
    .score-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
<div class="layout">
  <nav class="sidebar">
    <h2>Sections</h2>
    <ul>
      <li><a href="#executive-summary">Executive Summary</a></li>
      <li><a href="#pagespeed">PageSpeed Scores</a></li>
      <li><a href="#on-page">On-Page SEO</a></li>
      <li><a href="#issues">Issues Found</a></li>
      <li><a href="#recommendations">Recommendations</a></li>
      <li><a href="#keywords">Keyword Opportunities</a></li>
      <li><a href="#rankings">Current Rankings</a></li>
      <li><a href="#backlinks">Backlinks</a></li>
      <li><a href="#competitors">Competitors</a></li>
      <li><a href="#technical">Technical Details</a></li>
    </ul>
  </nav>

  <div class="main">
    <div class="header">
      <h1>SEO Audit Report</h1>
      <p class="meta">${esc(audit.domain)} &middot; ${esc(audit.industry)} &middot; ${esc(audit.location)} &middot; ${dateStr}</p>
    </div>

    <!-- Executive Summary -->
    <section id="executive-summary">
      <h2>Executive Summary</h2>
      <div class="score-grid">
        <div class="score-card">
          <div class="label">Overall Grade</div>
          <div class="value grade grade-${(report.overallGrade as string || "F").toLowerCase()}">${esc(report.overallGrade as string || "N/A")}</div>
        </div>
        <div class="score-card">
          <div class="label">Mobile Speed</div>
          <div class="value ${scoreClass(scores.pagespeedMobile)}">${scores.pagespeedMobile || 0}</div>
        </div>
        <div class="score-card">
          <div class="label">Desktop Speed</div>
          <div class="value ${scoreClass(scores.pagespeedDesktop)}">${scores.pagespeedDesktop || 0}</div>
        </div>
        <div class="score-card">
          <div class="label">SEO Score</div>
          <div class="value ${scoreClass(scores.seo)}">${scores.seo || 0}</div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">Total Issues</div>
          <div class="stat-value">${(totalIssues.critical || 0) + (totalIssues.high || 0) + (totalIssues.medium || 0) + (totalIssues.low || 0)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Critical</div>
          <div class="stat-value" style="color:var(--red)">${totalIssues.critical || 0}</div>
        </div>
        <div class="stat">
          <div class="stat-label">High</div>
          <div class="stat-value" style="color:var(--orange)">${totalIssues.high || 0}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Keywords Ranked</div>
          <div class="stat-value">${report.totalKeywords || 0}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Est. Traffic</div>
          <div class="stat-value">${formatNumber(report.estimatedTraffic as number || 0)}</div>
        </div>
      </div>
    </section>

    <!-- PageSpeed -->
    <section id="pagespeed">
      <h2>PageSpeed Scores</h2>
      <div class="score-grid">
        <div class="score-card">
          <div class="label">Mobile Performance</div>
          <div class="value ${scoreClass(scores.pagespeedMobile)}">${scores.pagespeedMobile || 0}</div>
        </div>
        <div class="score-card">
          <div class="label">Desktop Performance</div>
          <div class="value ${scoreClass(scores.pagespeedDesktop)}">${scores.pagespeedDesktop || 0}</div>
        </div>
        <div class="score-card">
          <div class="label">SEO</div>
          <div class="value ${scoreClass(scores.seo)}">${scores.seo || 0}</div>
        </div>
        <div class="score-card">
          <div class="label">Accessibility</div>
          <div class="value ${scoreClass(scores.accessibility)}">${scores.accessibility || 0}</div>
        </div>
      </div>
    </section>

    <!-- On-Page SEO -->
    <section id="on-page">
      <h2>On-Page SEO</h2>
      <table>
        <thead><tr><th>Element</th><th>Value</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Title</td><td>${esc(crawl.title as string || "N/A")}</td><td>${crawl.title ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-critical">Missing</span>'}</td></tr>
          <tr><td>Meta Description</td><td>${esc(truncate(crawl.metaDescription as string || "N/A", 100))}</td><td>${crawl.metaDescription ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-critical">Missing</span>'}</td></tr>
          <tr><td>Canonical</td><td>${esc(crawl.canonical as string || "N/A")}</td><td>${crawl.canonical ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-high">Missing</span>'}</td></tr>
          <tr><td>H1 Count</td><td>${(crawl.headingCounts as Record<string, number>)?.h1 || 0}</td><td>${(crawl.headingCounts as Record<string, number>)?.h1 === 1 ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-medium">Check</span>'}</td></tr>
          <tr><td>Schema (JSON-LD)</td><td>${(crawl.jsonLd as unknown[])?.length || 0} found</td><td>${(crawl.jsonLd as unknown[])?.length ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-high">Missing</span>'}</td></tr>
          <tr><td>Word Count</td><td>${crawl.wordCount || 0}</td><td>${(crawl.wordCount as number) >= 300 ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-high">Thin</span>'}</td></tr>
          <tr><td>robots.txt</td><td>${crawl.robotsTxt ? 'Found' : 'Not found'}</td><td>${crawl.robotsTxt ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-medium">Missing</span>'}</td></tr>
          <tr><td>Sitemap</td><td>${crawl.sitemapXml ? 'Found' : 'Not found'}</td><td>${crawl.sitemapXml ? '<span class="badge badge-low">OK</span>' : '<span class="badge badge-high">Missing</span>'}</td></tr>
        </tbody>
      </table>
      ${(crawl.technologies as string[])?.length ? `
      <h3>Detected Technologies</h3>
      <div class="tech-list">${(crawl.technologies as string[]).map((t: string) => `<span class="tech-tag">${esc(t)}</span>`).join("")}</div>
      ` : ""}
    </section>

    <!-- Issues -->
    <section id="issues">
      <h2>Issues Found (${issues.length})</h2>
      ${issues.length === 0 ? "<p>No issues detected.</p>" : issues.map((i) => `
      <div class="issue-card">
        <div class="issue-header">
          <span class="badge badge-${i.severity}">${esc(i.severity as string)}</span>
          <span class="issue-title">${esc(i.title as string)}</span>
          <span class="issue-category">${esc(i.category as string)}</span>
        </div>
        <div class="issue-desc">${esc(i.description as string)}</div>
      </div>`).join("")}
    </section>

    <!-- Recommendations -->
    <section id="recommendations">
      <h2>Recommendations (${recommendations.length})</h2>
      ${recommendations.length === 0 ? "<p>No recommendations.</p>" : `
      <table>
        <thead><tr><th>Priority</th><th>Category</th><th>Action</th><th>Impact</th></tr></thead>
        <tbody>
          ${recommendations.map((r) => `
          <tr>
            <td><span class="badge badge-${(r.priority as string).toLowerCase()}">${esc(r.priority as string)}</span></td>
            <td>${esc(r.category as string)}</td>
            <td><strong>${esc(r.title as string)}</strong><br><span style="color:var(--text-dim);font-size:13px">${esc(r.description as string)}</span></td>
            <td style="font-size:13px">${esc(r.impact as string)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
    </section>

    <!-- Keywords -->
    <section id="keywords">
      <h2>Keyword Opportunities</h2>
      ${topOpportunities.length === 0 ? "<p>No keyword data available.</p>" : `
      <table>
        <thead><tr><th>Keyword</th><th>Volume</th><th>Difficulty</th><th>Opportunity</th></tr></thead>
        <tbody>
          ${topOpportunities.map((k) => `
          <tr>
            <td>${esc(k.keyword as string)}</td>
            <td>${formatNumber(k.volume as number)}</td>
            <td>${k.difficulty}</td>
            <td>${formatNumber(k.opportunity as number)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
    </section>

    <!-- Rankings -->
    <section id="rankings">
      <h2>Current Rankings</h2>
      ${renderRankingsTable(rankings)}
    </section>

    <!-- Backlinks -->
    <section id="backlinks">
      <h2>Backlinks &amp; Authority</h2>
      ${renderBacklinksSection(backlinks)}
    </section>

    <!-- Competitors -->
    <section id="competitors">
      <h2>Competitor Landscape</h2>
      ${topCompetitors.length === 0 ? "<p>No competitor data available.</p>" : `
      <table>
        <thead><tr><th>Domain</th><th>Keywords</th><th>Est. Traffic</th></tr></thead>
        <tbody>
          ${topCompetitors.map((c) => `
          <tr>
            <td>${esc(c.domain as string)}</td>
            <td>${formatNumber(c.keywords as number)}</td>
            <td>${formatNumber(c.traffic as number)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
    </section>

    <!-- Technical -->
    <section id="technical">
      <h2>Technical Details</h2>
      <table>
        <thead><tr><th>Property</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>URL</td><td><a href="${esc(audit.url)}" target="_blank">${esc(audit.url)}</a></td></tr>
          <tr><td>Domain</td><td>${esc(audit.domain)}</td></tr>
          <tr><td>Industry</td><td>${esc(audit.industry)}</td></tr>
          <tr><td>Location</td><td>${esc(audit.location)}</td></tr>
          <tr><td>Audit Date</td><td>${dateStr}</td></tr>
          <tr><td>Internal Links</td><td>${(crawl.internalLinks as unknown[])?.length || 0}</td></tr>
          <tr><td>Images</td><td>${(crawl.images as unknown[])?.length || 0}</td></tr>
        </tbody>
      </table>
    </section>

    <div class="footer">
      Audit prepared by <strong>Daly Advertising</strong> &middot; <a href="https://dalyadvertising.com">dalyadvertising.com</a>
    </div>
  </div>
</div>

<script>
// Sortable tables
document.querySelectorAll('table').forEach(table => {
  const headers = table.querySelectorAll('th');
  headers.forEach((th, idx) => {
    let asc = true;
    th.addEventListener('click', () => {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aVal = a.children[idx]?.textContent?.trim() || '';
        const bVal = b.children[idx]?.textContent?.trim() || '';
        const aNum = parseFloat(aVal.replace(/,/g, ''));
        const bNum = parseFloat(bVal.replace(/,/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return asc ? aNum - bNum : bNum - aNum;
        }
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
      rows.forEach(row => tbody.appendChild(row));
      asc = !asc;
    });
  });
});

// Active sidebar link
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
      const link = document.querySelector('.sidebar a[href="#' + entry.target.id + '"]');
      if (link) link.classList.add('active');
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
</script>
</body>
</html>`;
}

// --- Template Helpers ---

function esc(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + "...";
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num || 0);
}

function scoreClass(score: number): string {
  if (score >= 90) return "score-high";
  if (score >= 50) return "score-mid";
  return "score-low";
}

function renderRankingsTable(rankings: Record<string, unknown>): string {
  const items = rankings.items as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(items) || items.length === 0) {
    return "<p>No ranking data available.</p>";
  }

  const rows = items.slice(0, 50).map((item) => {
    const kd = (item.keyword_data as Record<string, unknown>) || {};
    const ki = (kd.keyword_info as Record<string, unknown>) || {};
    const ri = (item.ranked_serp_element as Record<string, unknown>) || {};
    return `<tr>
      <td>${esc(kd.keyword as string || "")}</td>
      <td>${ri.serp_item as Record<string, unknown> ? (ri.serp_item as Record<string, unknown>).rank_group || "-" : "-"}</td>
      <td>${formatNumber(ki.search_volume as number || 0)}</td>
      <td>${esc(truncate(ri.serp_item as Record<string, unknown> ? ((ri.serp_item as Record<string, unknown>).url as string || "") : "", 60))}</td>
    </tr>`;
  });

  return `<table>
    <thead><tr><th>Keyword</th><th>Position</th><th>Volume</th><th>Ranking URL</th></tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table>`;
}

function renderBacklinksSection(backlinks: Record<string, unknown>): string {
  const bl = (backlinks.backlinks as Record<string, unknown>) || backlinks;
  if (!bl || Object.keys(bl).length === 0) {
    return "<p>No backlink data available.</p>";
  }

  return `<div class="stat-row">
    <div class="stat">
      <div class="stat-label">Total Backlinks</div>
      <div class="stat-value">${formatNumber(bl.backlinks as number || bl.backlinks_count as number || 0)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Referring Domains</div>
      <div class="stat-value">${formatNumber(bl.referring_domains as number || 0)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Domain Rank</div>
      <div class="stat-value">${bl.rank as number || bl.domain_rank as number || 0}</div>
    </div>
  </div>`;
}
