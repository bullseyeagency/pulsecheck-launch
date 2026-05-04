// lib/audit/steps/shared.ts
import { CrawlData } from "@/lib/audit/types";

const DATAFORSEO_BASE = "https://api.dataforseo.com/v3";

export function getDataForSEOAuth(): string {
  const login = process.env.DATAFORSEO_LOGIN || "";
  const password = process.env.DATAFORSEO_PASSWORD || "";
  return Buffer.from(`${login}:${password}`).toString("base64");
}

/**
 * POST to DataForSEO. Returns tasks[0].result[0] for most endpoints.
 * For endpoints that return a flat result array (e.g. search_volume/live),
 * call dataForSEOPostRaw instead.
 */
export async function dataForSEOPost(
  endpoint: string,
  payload: unknown[]
): Promise<unknown> {
  const response = await fetch(`${DATAFORSEO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getDataForSEOAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `DataForSEO ${endpoint} error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.tasks?.[0]?.result?.[0] ?? data.tasks?.[0]?.result ?? null;
}

/**
 * POST to DataForSEO. Returns tasks[0].result (full array).
 * Use for search_volume/live which returns an array, not a nested object.
 */
export async function dataForSEOPostRaw(
  endpoint: string,
  payload: unknown[]
): Promise<unknown[]> {
  const response = await fetch(`${DATAFORSEO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getDataForSEOAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `DataForSEO ${endpoint} error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.tasks?.[0]?.result ?? [];
}

export function getBusinessName(crawlData: CrawlData, domain: string): string {
  const nap = (crawlData as any)?.nap;
  if (nap?.name) return nap.name;

  // Humanize the domain as brand name — more reliable than parsing generic page titles
  // e.g. "callhometherapist.com" → "callhometherapist", "nmi-fence.com" → "nmi fence"
  return domain
    .replace(/\.(com|net|org|io|co|us)$/, "")
    .replace(/[-_]/g, " ")
    .trim();
}

// Domains that are never real local business competitors
const NON_COMPETITOR_DOMAINS = new Set([
  "wikipedia.org", "wikimedia.org", "wikidata.org",
  "yelp.com", "facebook.com", "google.com", "youtube.com",
  "yellowpages.com", "bbb.org", "angi.com", "angieslist.com",
  "homeadvisor.com", "houzz.com", "thumbtack.com", "nextdoor.com",
  "amazon.com", "ebay.com", "walmart.com", "lowes.com", "homedepot.com",
  "trane.com", "carrier.com", "lennox.com", "goodman.com", "daikin.com",
  "reddit.com", "quora.com", "linkedin.com", "instagram.com", "twitter.com",
  "mapquest.com", "bing.com", "yahoo.com", "tripadvisor.com",
  "porch.com", "buildzoom.com", "improvenet.com",
]);

export function isNonCompetitor(domain: string): boolean {
  const d = domain.replace(/^www\./, "");
  if ([...NON_COMPETITOR_DOMAINS].some((nd) => d === nd || d.endsWith(`.${nd}`))) return true;
  if (/\.(org|gov|edu|mil|int)$/.test(d)) return true;
  if (/\b(directory|listing|review|advisor|finder|near|local|map|search|wiki|news|blog|forum|media)\b/i.test(d)) return true;
  return false;
}

const STATE_ABBR_TO_NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const METRO_TO_CITY: Record<string, { city: string; state: string }> = {
  "tampa bay": { city: "Tampa", state: "Florida" },
  "south florida": { city: "Miami", state: "Florida" },
  "bay area": { city: "San Jose", state: "California" },
  "silicon valley": { city: "San Jose", state: "California" },
  "los angeles": { city: "Los Angeles", state: "California" },
  "new york": { city: "New York", state: "New York" },
  "dallas fort worth": { city: "Dallas", state: "Texas" },
  dfw: { city: "Dallas", state: "Texas" },
  "twin cities": { city: "Minneapolis", state: "Minnesota" },
  "puget sound": { city: "Seattle", state: "Washington" },
};

export function toDataForSEOLocationName(location: string): string | null {
  if (!location || location === "United States") return null;
  const lower = location.toLowerCase().trim();

  if (METRO_TO_CITY[lower]) {
    const { city, state } = METRO_TO_CITY[lower];
    return `${city},${state},United States`;
  }

  const m = location.match(/^(.+),\s*([A-Z]{2})$/);
  if (m) {
    const stateName = STATE_ABBR_TO_NAME[m[2]];
    if (stateName) return `${m[1].trim()},${stateName},United States`;
    return null;
  }

  const singleCity = location.trim();
  const nonLocationWords = new Set(["Services", "Repair", "Maintenance", "Installation", "Our", "Your", "The", "All"]);
  if (!singleCity.includes(",") && !nonLocationWords.has(singleCity.split(" ")[0])) {
    return `${singleCity},United States`;
  }

  return null;
}
