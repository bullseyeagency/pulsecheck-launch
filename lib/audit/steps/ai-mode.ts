// lib/audit/steps/ai-mode.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface AIModeQueryResult {
  query: string;
  clientCited: boolean;
  citedDomains: string[];
  snippet: string;
}

export interface AIModeResult {
  queries: AIModeQueryResult[];
}

export async function runAIMode(
  topKeywords: string[],
  domain: string,
  location: string
): Promise<AIModeResult> {
  const domainClean = domain.replace(/^www\./, "");

  const queries = [
    topKeywords[0] ? `${topKeywords[0]} ${location}` : null,
    topKeywords[1] ? `best ${topKeywords[1]}` : null,
    topKeywords[2] ? `${topKeywords[2]} near me` : null,
  ]
    .filter((q): q is string => q !== null)
    .slice(0, 3);

  if (queries.length === 0) {
    return { queries: [] };
  }

  const results = await Promise.allSettled(
    queries.map((q) => searchSerpAPI({ engine: "google_ai_mode", q }))
  );

  return {
    queries: results.map((result, i) => {
      const query = queries[i];
      if (result.status !== "fulfilled") {
        return { query, clientCited: false, citedDomains: [], snippet: "" };
      }

      const data = result.value as any;
      const referenceLinks: any[] = data.reference_links || [];

      const citedDomains = referenceLinks
        .map((r: any) => {
          try {
            return new URL(r.link).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })
        .filter(Boolean);

      const clientCited = citedDomains.includes(domainClean);
      const snippet = (data.markdown || "").slice(0, 400);

      return { query, clientCited, citedDomains, snippet };
    }),
  };
}
