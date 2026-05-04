// lib/audit/steps/tiktok-ads.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface TikTokAdsResult {
  running: boolean;
  ad_count: number;
  top_reach: string | null;
  sample_video: string | null;
}

function advertiserMatchesBrand(advertiser: string, brandName: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normAdvertiser = norm(advertiser);
  const normBrand = norm(brandName);
  // Require the full concatenated brand name to appear in the advertiser username
  // e.g. "hometherapist" must appear in advertiser — prevents "therapist" alone from matching
  return normBrand.length >= 4 && normAdvertiser.includes(normBrand);
}

export async function runTikTokAds(
  businessName: string
): Promise<TikTokAdsResult> {
  try {
    const result = await searchSerpAPI({
      engine: "tiktok_ads_library",
      q: businessName,
      sort_by: "unique_users_seen_high_to_low",
    });

    const ads: any[] = (result as any)?.ads || [];
    // Only count ads where the advertiser name actually matches the brand
    const matched = ads.filter((ad) =>
      advertiserMatchesBrand(ad.advertiser || ad.advertiser_name || "", businessName)
    );

    if (matched.length === 0) {
      return { running: false, ad_count: 0, top_reach: null, sample_video: null };
    }

    return {
      running: true,
      ad_count: matched.length,
      top_reach: matched[0]?.estimated_audience ?? null,
      sample_video: matched[0]?.video_link ?? null,
    };
  } catch {
    return { running: false, ad_count: 0, top_reach: null, sample_video: null };
  }
}
