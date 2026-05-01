// lib/audit/steps/tiktok-ads.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface TikTokAdsResult {
  running: boolean;
  ad_count: number;
  top_reach: string | null;
  sample_video: string | null;
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
    if (ads.length === 0) {
      return { running: false, ad_count: 0, top_reach: null, sample_video: null };
    }

    return {
      running: true,
      ad_count: ads.length,
      top_reach: ads[0]?.estimated_audience ?? null,
      sample_video: ads[0]?.video_link ?? null,
    };
  } catch {
    return { running: false, ad_count: 0, top_reach: null, sample_video: null };
  }
}
