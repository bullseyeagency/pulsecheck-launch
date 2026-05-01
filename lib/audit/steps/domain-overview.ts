// lib/audit/steps/domain-overview.ts
import { dataForSEOPost } from "./shared";

export async function runDomainOverview(domain: string) {
  const [overview, backlinks] = await Promise.allSettled([
    dataForSEOPost("/dataforseo_labs/google/domain_rank_overview/live", [
      { target: domain },
    ]),
    dataForSEOPost("/backlinks/summary/live", [{ target: domain }]),
  ]);

  const overviewData = overview.status === "fulfilled" ? overview.value : null;
  const backlinksData = backlinks.status === "fulfilled" ? backlinks.value : null;

  return {
    overview: overviewData,
    backlinks: backlinksData,
    ...((backlinksData as Record<string, unknown>) || {}),
  };
}
