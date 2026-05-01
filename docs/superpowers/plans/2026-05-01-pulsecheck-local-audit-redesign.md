# Pulsecheck Local Audit Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 10-step parallel audit runner with a 4-phase SOP-compliant pipeline using SearchAPI + DataForSEO, fixing broken steps and adding TikTok Ads, Google AI Mode, and Competitor Ad Intelligence.

**Architecture:** Extract each audit step into its own module under `lib/audit/steps/`. Refactor `app/api/audit/run/route.ts` into a thin phased orchestrator that calls step modules in 4 sequential waves and writes results to DB as each step completes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma (PostgreSQL), SearchAPI (`searchapi.io`), DataForSEO REST API, Google PageSpeed Insights API

---

## File Map

**Create:**
- `lib/audit/steps/shared.ts` — shared utilities: `getBusinessName`, `dataForSEOPost`, `isNonCompetitor`, `toDataForSEOLocationName`
- `lib/audit/steps/pagespeed.ts` — extracted unchanged from `run/route.ts`
- `lib/audit/steps/domain-overview.ts` — extracted unchanged
- `lib/audit/steps/rankings.ts` — extracted unchanged
- `lib/audit/steps/exa.ts` — extracted unchanged
- `lib/audit/steps/autocomplete.ts` — NEW: Google Autocomplete seed generator
- `lib/audit/steps/keywords.ts` — refactored: autocomplete seeds → search_volume (replaces keyword_ideas)
- `lib/audit/steps/local-pack.ts` — refactored: google_maps + google_local (replaces runGBP + runSerpAnalysis)
- `lib/audit/steps/google-ads.ts` — fixed: advertiser_search → creative pull (was broken)
- `lib/audit/steps/meta-ads.ts` — fixed: 3-step page_search → page_id → fallback (was broken)
- `lib/audit/steps/tiktok-ads.ts` — NEW
- `lib/audit/steps/competitors.ts` — fixed: serp_competitors/live with keyword list (was competitors_domain)
- `lib/audit/steps/ai-mode.ts` — NEW: Google AI Mode citation audit
- `lib/audit/steps/competitor-ads.ts` — NEW: Phase 5 ad intel per competitor domain

**Modify:**
- `prisma/schema.prisma` — add 3 fields: `tiktokAdsData`, `aiModeData`, `competitorAdsData`
- `app/api/audit/run/route.ts` — replace `processAuditBackground` with 4-phase runner, import from steps, remove all inline `runX()` definitions

---

## Task 1: DB Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add 3 fields to the Audit model**

Open `prisma/schema.prisma`. Find the `Audit` model (around line 160). After the existing `metaAdsData Json?` line, add:

```prisma
  tiktokAdsData    Json?
  aiModeData       Json?
  competitorAdsData Json?
```

The block should look like:
```prisma
  metaAdsData    Json?
  exaData        Json?
  tiktokAdsData  Json?
  aiModeData     Json?
  competitorAdsData Json?
  geoData        Json?
  eeatData       Json?
  report         Json?
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx prisma migrate dev --name add-tiktok-aimode-competitorads
```

Expected output includes: `The following migration(s) have been created and applied from new schema changes: migrations/YYYYMMDDHHMMSS_add_tiktok_aimode_competitorads`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors (new fields are optional Json? — no breaking changes).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add tiktokAdsData, aiModeData, competitorAdsData to Audit schema"
```

---

## Task 2: Shared Utilities

**Files:**
- Create: `lib/audit/steps/shared.ts`

- [ ] **Step 1: Create the file**

```typescript
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
  return nap?.name || (crawlData as any)?.title || domain;
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
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/shared.ts
git commit -m "feat: add shared audit step utilities"
```

---

## Task 3: Extract Unchanged Steps

Move 4 existing functions out of `run/route.ts` into their own modules. No logic changes.

**Files:**
- Create: `lib/audit/steps/pagespeed.ts`
- Create: `lib/audit/steps/domain-overview.ts`
- Create: `lib/audit/steps/rankings.ts`
- Create: `lib/audit/steps/exa.ts`

- [ ] **Step 1: Create `pagespeed.ts`**

```typescript
// lib/audit/steps/pagespeed.ts

export async function runPageSpeed(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PAGESPEED_API_KEY is not configured");

  const fetchPSI = async (strategy: "mobile" | "desktop") => {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=SEO&category=BEST_PRACTICES`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(55000) });
    if (!res.ok) throw new Error(`PSI ${strategy} error: ${res.status}`);
    return res.json();
  };

  const [mobile, desktop] = await Promise.allSettled([
    fetchPSI("mobile"),
    fetchPSI("desktop"),
  ]);

  return {
    mobile: mobile.status === "fulfilled" ? mobile.value : null,
    desktop: desktop.status === "fulfilled" ? desktop.value : null,
  };
}
```

- [ ] **Step 2: Create `domain-overview.ts`**

```typescript
// lib/audit/steps/domain-overview.ts
import { dataForSEOPost } from "./shared";

export async function runDomainOverview(domain: string) {
  const [overview, backlinks] = await Promise.allSettled([
    dataForSEOPost("/dataforseo_labs/google/domain_rank_overview/live", [
      { target: domain },
    ]),
    dataForSEOPost("/backlinks/summary/live", [{ target: domain }]),
  ]);

  const overviewData = overview.status === "fulfilled" ? overview.value : null;
  const backlinksData = backlinks.status === "fulfilled" ? backlinks.value : null;

  return {
    overview: overviewData,
    backlinks: backlinksData,
    ...((backlinksData as Record<string, unknown>) || {}),
  };
}
```

- [ ] **Step 3: Create `rankings.ts`**

```typescript
// lib/audit/steps/rankings.ts
import { dataForSEOPost } from "./shared";

export async function runRankedKeywords(domain: string) {
  return dataForSEOPost(
    "/dataforseo_labs/google/ranked_keywords/live",
    [
      {
        target: domain,
        language_code: "en",
        location_code: 2840,
        limit: 100,
      },
    ]
  );
}
```

- [ ] **Step 4: Create `exa.ts`**

```typescript
// lib/audit/steps/exa.ts
import { CrawlData } from "@/lib/audit/types";
import { getBusinessName } from "./shared";

export async function runExaResearch(
  domain: string,
  location: string,
  crawlData: CrawlData
) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY is not configured");

  const businessName = getBusinessName(crawlData, domain);
  const query = `${businessName} ${domain} ${location} company reviews reputation digital marketing`;

  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      type: "deep-lite",
      numResults: 5,
      outputSchema: {
        type: "object",
        required: ["company_name", "years_in_business", "services", "pain_points", "reputation", "digital_presence"],
        properties: {
          company_name: { type: "string" },
          years_in_business: { type: "string", description: 'How long in business, or "unknown"' },
          services: { type: "array", description: "Main services offered", items: { type: "string" } },
          pain_points: {
            type: "array",
            description: "Digital marketing weaknesses: poor SEO, no ads, bad reviews, outdated site, etc.",
            items: { type: "string" },
          },
          reputation: { type: "string", description: "One sentence summary of their online reputation" },
          digital_presence: { type: "string", description: "Overall digital marketing strength: weak / moderate / strong" },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Exa HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return {
    ...(data.output?.content || {}),
    sources: data.results?.length || 0,
  };
}
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/audit/steps/pagespeed.ts lib/audit/steps/domain-overview.ts lib/audit/steps/rankings.ts lib/audit/steps/exa.ts
git commit -m "feat: extract unchanged audit steps to modules"
```

---

## Task 4: `autocomplete.ts` — Seed Generator (NEW)

**Files:**
- Create: `lib/audit/steps/autocomplete.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/audit/steps/autocomplete.ts
import { searchSerpAPI } from "@/lib/serpapi";
import { CrawlData } from "@/lib/audit/types";

export async function runAutocomplete(
  industry: string,
  location: string,
  crawlData: CrawlData
): Promise<{ seeds: string[]; queries: string[] }> {
  const h1 = (crawlData as any)?.headings?.find((h: any) => h.level === 1)?.text || "";

  // Build seed queries from industry + location + H1 text
  const queries = [
    `${industry} ${location}`,
    `${industry} near me`,
    `${industry} repair ${location}`,
    `best ${industry} ${location}`,
    ...(h1 ? [`${h1.split(" ").slice(0, 3).join(" ")}`] : []),
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

  const seeds: string[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const suggestions: any[] = (result.value as any)?.suggestions || [];
    for (const s of suggestions) {
      const val = (s.value as string || "").trim();
      if (val && !seen.has(val)) {
        seen.add(val);
        seeds.push(val);
      }
    }
  }

  return { seeds: seeds.slice(0, 40), queries };
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke test (optional — requires dev server)**

```bash
# From project root with .env.local loaded:
node -e "
require('dotenv').config({ path: '.env.local' });
const { searchSerpAPI } = require('./lib/serpapi');
searchSerpAPI({ engine: 'google_autocomplete', q: 'HVAC repair Tampa', gl: 'us', hl: 'en' })
  .then(r => console.log(JSON.stringify(r.suggestions?.slice(0,5), null, 2)))
  .catch(console.error);
"
```

Expected: array of 5 suggestion objects with `value` and `relevance` fields.

- [ ] **Step 4: Commit**

```bash
git add lib/audit/steps/autocomplete.ts
git commit -m "feat: add autocomplete seed generator step"
```

---

## Task 5: `keywords.ts` — Refactored

Replaces the `runKeywordResearch` function. Switches from `keyword_ideas` to `search_volume/live` using autocomplete seeds as input.

**Files:**
- Create: `lib/audit/steps/keywords.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/keywords.ts
git commit -m "feat: add keywords step using search_volume with autocomplete seeds"
```

---

## Task 6: `local-pack.ts` — Refactored

Replaces both `runGBP` and `runSerpAnalysis`. Uses `google_maps` for GBP lookup and `google_local` for 3-pack competitor data.

**Files:**
- Create: `lib/audit/steps/local-pack.ts`

- [ ] **Step 1: Create the file**

```typescript
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
  let gbp: GBPData = { found: false, rating: null, reviews: null, address: null, phone: null, categories: null, place_id: null };
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
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/local-pack.ts
git commit -m "feat: add local-pack step with google_maps + google_local"
```

---

## Task 7: `google-ads.ts` — Fixed

The current `runAdTransparency` passes `advertiser_id: domain` — a domain string is never a valid advertiser ID (format is `AR` + 20 digits). This has silently returned no data for every audit.

**Files:**
- Create: `lib/audit/steps/google-ads.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/google-ads.ts
git commit -m "fix: google-ads step uses advertiser_search to get valid advertiser_id"
```

---

## Task 8: `meta-ads.ts` — Fixed

The current `runMetaAds` does a single keyword search with `ad_reached_countries` (wrong param — should be `country`) and no page_id lookup. This means it never finds brand-specific ads reliably.

**Files:**
- Create: `lib/audit/steps/meta-ads.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/meta-ads.ts
git commit -m "fix: meta-ads step uses 3-step page_search -> page_id -> fallback process"
```

---

## Task 9: `tiktok-ads.ts` — New

**Files:**
- Create: `lib/audit/steps/tiktok-ads.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/tiktok-ads.ts
git commit -m "feat: add tiktok-ads step"
```

---

## Task 10: `competitors.ts` — Fixed

Replaces `competitors_domain` (domain similarity) with `serp_competitors/live` (keyword intersection). Takes the autocomplete seed keywords as input, finds which domains rank for those terms.

**Files:**
- Create: `lib/audit/steps/competitors.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/audit/steps/competitors.ts
import { dataForSEOPost, isNonCompetitor } from "./shared";

export interface CompetitorItem {
  domain: string;
  avg_position: number;
  intersections: number;
  etv: number;
}

export interface CompetitorsResult {
  competitors: CompetitorItem[];
  competitorDomains: string[];
}

export async function runCompetitors(
  seeds: string[],
  ownDomain: string
): Promise<CompetitorsResult> {
  if (seeds.length === 0) {
    return { competitors: [], competitorDomains: [] };
  }

  const keywords = seeds.slice(0, 10);

  const result = await dataForSEOPost(
    "/dataforseo_labs/google/serp_competitors/live",
    [{ keywords, location_code: 2840, language_code: "en" }]
  );

  const items: any[] = (result as any)?.items || [];
  const ownDomainClean = ownDomain.replace(/^www\./, "");

  const filtered = items
    .filter((item: any) => {
      const d = (item.domain || "").replace(/^www\./, "");
      return d && d !== ownDomainClean && !isNonCompetitor(d);
    })
    .sort((a: any, b: any) => (b.intersections || 0) - (a.intersections || 0))
    .slice(0, 5);

  return {
    competitors: filtered.map((item: any) => ({
      domain: (item.domain || "").replace(/^www\./, ""),
      avg_position: item.avg_position || 0,
      intersections: item.intersections || 0,
      etv: item.full_domain_metrics?.organic?.etv || 0,
    })),
    competitorDomains: filtered.map((item: any) =>
      (item.domain || "").replace(/^www\./, "")
    ),
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/competitors.ts
git commit -m "fix: competitors step uses serp_competitors/live with keyword list"
```

---

## Task 11: `ai-mode.ts` — New (Phase 3)

Audits Google AI Mode to check if the client is cited in AI overviews for their target keywords.

**Files:**
- Create: `lib/audit/steps/ai-mode.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/audit/steps/ai-mode.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface AIModeQueryResult {
  query: string;
  clientCited: boolean;
  citedDomains: string[];
  snippet: string;
}

export interface AIModeResult {
  queries: AIModeQueryResult[];
}

export async function runAIMode(
  topKeywords: string[],
  domain: string,
  location: string
): Promise<AIModeResult> {
  const domainClean = domain.replace(/^www\./, "");

  // Build 3 queries from top keywords + location
  const queries = [
    topKeywords[0] ? `${topKeywords[0]} ${location}` : null,
    topKeywords[1] ? `best ${topKeywords[1]}` : null,
    topKeywords[2] ? `${topKeywords[2]} near me` : null,
  ]
    .filter((q): q is string => q !== null)
    .slice(0, 3);

  if (queries.length === 0) {
    return { queries: [] };
  }

  const results = await Promise.allSettled(
    queries.map((q) =>
      searchSerpAPI({ engine: "google_ai_mode", q })
    )
  );

  return {
    queries: results.map((result, i) => {
      const query = queries[i];
      if (result.status !== "fulfilled") {
        return { query, clientCited: false, citedDomains: [], snippet: "" };
      }

      const data = result.value as any;
      const referenceLinks: any[] = data.reference_links || [];

      const citedDomains = referenceLinks
        .map((r: any) => {
          try {
            return new URL(r.link).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })
        .filter(Boolean);

      const clientCited = citedDomains.includes(domainClean);
      const snippet = (data.markdown || "").slice(0, 400);

      return { query, clientCited, citedDomains, snippet };
    }),
  };
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/ai-mode.ts
git commit -m "feat: add ai-mode step for Google AI Mode citation audit"
```

---

## Task 12: `competitor-ads.ts` — New (Phase 5)

Runs ad transparency checks on the top 3 competitor domains found in Phase 2.

**Files:**
- Create: `lib/audit/steps/competitor-ads.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/audit/steps/competitor-ads.ts
import { searchSerpAPI } from "@/lib/serpapi";

export interface CompetitorAdProfile {
  domain: string;
  googleAds: { running: boolean; creative_count: number };
  metaAds: { running: boolean; ad_count: number };
  tiktokAds: { running: boolean; ad_count: number };
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

async function getTikTokAds(brandName: string): Promise<{ running: boolean; ad_count: number }> {
  try {
    const result = await searchSerpAPI({
      engine: "tiktok_ads_library",
      q: brandName,
    });
    const count = (result as any)?.ads?.length || 0;
    return { running: count > 0, ad_count: count };
  } catch {
    return { running: false, ad_count: 0 };
  }
}

export async function runCompetitorAds(
  competitorDomains: string[]
): Promise<CompetitorAdsResult> {
  const domains = competitorDomains.slice(0, 3);
  const output: CompetitorAdsResult = {};

  await Promise.allSettled(
    domains.map(async (domain) => {
      const brandName = domainToBrandName(domain);

      const [googleAds, metaAds, tiktokAds] = await Promise.allSettled([
        getGoogleAds(domain),
        getMetaAds(brandName),
        getTikTokAds(brandName),
      ]);

      output[domain] = {
        domain,
        googleAds: googleAds.status === "fulfilled" ? googleAds.value : { running: false, creative_count: 0 },
        metaAds: metaAds.status === "fulfilled" ? metaAds.value : { running: false, ad_count: 0 },
        tiktokAds: tiktokAds.status === "fulfilled" ? tiktokAds.value : { running: false, ad_count: 0 },
      };
    })
  );

  return output;
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit/steps/competitor-ads.ts
git commit -m "feat: add competitor-ads step for Phase 5 ad intelligence"
```

---

## Task 13: Refactor `run/route.ts` — Phased Orchestrator

Replace the 916-line monolith with a thin orchestrator that imports from `lib/audit/steps/*` and runs a 4-phase chain.

**Files:**
- Modify: `app/api/audit/run/route.ts`

- [ ] **Step 1: Replace the file entirely**

```typescript
// app/api/audit/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAuditReadyEmail } from "@/lib/email";
import { detectIssues } from "@/lib/audit/issues";
import { generateRecommendations } from "@/lib/audit/recommendations";
import { compileReport } from "@/lib/audit/report";
import { runGeoAudit } from "@/lib/audit/geo";
import { runEeatAudit } from "@/lib/audit/eeat";
import { CrawlData } from "@/lib/audit/types";
import { Prisma } from "@prisma/client";
import { getBusinessName } from "@/lib/audit/steps/shared";
import { runPageSpeed } from "@/lib/audit/steps/pagespeed";
import { runDomainOverview } from "@/lib/audit/steps/domain-overview";
import { runRankedKeywords } from "@/lib/audit/steps/rankings";
import { runExaResearch } from "@/lib/audit/steps/exa";
import { runAutocomplete } from "@/lib/audit/steps/autocomplete";
import { runKeywords } from "@/lib/audit/steps/keywords";
import { runLocalPack } from "@/lib/audit/steps/local-pack";
import { runGoogleAds } from "@/lib/audit/steps/google-ads";
import { runMetaAds } from "@/lib/audit/steps/meta-ads";
import { runTikTokAds } from "@/lib/audit/steps/tiktok-ads";
import { runCompetitors } from "@/lib/audit/steps/competitors";
import { runAIMode } from "@/lib/audit/steps/ai-mode";
import { runCompetitorAds } from "@/lib/audit/steps/competitor-ads";

// --- Route Handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, domain, industry, location, crawlData, notifyEmail } = body as {
      url: string;
      domain: string;
      industry: string;
      location: string;
      crawlData: CrawlData;
      notifyEmail?: string;
    };

    if (!url || !domain) {
      return NextResponse.json(
        { error: "url and domain are required" },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    let organizationId: string | undefined;
    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id;
        organizationId = session.user.organizationId;
      }
    } catch {
      // anonymous audit
    }

    const audit = await prisma.audit.create({
      data: {
        url,
        domain,
        industry: industry || "general business",
        location: location || "United States",
        status: "running",
        crawlData: crawlData as unknown as Prisma.InputJsonValue,
        ...(notifyEmail && { notifyEmail }),
        ...(userId && { userId }),
        ...(organizationId && { organizationId }),
      },
    });

    processAuditBackground(audit.id, {
      url,
      domain,
      industry: industry || "general business",
      location: location || "United States",
      crawlData,
      notifyEmail: audit.notifyEmail ?? undefined,
    });

    return NextResponse.json({ id: audit.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to run audit";
    console.error("[audit/run]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- Phased Background Processor ---

async function saveStep<T>(
  auditId: string,
  field: string,
  promise: Promise<T>
): Promise<T | null> {
  try {
    const data = await promise;
    await prisma.audit.update({
      where: { id: auditId },
      data: { [field]: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
    });
    return data;
  } catch (err) {
    console.error(`[audit] ${field} failed:`, err);
    await prisma.audit.update({
      where: { id: auditId },
      data: { [field]: { error: String(err) } as Prisma.InputJsonValue },
    });
    return null;
  }
}

async function processAuditBackground(
  auditId: string,
  params: {
    url: string;
    domain: string;
    industry: string;
    location: string;
    crawlData: CrawlData;
    notifyEmail?: string;
  }
) {
  const { url, domain, industry, location, crawlData, notifyEmail } = params;
  const businessName = getBusinessName(crawlData, domain);

  try {
    // ── Phase 1: Parallel — no dependencies ──────────────────────────────────
    const [autocompleteSettled] = await Promise.allSettled([
      // Autocomplete runs in Phase 1 (fast, ~200ms) — result feeds Phase 2
      runAutocomplete(industry, location, crawlData),
      saveStep(auditId, "pageSpeedData", runPageSpeed(url)),
      saveStep(auditId, "backlinksData", runDomainOverview(domain)),
      saveStep(auditId, "rankingsData", runRankedKeywords(domain)),
      saveStep(auditId, "gbpData", runLocalPack(businessName, industry, location, crawlData)),
      saveStep(auditId, "adsData", runGoogleAds(businessName, domain)),
      saveStep(auditId, "metaAdsData", runMetaAds(businessName, domain)),
      saveStep(auditId, "tiktokAdsData", runTikTokAds(businessName)),
      saveStep(auditId, "exaData", runExaResearch(domain, location, crawlData)),
    ]);

    // Extract autocomplete seeds (fallback to basic seeds if it failed)
    const seeds =
      autocompleteSettled.status === "fulfilled" && autocompleteSettled.value
        ? autocompleteSettled.value.seeds
        : [`${industry} ${location}`, `${industry} near me`, `best ${industry} ${location}`];

    // ── Phase 2: Keywords + Competitors (depend on autocomplete seeds) ────────
    const [keywordSettled, competitorSettled] = await Promise.allSettled([
      saveStep(auditId, "keywordData", runKeywords(seeds)),
      saveStep(auditId, "competitorData", runCompetitors(seeds, domain)),
    ]);

    // Extract phase 2 outputs for phase 3
    const keywordData = keywordSettled.status === "fulfilled" ? keywordSettled.value as any : null;
    const competitorData = competitorSettled.status === "fulfilled" ? competitorSettled.value as any : null;
    const topKeywords: string[] = keywordData?.topKeywords ?? [industry];
    const competitorDomains: string[] = competitorData?.competitorDomains ?? [];

    // ── Phase 3: AI Mode + Competitor Ads (depend on Phase 2 data) ───────────
    await Promise.allSettled([
      saveStep(auditId, "aiModeData", runAIMode(topKeywords, domain, location)),
      saveStep(auditId, "competitorAdsData", runCompetitorAds(competitorDomains)),
    ]);

    // ── Phase 4: Compile report ───────────────────────────────────────────────
    await compileAndFinalize(auditId, crawlData, { domain, industry, location, notifyEmail });
  } catch (err) {
    console.error("[audit/run] background processing failed:", err);
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "failed" },
    }).catch(() => {});
  }
}

// --- Report Compilation ---

async function compileAndFinalize(
  auditId: string,
  crawlData: CrawlData,
  params: { domain: string; industry: string; location: string; notifyEmail?: string }
) {
  const { domain, industry, location, notifyEmail } = params;

  const auditRecord = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!auditRecord) return;

  const pageSpeedData = auditRecord.pageSpeedData as Record<string, unknown> | null;
  const keywordData = auditRecord.keywordData as Record<string, unknown> | null;
  const rankingsData = auditRecord.rankingsData as Record<string, unknown> | null;
  const domainData = auditRecord.backlinksData as Record<string, unknown> | null;
  const serpData = auditRecord.serpData as Record<string, unknown> | null;
  const competitorData = auditRecord.competitorData as Record<string, unknown> | null;

  // GEO + E-E-A-T scores
  let geoResult: ReturnType<typeof runGeoAudit> | null = null;
  let eeatResult: ReturnType<typeof runEeatAudit> | null = null;
  try {
    geoResult = runGeoAudit(crawlData, crawlData.llmsTxt);
  } catch (err) {
    console.error("[audit] runGeoAudit failed:", err);
  }
  try {
    eeatResult = runEeatAudit(crawlData, domainData ?? undefined);
  } catch (err) {
    console.error("[audit] runEeatAudit failed:", err);
  }

  // Save GEO + EEAT
  try {
    if (geoResult) {
      await prisma.audit.update({ where: { id: auditId }, data: { geoData: geoResult as unknown as Prisma.InputJsonValue } });
    }
    if (eeatResult) {
      await prisma.audit.update({ where: { id: auditId }, data: { eeatData: eeatResult as unknown as Prisma.InputJsonValue } });
    }
  } catch (err) {
    console.error("[audit] geo/eeat db save failed:", err);
  }

  // Issues + recommendations + report
  let issues: ReturnType<typeof detectIssues> = [];
  try {
    issues = [
      ...detectIssues(crawlData, pageSpeedData ?? undefined, keywordData ?? undefined, domainData ?? undefined),
      ...(geoResult?.issues || []),
      ...(eeatResult?.issues || []),
    ];
  } catch (err) {
    console.error("[audit] detectIssues failed:", err);
  }

  const recommendations = generateRecommendations(issues);
  const report = compileReport(
    crawlData,
    issues,
    recommendations,
    pageSpeedData ?? undefined,
    keywordData ?? undefined,
    rankingsData ?? undefined,
    domainData ?? undefined,
    serpData ?? undefined,
    competitorData ?? undefined
  );

  // AI analysis
  const aiAnalysis = await runAgentAnalysis(domain, crawlData, pageSpeedData, report.scores).catch(
    (err) => { console.error("[audit/run] agent analysis failed:", err); return null; }
  );

  // Mark complete
  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: "complete",
      report: {
        ...report,
        issues,
        recommendations,
        ...(aiAnalysis && { aiAnalysis }),
      } as unknown as Prisma.InputJsonValue,
    },
  });

  if (notifyEmail) {
    sendAuditReadyEmail({
      to: notifyEmail,
      domain,
      auditId,
      industry,
      location,
    }).catch((err) => console.error("[audit/run] email failed:", err));
  }
}

// --- Agent API Analysis ---

async function runAgentAnalysis(
  domain: string,
  crawlData: CrawlData,
  pageSpeedData: Record<string, unknown> | null,
  scores: { pagespeedMobile: number; pagespeedDesktop: number; seo: number; accessibility: number }
): Promise<string | null> {
  const agentApiUrl = process.env.AGENT_API_URL || "http://localhost:3005";
  const agentApiKey = process.env.AGENT_API_KEY || "";

  const imagesWithoutAlt = (crawlData.images || []).filter((img) => !img.hasAlt).length;
  const schemaTypes = crawlData.jsonLd.map((j) => j["@type"]).filter(Boolean).join(", ") || "none";

  const message = `Run an SEO audit on ${domain}.

Crawl data:
- Title: ${crawlData.title || "missing"}
- Meta description: ${crawlData.metaDescription || "missing"}
- Canonical: ${crawlData.canonical || "missing"}
- Robots directives: ${crawlData.robotsDirectives.join(", ") || "none"}
- Robots.txt: ${crawlData.robotsTxt ? "present" : "missing"}
- Sitemap: ${crawlData.sitemapXml ? "present" : "missing"}
- H1: ${crawlData.headings.find((h) => h.level === 1)?.text || "missing"}
- Total headings: ${crawlData.headings.length}
- Word count: ${crawlData.wordCount}
- Internal links: ${crawlData.internalLinks.length}
- Images: ${crawlData.images.length} total, ${imagesWithoutAlt} missing alt text
- Schema markup: ${schemaTypes}
- NAP: ${crawlData.nap.address || "not found"}

Performance scores (0–100):
- Mobile speed: ${scores.pagespeedMobile}
- Desktop speed: ${scores.pagespeedDesktop}
- SEO (Lighthouse): ${scores.seo}
- Accessibility: ${scores.accessibility}

Produce a prioritized audit covering crawlability, performance, on-page SEO, and quick wins. Be specific to this domain's actual data.`;

  const res = await fetch(`${agentApiUrl}/api/agents/marketing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(agentApiKey && { "x-api-key": agentApiKey }),
    },
    body: JSON.stringify({ message, skill: "seo-audit" }),
  });

  if (!res.ok) throw new Error(`agent-api ${res.status}: ${await res.text()}`);
  const data = await res.json() as { reply?: string };
  return data.reply || null;
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npx tsc --noEmit
```

Expected: no errors. If there are import errors, verify each step file is in `lib/audit/steps/` and exports match the import names in the route.

- [ ] **Step 3: Commit**

```bash
git add app/api/audit/run/route.ts
git commit -m "refactor: replace monolithic audit runner with 4-phase phased orchestrator"
```

---

## Task 14: Build Verification + Integration Test

- [ ] **Step 1: Full production build**

```bash
cd /Users/marco/VS/Bullseye/pulsecheck-launch
npm run build
```

Expected: `✓ Compiled successfully`. Fix any TypeScript or import errors before proceeding.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: `ready - started server on 0.0.0.0:PORT`.

- [ ] **Step 3: Submit a test audit**

Open a new terminal. Run a full audit against a real local business domain (use a small, fast-loading site):

```bash
# Step 1: crawl
curl -s -X POST http://localhost:PORT/api/audit/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://fontanabrothersair.com"}' | python3 -m json.tool
```

Expected: JSON with `crawlData`, `industry` (should detect "hvac" or similar), `location`.

```bash
# Step 2: run audit — capture the returned ID
AUDIT_ID=$(curl -s -X POST http://localhost:PORT/api/audit/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://fontanabrothersair.com",
    "domain": "fontanabrothersair.com",
    "industry": "HVAC",
    "location": "Tampa, FL",
    "crawlData": {}
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo "Audit ID: $AUDIT_ID"
```

Expected: prints an audit ID like `cm...`.

- [ ] **Step 4: Poll until complete**

```bash
# Poll every 5 seconds — check status
for i in {1..20}; do
  STATUS=$(curl -s http://localhost:PORT/api/audit/$AUDIT_ID | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))")
  echo "[$i] Status: $STATUS"
  if [ "$STATUS" = "complete" ] || [ "$STATUS" = "failed" ]; then break; fi
  sleep 5
done
```

Expected: transitions `running` → `complete` within ~60 seconds.

- [ ] **Step 5: Verify new fields are populated**

```bash
curl -s http://localhost:PORT/api/audit/$AUDIT_ID | python3 -c "
import sys, json
d = json.load(sys.stdin)
fields = ['tiktokAdsData', 'aiModeData', 'competitorAdsData', 'adsData', 'metaAdsData', 'gbpData', 'keywordData', 'competitorData']
for f in fields:
    val = d.get(f)
    status = 'POPULATED' if val and not (isinstance(val, dict) and 'error' in val) else ('ERROR: ' + val.get('error','?') if isinstance(val, dict) and 'error' in val else 'NULL')
    print(f'{f}: {status}')
"
```

Expected: all 8 fields show `POPULATED`. If any show `ERROR`, check the server logs for that step's failure reason.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify phased audit pipeline with integration test"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ DB migration (Task 1)
- ✅ Shared utilities (Task 2)
- ✅ Extract unchanged steps (Task 3)
- ✅ autocomplete.ts (Task 4)
- ✅ keywords.ts — search_volume with autocomplete seeds (Task 5)
- ✅ local-pack.ts — google_maps + google_local (Task 6)
- ✅ google-ads.ts — advertiser_search → pull flow (Task 7)
- ✅ meta-ads.ts — 3-step process with correct `country` param (Task 8)
- ✅ tiktok-ads.ts (Task 9)
- ✅ competitors.ts — serp_competitors/live (Task 10)
- ✅ ai-mode.ts (Task 11)
- ✅ competitor-ads.ts — Phase 5 (Task 12)
- ✅ run/route.ts refactor with 4-phase chain (Task 13)
- ✅ Build + integration test (Task 14)

**What is NOT in this plan (out of scope):**
- Frontend display of `tiktokAdsData`, `aiModeData`, `competitorAdsData` — report UI update is follow-on
- Ecommerce client support — separate landing page
- GSC integration — separate feature requiring OAuth
