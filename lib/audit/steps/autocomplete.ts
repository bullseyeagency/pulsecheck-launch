// lib/audit/steps/autocomplete.ts
import { searchSerpAPI } from "@/lib/serpapi";
import { CrawlData } from "@/lib/audit/types";

export async function runAutocomplete(
  industry: string,
  location: string,
  crawlData: CrawlData
): Promise<{ seeds: string[]; queries: string[] }> {
  const h1 = (crawlData as any)?.headings?.find((h: any) => h.level === 1)?.text || "";

  const queries = [
    `${industry} ${location}`,
    `${industry} near me`,
    `${industry} repair ${location}`,
    `best ${industry} ${location}`,
    ...(h1 ? [h1.split(" ").slice(0, 3).join(" ")] : []),
  ].filter((q) => q.length > 3).slice(0, 6);

  const results = await Promise.allSettled(
    queries.map((q) =>
      searchSerpAPI({
        engine: "google_autocomplete",
        q,
        gl: "us",
        hl: "en",
      })
    )
  );

  // Extract state abbreviation from location (e.g. "Tampa, FL" → "fl")
  const stateMatch = location.match(/,\s*([A-Z]{2})$/i);
  const clientState = stateMatch ? stateMatch[1].toLowerCase() : null;
  const US_STATES = ["al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia","ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj","nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt","va","wa","wv","wi","wy"];

  function isWrongLocation(seed: string): boolean {
    if (!clientState) return false;
    const lower = seed.toLowerCase();
    // If seed contains another US state abbreviation as a word, it's from a different market
    return US_STATES.some((st) => st !== clientState && new RegExp(`\\b${st}\\b`).test(lower));
  }

  const seeds: string[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const suggestions: any[] = (result.value as any)?.suggestions || [];
    for (const s of suggestions) {
      const val = (s.value as string || "").trim();
      if (val && !seen.has(val) && !isWrongLocation(val)) {
        seen.add(val);
        seeds.push(val);
      }
    }
  }

  return { seeds: seeds.slice(0, 40), queries };
}
