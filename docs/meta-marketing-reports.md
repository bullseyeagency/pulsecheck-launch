# Meta Marketing API — Planned Reports

> API Version: v25.0 | SDK: `facebook-nodejs-business-sdk`
> Permissions: ads_read, ads_management, business_management, read_insights, pages_read_engagement, pages_show_list, catalog_management, pages_manage_ads

## Accounts

| Account | ID | Type | Token |
|---------|-----|------|-------|
| King Komb Back Up | `act_1069024537362989` | Production | System User (`bullseye-api`) |
| King Kanine New | `act_632807718583636` | Production | System User (`bullseye-api`) |
| Sandbox | `act_1618801742442280` | Sandbox | Sandbox token |

## Available API Fields (Validated)

### Core Metrics
- `spend`, `impressions`, `clicks`, `ctr`, `cpc`, `cpm`

### Conversion Metrics (extracted from `actions[]` array by `action_type`)
- `purchase` — count
- `add_to_cart` — count
- `omni_purchase` — for ROAS lookup in `purchase_roas[]`
- `link_click`, `landing_page_view`, `post_engagement`, `comment`, `like`
- `action_values[]` — revenue per action type
- `cost_per_action_type[]` — cost per purchase, cost per ATC, etc.

### Video Retention Metrics
- `video_p25_watched_actions` — 25% watched
- `video_p50_watched_actions` — 50% watched
- `video_p75_watched_actions` — 75% watched
- `video_p100_watched_actions` — 100% watched
- `video_avg_time_watched_actions`

### Ad Identity
- `ad_name`, `campaign_name`, `adset_name`
- `ad_id`, `campaign_id`, `adset_id`

### Query Options
- `level`: account, campaign, adset, ad
- `date_preset`: last_7d, last_14d, last_30d, last_90d, this_month, last_month, etc.
- `time_range`: `{ since: 'YYYY-MM-DD', until: 'YYYY-MM-DD' }`
- `sort`: e.g. `['spend_descending']`
- `filtering`: array of filter objects
- `breakdowns`: age, gender, country, publisher_platform, device_platform, etc.

---

## Reports

### 1. Top Ads by Spend
Shows highest-spending ads with key performance metrics like ROAS and CTR. Sortable table below chart. Supports adding preferred conversion action for deeper analysis.

**API Call:**
```js
account.getInsights(
  ['ad_name','campaign_name','spend','impressions','clicks','ctr','cpc','cpm','actions','action_values','cost_per_action_type','purchase_roas'],
  { date_preset: 'last_90d', level: 'ad', limit: 50, sort: ['spend_descending'] }
)
```

**Derived Metrics:**
- Revenue: `action_values[].purchase`
- ROAS: `purchase_roas[].omni_purchase`
- Cost per Purchase: `cost_per_action_type[].purchase`
- ATC: `actions[].add_to_cart`
- Purchase Conversion Rate: purchases / clicks

---

### 2. Ads by Type
Breaks down performance by ad type (format). Shows which formats drive the most conversions or traffic. Supports adding Leads, Purchases, or any conversion being optimized for. Default sort: clicks.

**Approach:** Query at ad level, then group by creative type (image vs video). Can use `ad_format_asset` or infer from presence of video metrics.

---

### 3. Categorization Report
Sorts ads into groups like New, Winners, and Losers. Rules are customizable by the user.

**Approach:** Pull all active ads with metrics, then apply client-side rules:
- **Winners**: ROAS > threshold (e.g., 3.0) AND spend > minimum
- **Losers**: ROAS < threshold (e.g., 1.5) OR no purchases after $X spend
- **New**: `ad_delivery_start_time` within last 7 days
- Rules are configurable via UI controls

---

### 4. Video Drop-off
Evaluates how well video ads resonate with audience. Shows which videos have a strong hook, which hold attention, and which drive user interest.

**API Call:**
```js
account.getInsights(
  ['ad_name','campaign_name','spend','impressions','video_p25_watched_actions','video_p50_watched_actions','video_p75_watched_actions','video_p100_watched_actions','video_avg_time_watched_actions','actions','purchase_roas'],
  { date_preset: 'last_90d', level: 'ad', limit: 50, sort: ['spend_descending'],
    filtering: [{ field: 'video_p25_watched_actions', operator: 'GREATER_THAN', value: 0 }] }
)
```

**Derived Metrics:**
- Hook Rate: p25 / impressions
- Hold Rate: p50 / p25
- Completion Rate: p100 / p25
- Drop-off visualization: funnel chart showing 25% → 50% → 75% → 100%

**Sample Data (validated):**
| Ad | 25% | 50% | 75% | 100% | Completion |
|----|-----|-----|-----|------|------------|
| Pomelli-01 | 47,765 | 24,733 | 15,937 | 11,986 | 25.1% |
| Jordyn | 28,280 | 19,307 | 8,655 | 5,755 | 20.4% |
| Bree | 2,880 | 966 | 484 | 236 | 8.2% |

---

### 5. Headline Comparison
Identifies which headline is performing best. Supports adding any metric. Default sort: clicks.

**Approach:** Pull ad-level data with `ad_name` and `ad_creative_bodies` fields, then parse/group by headline text. Requires fetching ad creatives via:
```js
const ads = await account.getAds(['name','creative'], { limit: 100 });
// Then for each creative: creative.read(['title','body','link_url'])
```

---

### 6. Copy Comparison
Identifies which ad copy is performing best. Supports adding any metric. Default sort: clicks.

**Approach:** Similar to Headline Comparison — pull ad creatives, extract body text, merge with insights data. Group by copy text to compare performance.

---

### 7. Landing Page Comparison
Evaluates landing page performance. Default conversion action: Purchase. Default date grouping: weekly. Supports switching to any metric. Default sort: clicks.

**API Call:**
```js
account.getInsights(
  ['ad_name','campaign_name','spend','clicks','actions','action_values','purchase_roas','cost_per_action_type'],
  { date_preset: 'last_90d', level: 'ad', limit: 100, sort: ['clicks_descending'],
    time_increment: 7 } // weekly grouping
)
```
Then fetch ad creatives for `link_url` and group insights by landing page URL.

---

## App Integration Pattern

### Route Structure
```
/app/api/meta/[endpoint]/route.ts   → API route (POST, auth check, SDK call)
/app/meta/[action]/page.tsx         → Client page ('use client', fetch, table/chart)
```

### Auth
- `authorizeRequest()` from `/lib/api-auth.ts`
- System User token from `META_ACCESS_TOKEN` env var
- SDK: `bizSdk.FacebookAdsApi.init(process.env.META_ACCESS_TOKEN)`

### Sidebar
Add `metaAdsItems[]` array to `/components/Sidebar.tsx` with nav links for each report.

### Environment Variables
```env
META_APP_ID=825927233776825
META_ACCESS_TOKEN=<system-user-token>
META_SANDBOX_TOKEN=<sandbox-token>
META_SANDBOX_ACCOUNT=act_1618801742442280
```
