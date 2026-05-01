// lib/audit/steps/keywords.ts
import { dataForSEOPostRaw } from "./shared";

export interface KeywordVolumeItem {
  keyword: string;
  search_volume: number;
  competition: string | null;
  competition_index: number | null;
  cpc: number | null;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
}

export interface KeywordsResult {
  items: KeywordVolumeItem[];
  topKeywords: string[];
}

export async function runKeywords(seeds: string[]): Promise<KeywordsResult> {
  if (seeds.length === 0) {
    return { items: [], topKeywords: [] };
  }

  const keywords = seeds.slice(0, 50);

  const raw = await dataForSEOPostRaw(
    "/keywords_data/google_ads/search_volume/live",
    [{ keywords, location_code: 2840, language_code: "en" }]
  );

  const items: KeywordVolumeItem[] = (raw as any[])
    .filter((k: any) => k.search_volume != null)
    .map((k: any) => ({
      keyword: k.keyword,
      search_volume: k.search_volume,
      competition: k.competition ?? null,
      competition_index: k.competition_index ?? null,
      cpc: k.cpc ?? null,
      low_top_of_page_bid: k.low_top_of_page_bid ?? null,
      high_top_of_page_bid: k.high_top_of_page_bid ?? null,
    }))
    .sort((a, b) => b.search_volume - a.search_volume);

  return {
    items,
    topKeywords: items.slice(0, 10).map((k) => k.keyword),
  };
}
