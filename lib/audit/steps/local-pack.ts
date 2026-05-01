// lib/audit/steps/local-pack.ts
import { searchSerpAPI } from "@/lib/serpapi";
import { CrawlData } from "@/lib/audit/types";

function parseReviews(val: unknown): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseInt(val.replace(/\D/g, ""), 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

export interface GBPData {
  found: boolean;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  categories: unknown;
  place_id: string | null;
}

export interface LocalPackEntry {
  position: number;
  title: string;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
}

export interface LocalPackResult {
  gbp: GBPData;
  localPack: Record<string, LocalPackEntry[]>;
  clientPackPosition: number | null;
}

export async function runLocalPack(
  businessName: string,
  industry: string,
  location: string,
  _crawlData: CrawlData
): Promise<LocalPackResult> {
  const [gbpResult, pack1Result, pack2Result] = await Promise.allSettled([
    searchSerpAPI({
      engine: "google_maps",
      q: `${businessName} ${location}`,
    }),
    searchSerpAPI({
      engine: "google_local",
      q: `${industry} ${location}`,
      location,
      gl: "us",
    }),
    searchSerpAPI({
      engine: "google_local",
      q: `${industry} near me`,
      location,
      gl: "us",
    }),
  ]);

  // --- GBP ---
  let gbp: GBPData = {
    found: false,
    rating: null,
    reviews: null,
    address: null,
    phone: null,
    categories: null,
    place_id: null,
  };

  if (gbpResult.status === "fulfilled") {
    const localResults: any[] = (gbpResult.value as any).local_results || [];
    const nameWord = businessName.toLowerCase().split(" ")[0];
    const place =
      localResults.find((r: any) => r.title?.toLowerCase().includes(nameWord)) ||
      localResults[0] ||
      null;

    if (place) {
      gbp = {
        found: true,
        rating: place.rating ?? null,
        reviews: parseReviews(place.reviews_original ?? place.reviews),
        address: place.address ?? null,
        phone: place.phone ?? null,
        categories: place.type ?? place.types ?? null,
        place_id: place.place_id ?? null,
      };
    }
  }

  // --- Local pack ---
  const localPack: Record<string, LocalPackEntry[]> = {};
  let clientPackPosition: number | null = null;
  const nameWord = businessName.toLowerCase().split(" ")[0];

  const packPairs: [string, PromiseSettledResult<unknown>][] = [
    [`${industry} ${location}`, pack1Result],
    [`${industry} near me`, pack2Result],
  ];

  for (const [query, result] of packPairs) {
    if (result.status !== "fulfilled") continue;
    const localResults: any[] = (result.value as any).local_results || [];

    localPack[query] = localResults.map((r: any) => ({
      position: r.position,
      title: r.title,
      rating: r.rating ?? null,
      reviews: parseReviews(r.reviews_original ?? r.reviews),
      address: r.address ?? null,
      phone: r.phone ?? null,
      website: r.website ?? null,
    }));

    if (clientPackPosition === null) {
      const idx = localResults.findIndex((r: any) =>
        r.title?.toLowerCase().includes(nameWord)
      );
      if (idx !== -1) clientPackPosition = idx + 1;
    }
  }

  return { gbp, localPack, clientPackPosition };
}
