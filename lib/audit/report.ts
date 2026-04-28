import { CrawlData, Issue, Recommendation, Report } from "./types";

/**
 * Compiles all audit data into a structured report summary.
 */
export function compileReport(
  crawlData: CrawlData,
  issues: Issue[],
  recommendations: Recommendation[],
  pageSpeedData?: Record<string, unknown>,
  keywordData?: Record<string, unknown>,
  rankingsData?: Record<string, unknown>,
  backlinksData?: Record<string, unknown>,
  serpData?: Record<string, unknown>,
  competitorData?: Record<string, unknown>
): Report {
  const scores = extractScores(pageSpeedData);
  const totalIssues = countIssues(issues);
  const overallGrade = calculateGrade(scores, totalIssues);
  const totalKeywords = extractTotalKeywords(rankingsData);
  const estimatedTraffic = extractEstimatedTraffic(rankingsData);
  const topOpportunities = extractTopOpportunities(keywordData);
  const topCompetitors = extractTopCompetitors(competitorData);

  return {
    overallGrade,
    scores,
    totalKeywords,
    estimatedTraffic,
    totalIssues,
    topOpportunities,
    topCompetitors,
  };
}

function extractScores(
  pageSpeedData?: Record<string, unknown>
): Report["scores"] {
  const defaults = {
    pagespeedMobile: 0,
    pagespeedDesktop: 0,
    seo: 0,
    accessibility: 0,
  };

  if (!pageSpeedData) return defaults;

  const mobile = pageSpeedData.mobile as Record<string, unknown> | undefined;
  const desktop = pageSpeedData.desktop as Record<string, unknown> | undefined;

  return {
    pagespeedMobile: extractCategoryScore(mobile, "performance"),
    pagespeedDesktop: extractCategoryScore(desktop, "performance"),
    seo:
      extractCategoryScore(mobile, "seo") ||
      extractCategoryScore(desktop, "seo"),
    accessibility:
      extractCategoryScore(mobile, "accessibility") ||
      extractCategoryScore(desktop, "accessibility"),
  };
}

function extractCategoryScore(
  data?: Record<string, unknown>,
  category?: string
): number {
  if (!data || !category) return 0;
  // Google PSI direct response
  const lhr = data.lighthouseResult as Record<string, unknown> | undefined;
  const lhrCategories = lhr?.categories as Record<string, { score?: number }> | undefined;
  if (lhrCategories?.[category]?.score !== undefined) {
    return Math.round(lhrCategories[category].score! * 100);
  }
  // DataForSEO-wrapped response
  const categories = data.categories as Record<string, { score?: number }> | undefined;
  if (categories?.[category]?.score !== undefined) {
    return Math.round(categories[category].score! * 100);
  }
  return 0;
}

function countIssues(issues: Issue[]): Report["totalIssues"] {
  return {
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };
}

function calculateGrade(
  scores: Report["scores"],
  totalIssues: Report["totalIssues"]
): string {
  const speedAvg = (scores.pagespeedMobile + scores.pagespeedDesktop) / 2;

  const issuesPenalty =
    totalIssues.critical * 15 +
    totalIssues.high * 8 +
    totalIssues.medium * 3 +
    totalIssues.low * 1;

  const seoScore = scores.seo || 50;

  const composite =
    speedAvg * 0.3 + seoScore * 0.3 + Math.max(0, 100 - issuesPenalty) * 0.4;

  if (composite >= 90) return "A";
  if (composite >= 80) return "B";
  if (composite >= 70) return "C";
  if (composite >= 50) return "D";
  return "F";
}

function extractTotalKeywords(
  rankingsData?: Record<string, unknown>
): number {
  if (!rankingsData) return 0;
  const items = rankingsData.items as unknown[] | undefined;
  if (Array.isArray(items)) return items.length;
  const total = rankingsData.total_count as number | undefined;
  return total || 0;
}

function extractEstimatedTraffic(
  rankingsData?: Record<string, unknown>
): number {
  if (!rankingsData) return 0;
  const metrics = rankingsData.metrics as
    | Record<string, Record<string, number>>
    | undefined;
  if (metrics) {
    let total = 0;
    for (const pos of Object.values(metrics)) {
      if (pos) total += pos.etv || 0;
    }
    return Math.round(total);
  }
  const items = rankingsData.items as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(items)) {
    return Math.round(
      items.reduce((sum, item) => {
        const kd = item.keyword_data as Record<string, unknown> | undefined;
        return sum + ((kd?.etv as number) || 0);
      }, 0)
    );
  }
  return 0;
}

function extractTopOpportunities(
  keywordData?: Record<string, unknown>
): Report["topOpportunities"] {
  if (!keywordData) return [];
  const items = keywordData.items as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => {
      const vol = (item.search_volume as number) || 0;
      return vol > 0;
    })
    .sort((a, b) => {
      const volA = (a.search_volume as number) || 0;
      const volB = (b.search_volume as number) || 0;
      return volB - volA;
    })
    .slice(0, 10)
    .map((item) => {
      const volume = (item.search_volume as number) || 0;
      const ci = (item.competition_index as number) || 50;
      return {
        keyword: (item.keyword as string) || "",
        volume,
        difficulty: ci,
        opportunity: Math.round(volume * (1 - ci / 100)),
      };
    });
}

function extractTopCompetitors(
  competitorData?: Record<string, unknown>
): Report["topCompetitors"] {
  if (!competitorData) return [];
  const competitors = competitorData.competitors as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(competitors)) return [];

  return competitors.slice(0, 5).map((c) => ({
    domain: (c.domain as string) || "",
    keywords: (c.keywords as number) || 0,
    traffic: (c.traffic as number) || 0,
    overlap: (c.overlap as number) || 0,
  }));
}
