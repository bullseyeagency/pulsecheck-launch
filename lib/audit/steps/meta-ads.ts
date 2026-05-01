// lib/audit/steps/meta-ads.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface MetaAdsResult {
  running: boolean;
  page_id: string | null;
  ad_count: number;
  platforms: string[];
  sample: {
    headline: string | null;
    cta: string | null;
    format: string | null;
  };
}

export async function runMetaAds(
  businessName: string,
  _domain: string
): Promise<MetaAdsResult> {
  const empty: MetaAdsResult = {
    running: false,
    page_id: null,
    ad_count: 0,
    platforms: [],
    sample: { headline: null, cta: null, format: null },
  };

  // Step 1: find page_id via page search
  let pageId: string | null = null;
  try {
    const pageSearch = await searchSerpAPI({
      engine: "meta_ad_library_page_search",
      q: businessName,
    });
    pageId = (pageSearch as any)?.page_results?.[0]?.page_id ?? null;
  } catch {
    // fall through to keyword fallback
  }

  // Step 2: pull ads by page_id, or keyword fallback
  let adsResult: any = null;
  try {
    if (pageId) {
      adsResult = await searchSerpAPI({
        engine: "meta_ad_library",
        page_id: pageId,
        country: "US",
        sort_by: "impressions_high_to_low",
      });
    } else {
      adsResult = await searchSerpAPI({
        engine: "meta_ad_library",
        q: businessName,
        country: "US",
      });
    }
  } catch {
    return empty;
  }

  const ads: any[] = adsResult?.ads || [];
  if (ads.length === 0) return empty;

  const platforms = [
    ...new Set(ads.flatMap((a: any) => a.publisher_platform || [])),
  ] as string[];
  const first = ads[0];

  return {
    running: true,
    page_id: pageId,
    ad_count: ads.length,
    platforms,
    sample: {
      headline: first?.snapshot?.title ?? first?.ad_creative_bodies?.[0] ?? null,
      cta: first?.snapshot?.cta_text ?? null,
      format: first?.snapshot?.display_format ?? null,
    },
  };
}
