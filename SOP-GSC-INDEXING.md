# SOP: Google Search Console URL Indexing — Pulsecheck

**Created**: 2026-03-20
**App**: Pulsecheck (port 3004)
**Path**: `/Users/marco/VS/Bullseye/pulsecheck-launch/`

---

## 1. What This Does

Bulk URL inspection via the Google Search Console API. Paste URLs or load from sitemap, check index status, and track results over time in a database.

Replaces manual URL Inspection in GSC (which has a ~10/day limit). The API has higher rate limits and can batch-process all URLs in one run.

---

## 2. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project (one-time)
1. Go to https://console.cloud.google.com/
2. Click the project dropdown (top left) > **New Project**
3. Name it (e.g. `pulsecheck`) > **Create**
4. Select the new project from the dropdown

### Step 2: Enable the Search Console API
1. Go to **APIs & Services > Library** (or https://console.cloud.google.com/apis/library)
2. Search for **"Google Search Console API"**
3. Click on it > **Enable**

### Step 3: Create a Service Account
1. Go to **IAM & Admin > Service Accounts** (or https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **+ Create Service Account**
3. Name: `pulsecheck-gsc` (or any name)
4. Click **Create and Continue**
5. Skip the "Grant this service account access" step (no roles needed) > click **Done**

### Step 4: Download the JSON Key
1. Click on your new service account in the list
2. Go to the **Keys** tab
3. Click **Add Key > Create new key > JSON**
4. A `.json` file downloads automatically
5. Open the file and extract two values into your `.env.local`:
   ```
   GSC_CLIENT_EMAIL=<client_email from the JSON>
   GSC_PRIVATE_KEY="<private_key from the JSON>"
   ```
6. Delete the JSON file after extracting the values (don't commit it)

### Step 5: Add Service Account to Google Search Console
1. Go to https://search.google.com/search-console
2. Select your property (e.g. `dalyadvertising.com`)
3. Go to **Settings > Users and Permissions**
4. Click **Add User**
5. Paste the service account email: `pulsecheck-gsc@pulsecheck-487618.iam.gserviceaccount.com`
6. Set permission to **Owner**
7. Click **Add**

Repeat step 5 for every GSC property you want to manage from Pulsecheck.

### Current Setup
- **Project**: pulsecheck-487618
- **Account**: `pulsecheck-gsc@pulsecheck-487618.iam.gserviceaccount.com`
- **API Enabled**: Google Search Console API
- **Credentials**: `.env.local` as `GSC_CLIENT_EMAIL` and `GSC_PRIVATE_KEY`
- **GSC Properties**: dalyadvertising.com (Owner)

### Adding New Sites
To inspect URLs for a new site/client:
1. Add the site as a property in GSC
2. Add `pulsecheck-gsc@pulsecheck-487618.iam.gserviceaccount.com` as Owner on that property
3. The site will appear in the dropdown in Pulsecheck

---

## 3. Architecture

### Files Created

| File | Purpose |
|------|---------|
| `lib/gsc-auth.ts` | JWT auth helper — creates authenticated Search Console client |
| `app/api/gsc/sites/route.ts` | GET — lists all GSC properties the service account can access |
| `app/api/gsc/sitemaps/route.ts` | POST — fetches sitemaps for a given site |
| `app/api/gsc/inspect/route.ts` | POST — inspects a single URL |
| `app/api/gsc/inspect-batch/route.ts` | POST — batch inspects URLs + saves results to DB |
| `app/api/gsc/history/route.ts` | POST — returns latest inspection per URL with summary stats |
| `app/gsc/page.tsx` | UI — site selector, URL input, batch inspect, results table |
| `components/Sidebar.tsx` | Updated — added "Search Console" section |

### Database

Table: `GscInspection` (Prisma)

| Column | Type | Description |
|--------|------|-------------|
| id | String | Primary key (cuid) |
| siteUrl | String | GSC property URL |
| pageUrl | String | Inspected page URL |
| verdict | String | PASS, PARTIAL, FAIL, NEUTRAL, ERROR |
| coverageState | String? | Google's coverage description |
| lastCrawlTime | String? | When Google last crawled the page |
| crawledAs | String? | Googlebot desktop/mobile |
| robotsTxtState | String? | Allowed/blocked by robots.txt |
| indexingState | String? | Indexing allowed/blocked |
| checkedAt | DateTime | When we ran the inspection |

Indexes: `(siteUrl, pageUrl)` and `(siteUrl, checkedAt)`

### Environment Variables

Added to `.env.local`:
```
GSC_CLIENT_EMAIL=pulsecheck-gsc@pulsecheck-487618.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Dependencies Added
- `googleapis` (npm)

---

## 4. How to Use

1. Run Pulsecheck: `cd /Users/marco/VS/Bullseye/pulsecheck-launch && npm run dev`
2. Go to `http://localhost:3004/gsc`
3. Select a site from the dropdown
4. Either:
   - Paste URLs (one per line) into the textarea
   - Click "Load from Sitemap" to auto-populate
5. Click "Check Index Status"
6. View results: color-coded by verdict (green = indexed, red = not indexed)
7. Export to CSV if needed

Results are saved to the database automatically. Next time you check, you can compare against previous results to see which URLs got indexed.

---

## 5. Verdict Meanings

| Verdict | Meaning | Color |
|---------|---------|-------|
| PASS | URL is indexed and appearing in search | Green |
| PARTIAL | URL is indexed but may have issues | Yellow |
| FAIL | URL is not indexed | Red |
| NEUTRAL | URL status is unclear | Gray |
| ERROR | API request failed for this URL | Red |

---

## 6. Rate Limits

- The URL Inspection API allows ~2,000 requests/day per property
- The batch endpoint adds a 200ms delay between requests to avoid throttling
- For a 60-page site like dalyadvertising, this is not a concern
- For larger sites (1,000+ pages), run in batches across multiple days

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| "No sites found" | Service account not added as Owner in GSC |
| "403 Forbidden" | Service account lacks Owner permission on that property |
| "Search Console API has not been enabled" | Enable it at console.cloud.google.com > APIs & Services > Enable APIs |
| "Invalid grant" | GSC_PRIVATE_KEY may have incorrect escaping — ensure `\n` are preserved in .env.local |
| Empty sitemap results | Site may not have a sitemap submitted in GSC — paste URLs manually instead |

---

## 8. Future Improvements

- [ ] Dashboard showing indexed % per site over time (chart)
- [ ] Auto-recheck previously failed URLs on a schedule
- [ ] Notifications when a URL moves from FAIL to PASS
- [ ] Integration with IndexNow API for Bing/Copilot
- [ ] Bulk submit via Google Indexing API (currently only for job postings / livestream content)
