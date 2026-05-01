// lib/audit/steps/google-ads.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface GoogleAdsResult {
  running: boolean;
  advertiser_id: string | null;
  creative_count: number;
  longest_running_days: number;
  formats: string[];
  sample_headlines: string[];
}

export async function runGoogleAds(
  businessName: string,
  domain: string
): Promise<GoogleAdsResult> {
  const empty: GoogleAdsResult = {
    running: false,
    advertiser_id: null,
    creative_count: 0,
    longest_running_days: 0,
    formats: [],
    sample_headlines: [],
  };

  // Step 1: find advertiser_id by business name
  let advertiserId: string | null = null;
  try {
    const searchResult = await searchSerpAPI({
      engine: "google_ads_transparency_center_advertiser_search",
      q: businessName,
    });
    advertiserId = (searchResult as any)?.advertisers?.[0]?.id ?? null;
  } catch {
    // fall through to domain fallback
  }

  // Step 2: pull creatives by advertiser_id, or fall back to domain
  let creativesResult: any = null;
  try {
    if (advertiserId) {
      creativesResult = await searchSerpAPI({
        engine: "google_ads_transparency_center",
        advertiser_id: advertiserId,
        num: 100,
      });
    } else {
      creativesResult = await searchSerpAPI({
        engine: "google_ads_transparency_center",
        domain,
        num: 100,
      });
    }
  } catch {
    return empty;
  }

  const ads: any[] = creativesResult?.ads || [];
  if (ads.length === 0) return empty;

  const formats = [...new Set(ads.map((a: any) => a.format).filter(Boolean))] as string[];
  const longestRunning = Math.max(...ads.map((a: any) => a.total_days_shown || 0));
  const sampleHeadlines = ads
    .slice(0, 3)
    .map((a: any) => a.title || a.headline || "")
    .filter(Boolean) as string[];

  return {
    running: true,
    advertiser_id: advertiserId,
    creative_count: ads.length,
    longest_running_days: longestRunning,
    formats,
    sample_headlines: sampleHeadlines,
  };
}
