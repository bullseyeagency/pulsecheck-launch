# Pulsecheck Local Audit Redesign
**Date:** 2026-05-01  
**Scope:** `/lp/[industry]` landing page audit — local/service clients only  
**Status:** Approved for implementation

---

## Problem

The current audit (`app/api/audit/run/route.ts`) fires all steps in one flat `Promise.allSettled()`. Several step functions are broken or produce no data:

- `runAdTransparency()` passes `advertiser_id: domain` — a domain string is never a valid advertiser ID, so every call returns nothing
- `runMetaAds()` uses wrong `country` param (`ad_reached_countries`) and does a single keyword search with no page_id lookup
- `runSerpAnalysis()` runs organic Google SERP — useless for local; should be the Local 3-pack
- `runKeywordResearch()` uses `keyword_ideas` endpoint with hardcoded seeds instead of autocomplete-discovered terms fed to `search_volume`
- `runCompetitorAnalysis()` uses `competitors_domain` (domain similarity) instead of `serp_competitors/live` (keyword intersection — more accurate for local)
- Three SOP steps are completely absent: TikTok Ads, Google AI Mode, Competitor Ad Intelligence (Phase 5)

Ecommerce clients will get a separate landing page with its own step set. This spec is local/service only.

---

## Architecture

### Step Extraction

Move all `runX()` functions out of `run/route.ts` into individual modules under `lib/audit/steps/`. Each file exports one async function with a typed return.

```
lib/audit/steps/
  pagespeed.ts          ← extracted unchanged
  domain-overview.ts    ← extracted unchanged
  rankings.ts           ← extracted unchanged
  exa.ts                ← extracted unchanged
  autocomplete.ts       ← NEW
  keywords.ts           ← refactored (autocomplete seeds → search_volume)
  local-pack.ts         ← refactored (replaces runGBP + runSerpAnalysis)
  google-ads.ts         ← fixed (proper advertiser_search flow)
  meta-ads.ts           ← fixed (3-step page_search → page_id → fallback)
  tiktok-ads.ts         ← NEW
  competitors.ts        ← fixed (serp_competitors/live with keyword list)
  ai-mode.ts            ← NEW
  competitor-ads.ts     ← NEW
```

`app/api/audit/run/route.ts` becomes a thin orchestrator (~100 lines) that runs the 4-phase chain and handles DB writes. All business logic lives in the step modules.

### Shared Utilities

`lib/audit/steps/shared.ts` — utilities used across steps:
- `searchAPI(params)` — thin wrapper around `searchSerpAPI` with timeout (30s default)
- `getBusinessName(crawlData, domain)` — extract business name from NAP or title
- `extractResult(settled)` — unwrap `PromiseSettledResult`

---

## Phase Structure

```
Phase 1 — Parallel (fires immediately, no dependencies):
  pagespeed       → pageSpeedData
  domain-overview → backlinksData
  rankings        → rankingsData
  local-pack      → gbpData (replaces both gbpData + serpData; serpData unused in local audit)
  google-ads      → adsData
  meta-ads        → metaAdsData
  tiktok-ads      → tiktokAdsData
  exa             → exaData
  autocomplete    → (in-memory only, feeds Phase 2)

Phase 2 — After autocomplete resolves:
  keywords(autocompleteSeeds)    → keywordData
  competitors(autocompleteSeeds) → competitorData

Phase 3 — After keywords + competitors resolve:
  ai-mode(topKeywords)                 → aiModeData
  competitor-ads(competitorDomains)    → competitorAdsData

Phase 4 — Compile:
  geo + eeat scores, issues, recommendations, AI analysis
  → update status: "complete"
```

Each step writes its result to the DB immediately on completion. The frontend polls `/api/audit/[id]` every 2s and maps field presence to step status — no changes needed to the polling contract.

**Estimated total time:** ~38s (vs ~25s current). The increase comes from the autocomplete → keyword chain (Phase 1→2) and Phase 3 running after competitor domains are known.

---

## Step Specifications

### `pagespeed.ts`
No changes. Extracted as-is.

```ts
export async function runPageSpeed(url: string): Promise<PageSpeedResult>
```

### `domain-overview.ts`
No changes. Extracted as-is.

```ts
export async function runDomainOverview(domain: string): Promise<DomainOverviewResult>
```

### `rankings.ts`
No changes. Extracted as-is.

```ts
export async function runRankedKeywords(domain: string): Promise<RankingsResult>
```

### `exa.ts`
No changes. Extracted as-is.

```ts
export async function runExaResearch(domain: string, location: string, crawlData: CrawlData): Promise<ExaResult>
```

### `autocomplete.ts` — NEW
Generates keyword seeds from crawl data. Runs in Phase 1 because it's fast (~200ms) and its output gates Phase 2.

**Inputs:** `industry: string`, `location: string`, `crawlData: CrawlData`

**Process:**
1. Build 4-6 seed queries from `industry` + `location` + H1 text from crawlData
2. Call `engine=google_autocomplete` for each in parallel
3. Deduplicate and sort by relevance score
4. Return top 40 unique suggestion strings

**Output:**
```ts
{ seeds: string[], queries: string[] }
```

### `keywords.ts` — refactored
Replaces `keyword_ideas` → `search_volume` flow. Uses autocomplete seeds as input.

**Inputs:** `seeds: string[]`

**Process:**
1. Call `/v3/keywords_data/google_ads/search_volume/live` with seeds (batch up to 50)
2. Filter out null-volume keywords
3. Sort by search_volume descending

**Output:**
```ts
{
  items: KeywordVolumeItem[],   // keyword, volume, cpc, competition_index
  topKeywords: string[]         // top 10 by volume, used in Phase 3
}
```

### `local-pack.ts` — refactored
Replaces both `runGBP` and `runSerpAnalysis`. Single module for all local presence data.

**Inputs:** `businessName: string`, `industry: string`, `location: string`, `crawlData: CrawlData`

**Process:**
1. **GBP lookup:** `engine=google_maps&q={businessName} {location}` — match by name similarity, extract rating/reviews/address/phone/categories
2. **3-pack — query 1:** `engine=google_local&q={industry} {location}` — extract local_results (position, title, rating, reviews, website)
3. **3-pack — query 2:** `engine=google_local&q={industry} near me&location={location}` — second pack view
4. Run all 3 in parallel

**Output:**
```ts
{
  gbp: { found: boolean, rating, reviews, address, phone, categories, place_id },
  localPack: {
    [query: string]: LocalPackResult[]  // position, title, rating, reviews, website per result
  },
  clientPackPosition: number | null     // client's position in pack, null if not found
}
```

### `google-ads.ts` — fixed
Currently broken: `advertiser_id: domain` is never a valid advertiser ID.

**Inputs:** `businessName: string`, `domain: string`

**Process:**
1. `engine=google_ads_transparency_center_advertiser_search&q={businessName}` → extract `advertisers[0].id`
2. If found: `engine=google_ads_transparency_center&advertiser_id={id}&num=100`
3. Fallback if not found: `engine=google_ads_transparency_center&domain={domain}&num=100`
4. Extract: total creative count, format mix, `total_days_shown` range, platforms, sample headlines

**Output:**
```ts
{
  running: boolean,
  advertiser_id: string | null,
  creative_count: number,
  longest_running_days: number,
  formats: string[],
  platforms: string[],
  sample_headlines: string[]
}
```

### `meta-ads.ts` — fixed
Currently: single keyword search, wrong param (`ad_reached_countries` → should be `country`), no page_id lookup.

**Inputs:** `businessName: string`, `domain: string`

**Process:**
1. `engine=meta_ad_library_page_search&q={businessName}` → extract `page_results[0].page_id`
2. If found: `engine=meta_ad_library&page_id={id}&country=US&sort_by=impressions_high_to_low`
3. Fallback: `engine=meta_ad_library&q={businessName}&country=US`
4. Extract: ad count, platforms, impression indices, sample copy/CTA

**Output:**
```ts
{
  running: boolean,
  page_id: string | null,
  ad_count: number,
  platforms: string[],
  sample: { headline: string | null, cta: string | null, format: string | null }
}
```

### `tiktok-ads.ts` — NEW

**Inputs:** `businessName: string`

**Process:**
1. `engine=tiktok_ads_library&q={businessName}&sort_by=unique_users_seen_high_to_low`
2. Extract: ad count, estimated audience ranges, video links, flight dates

**Output:**
```ts
{
  running: boolean,
  ad_count: number,
  top_reach: string | null,    // highest estimated_audience string
  sample_video: string | null
}
```

### `competitors.ts` — fixed
Currently uses `competitors_domain` (domain similarity). Switch to `serp_competitors/live` (keyword intersection — far more accurate for local).

**Inputs:** `seeds: string[]` (top keywords from autocomplete/Phase 2)

**Process:**
1. Take top 10 keywords from seeds
2. Call `/v3/dataforseo_labs/google/serp_competitors/live` with keyword list
3. Filter with existing `isNonCompetitor()` logic (keep this — it's good)
4. Sort by intersections descending, take top 5
5. Return domain list + metrics

**Output:**
```ts
{
  competitors: CompetitorItem[],   // domain, avg_position, intersections, etv
  competitorDomains: string[]      // top 5 domain strings for Phase 3 input
}
```

### `ai-mode.ts` — NEW

**Inputs:** `topKeywords: string[]`, `domain: string`, `location: string`

**Process:**
1. Build 3 queries from topKeywords + location (e.g. "HVAC repair Tampa FL", "best HVAC company Tampa", "AC repair near me")
2. Call `engine=google_ai_mode&q={query}` for each, in parallel
3. For each result: check if `domain` appears in `reference_links`, extract cited domains, grab markdown snippet (first 400 chars)

**Output:**
```ts
{
  queries: {
    query: string,
    clientCited: boolean,
    citedDomains: string[],
    snippet: string
  }[]
}
```

### `competitor-ads.ts` — NEW (Phase 5)

**Inputs:** `competitorDomains: string[]`

**Process:**
For each of top 3 competitor domains, run in parallel:
1. Google Ads: `engine=google_ads_transparency_center&domain={domain}&num=20`
2. Meta: `engine=meta_ad_library_page_search&q={brandName}` (brand name derived by stripping TLD from domain) → `engine=meta_ad_library&page_id={id}`
3. TikTok: `engine=tiktok_ads_library&q={brandName}`

**Output:**
```ts
{
  [domain: string]: {
    googleAds: { running: boolean, creative_count: number },
    metaAds: { running: boolean, ad_count: number },
    tiktokAds: { running: boolean, ad_count: number }
  }
}
```

---

## DB Schema Changes

Three fields added to the `Audit` model in `prisma/schema.prisma`:

```prisma
tiktokAdsData    Json?   // Phase 1: TikTok ad library
aiModeData       Json?   // Phase 3: Google AI Mode citation audit
competitorAdsData Json?  // Phase 3: Phase 5 competitor ad intelligence
```

Requires one `prisma migrate dev --name add-tiktok-aimode-competitorads`.

No existing fields renamed or removed. The polling contract (`/api/audit/[id]`) and report compilation are unaffected — new fields are additive.

---

## `run/route.ts` After Refactor

The route becomes a thin orchestrator:

```ts
async function processAuditBackground(auditId, params) {
  const { url, domain, industry, location, crawlData } = params;
  const businessName = getBusinessName(crawlData, domain);

  // Phase 1 — all parallel
  const [autocompleteResult, ...phase1Results] = await Promise.allSettled([
    runAutocomplete(industry, location, crawlData),
    runPageSpeed(url).then(save(auditId, 'pageSpeedData')),
    runDomainOverview(domain).then(save(auditId, 'backlinksData')),
    runRankedKeywords(domain).then(save(auditId, 'rankingsData')),
    runLocalPack(businessName, industry, location, crawlData).then(save(auditId, 'gbpData')),
    runGoogleAds(businessName, domain).then(save(auditId, 'adsData')),
    runMetaAds(businessName, domain).then(save(auditId, 'metaAdsData')),
    runTikTokAds(businessName).then(save(auditId, 'tiktokAdsData')),
    runExaResearch(domain, location, crawlData).then(save(auditId, 'exaData')),
  ]);

  // Phase 2 — depends on autocomplete seeds
  const seeds = autocompleteResult.status === 'fulfilled'
    ? autocompleteResult.value.seeds : [industry, location];

  const [keywordResult, competitorResult] = await Promise.allSettled([
    runKeywords(seeds).then(save(auditId, 'keywordData')),
    runCompetitors(seeds).then(save(auditId, 'competitorData')),
  ]);

  // Phase 3 — depends on keyword + competitor data
  const topKeywords = keywordResult.status === 'fulfilled'
    ? keywordResult.value.topKeywords : [industry];
  const competitorDomains = competitorResult.status === 'fulfilled'
    ? competitorResult.value.competitorDomains : [];

  await Promise.allSettled([
    runAIMode(topKeywords, domain, location).then(save(auditId, 'aiModeData')),
    runCompetitorAds(competitorDomains).then(save(auditId, 'competitorAdsData')),
  ]);

  // Phase 4 — compile
  await compileAndFinalize(auditId, crawlData);
}
```

---

## What Is Not Changing

- Frontend pages (`app/lp/[industry]/page.tsx`) — no changes
- Polling route (`app/api/audit/[id]/route.ts`) — no changes
- Report compilation (`lib/audit/report.ts`) — no changes, new fields are additive
- Issue detection (`lib/audit/issues.ts`) — no changes
- GEO + E-E-A-T computation — no changes
- Crawl route (`app/api/audit/crawl/route.ts`) — no changes
- Email notifications — no changes

---

## Out of Scope

- Ecommerce client support (Google Shopping, product-level crawl) — separate landing page
- Frontend display of AI Mode data, TikTok data, Competitor Ad Intel — report UI update is a follow-on task
- GSC integration — requires per-client OAuth, separate feature
