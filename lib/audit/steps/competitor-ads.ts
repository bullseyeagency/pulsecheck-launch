// lib/audit/steps/competitor-ads.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface CompetitorAdProfile {
  domain: string;
  googleAds: { running: boolean; creative_count: number };
  metaAds: { running: boolean; ad_count: number };
}

export type CompetitorAdsResult = Record<string, CompetitorAdProfile>;

function domainToBrandName(domain: string): string {
  return domain
    .replace(/\.(com|net|org|io|co|us)$/, "")
    .replace(/[-_]/g, " ")
    .trim();
}

async function getGoogleAds(domain: string): Promise<{ running: boolean; creative_count: number }> {
  try {
    const result = await searchSerpAPI({
      engine: "google_ads_transparency_center",
      domain,
      num: 20,
    });
    const count = (result as any)?.ads?.length || 0;
    return { running: count > 0, creative_count: count };
  } catch {
    return { running: false, creative_count: 0 };
  }
}

async function getMetaAds(brandName: string): Promise<{ running: boolean; ad_count: number }> {
  try {
    const pageSearch = await searchSerpAPI({
      engine: "meta_ad_library_page_search",
      q: brandName,
    });
    const pageId = (pageSearch as any)?.page_results?.[0]?.page_id ?? null;

    let adsResult: any;
    if (pageId) {
      adsResult = await searchSerpAPI({
        engine: "meta_ad_library",
        page_id: pageId,
        country: "US",
      });
    } else {
      adsResult = await searchSerpAPI({
        engine: "meta_ad_library",
        q: brandName,
        country: "US",
      });
    }

    const count = adsResult?.ads?.length || 0;
    return { running: count > 0, ad_count: count };
  } catch {
    return { running: false, ad_count: 0 };
  }
}

export async function runCompetitorAds(
  competitorDomains: string[]
): Promise<CompetitorAdsResult> {
  const domains = competitorDomains.slice(0, 5);
  const output: CompetitorAdsResult = {};

  await Promise.allSettled(
    domains.map(async (domain) => {
      const brandName = domainToBrandName(domain);

      const [googleAds, metaAds] = await Promise.allSettled([
        getGoogleAds(domain),
        getMetaAds(brandName),
      ]);

      output[domain] = {
        domain,
        googleAds: googleAds.status === "fulfilled" ? googleAds.value : { running: false, creative_count: 0 },
        metaAds: metaAds.status === "fulfilled" ? metaAds.value : { running: false, ad_count: 0 },
      };
    })
  );

  return output;
}
