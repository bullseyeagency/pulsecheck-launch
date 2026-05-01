// lib/audit/steps/rankings.ts
import { dataForSEOPost } from "./shared";

export async function runRankedKeywords(domain: string) {
  return dataForSEOPost(
    "/dataforseo_labs/google/ranked_keywords/live",
    [
      {
        target: domain,
        language_code: "en",
        location_code: 2840,
        limit: 100,
      },
    ]
  );
}
