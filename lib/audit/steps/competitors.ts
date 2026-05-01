// lib/audit/steps/competitors.ts
import { dataForSEOPost, isNonCompetitor } from "./shared";

export interface CompetitorItem {
  domain: string;
  avg_position: number;
  intersections: number;
  etv: number;
}

export interface CompetitorsResult {
  competitors: CompetitorItem[];
  competitorDomains: string[];
}

export async function runCompetitors(
  seeds: string[],
  ownDomain: string
): Promise<CompetitorsResult> {
  if (seeds.length === 0) {
    return { competitors: [], competitorDomains: [] };
  }

  const keywords = seeds.slice(0, 10);

  const result = await dataForSEOPost(
    "/dataforseo_labs/google/serp_competitors/live",
    [{ keywords, location_code: 2840, language_code: "en" }]
  );

  const items: any[] = (result as any)?.items || [];
  const ownDomainClean = ownDomain.replace(/^www\./, "");

  const filtered = items
    .filter((item: any) => {
      const d = (item.domain || "").replace(/^www\./, "");
      return d && d !== ownDomainClean && !isNonCompetitor(d);
    })
    .sort((a: any, b: any) => (b.intersections || 0) - (a.intersections || 0))
    .slice(0, 5);

  return {
    competitors: filtered.map((item: any) => ({
      domain: (item.domain || "").replace(/^www\./, ""),
      avg_position: item.avg_position || 0,
      intersections: item.intersections || 0,
      etv: item.full_domain_metrics?.organic?.etv || 0,
    })),
    competitorDomains: filtered.map((item: any) =>
      (item.domain || "").replace(/^www\./, "")
    ),
  };
}
