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

  // Step 1: find advertiser_id by business name, validating against domain
  let advertiserId: string | null = null;
  let advertiserAdsCount = 0;
  try {
    const searchResult = await searchSerpAPI({
      engine: "google_ads_transparency_center_advertiser_search",
      q: businessName,
    });
    const advertisers: any[] = (searchResult as any)?.advertisers || [];
    const domainClean = domain.replace(/^www\./, "").replace(/\.(com|net|org|io|co|us)$/, "").toLowerCase();
    // Prefer an advertiser whose name or domains overlap with ours
    const matched = advertisers.find((a: any) => {
      const aName = (a.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const aDomains: string[] = a.domains || [];
      return (
        aName.includes(domainClean.replace(/\s/g, "")) ||
        domainClean.replace(/\s/g, "").includes(aName.slice(0, 6)) ||
        aDomains.some((d: string) => d.includes(domain) || domain.includes(d.replace(/^www\./, "")))
      );
    });
    const best = matched ?? advertisers[0] ?? null;
    advertiserId = best?.id ?? null;
    advertiserAdsCount = best?.ads_count?.lower || best?.ads_count?.upper || 0;
  } catch {
    // fall through to domain fallback
  }

  // Step 2: pull creatives by advertiser_id, then domain fallback
  let creativesResult: any = null;
  try {
    if (advertiserId) {
      creativesResult = await searchSerpAPI({
        engine: "google_ads_transparency_center",
        advertiser_id: advertiserId,
        num: 100,
      });
    }
    // Also try domain if advertiser_id returned nothing
    if (!creativesResult?.ads?.length) {
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
  // If creatives API returns nothing but advertiser search confirmed ads exist, trust the count
  if (ads.length === 0) {
    if (advertiserAdsCount > 0 && advertiserId) {
      return {
        running: true,
        advertiser_id: advertiserId,
        creative_count: advertiserAdsCount,
        longest_running_days: 0,
        formats: [],
        sample_headlines: [],
      };
    }
    return empty;
  }

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
