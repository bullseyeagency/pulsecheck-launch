# SEO Audit Feature — Design Spec

**Date:** April 13, 2026
**Project:** Pulsecheck (Next.js 16, App Router, port 3004)
**Goal:** Automated SEO audits that replace the manual Claude Code agent workflow, saving tokens and producing consistent branded reports.

---

## 1. Overview

A one-URL-input audit tool that crawls a website, auto-detects industry and location, runs 7 parallel data collection steps against existing DataForSEO and SerpAPI endpoints, and renders a full SEO audit report. Reports are viewable in-app, exportable as branded HTML dashboards, and downloadable as PDF.

### User Flow

```
[Paste URL] → [Crawl + auto-detect] → [Confirm industry/location] → [7 parallel checks] → [Report]
```

### Auth Model

- **Open run, auth to save.** Anyone can paste a URL and run an audit. Saving the audit, exporting HTML/PDF, and viewing past audits requires authentication (existing NextAuth Google OAuth).
- Anonymous audit data is held in-memory/session until the user signs in or leaves.

---

## 2. Routes

### Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/audit` | Input page — paste URL, run audit, confirm detection, view progress | No |
| `/audit/[id]` | Saved audit report view | No (public share link) |
| `/audits` | List of all saved audits for the org | Yes |

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/audit/crawl` | Crawl URL, extract meta/content, detect industry + location |
| `POST` | `/api/audit/run` | Run full 7-step audit after confirmation |
| `GET` | `/api/audit/[id]` | Fetch saved audit data |
| `GET` | `/api/audit/[id]/export/html` | Generate self-contained branded HTML dashboard |
| `GET` | `/api/audit/[id]/export/pdf` | Render HTML export to PDF via Puppeteer |
| `DELETE` | `/api/audit/[id]` | Delete a saved audit |

---

## 3. Database Schema

New Prisma model added to existing schema:

```prisma
model Audit {
  id              String    @id @default(cuid())
  url             String
  domain          String
  industry        String
  location        String
  status          String    @default("pending")
  // Status values: pending → crawling → confirmed → running → complete → failed

  // Raw data from each audit step (stored as JSON)
  crawlData       Json?
  pageSpeedData   Json?
  keywordData     Json?
  rankingsData    Json?
  backlinksData   Json?
  serpData        Json?
  adsData         Json?
  competitorData  Json?

  // Compiled report (executive summary, scores, recommendations)
  report          Json?

  // Ownership (nullable for anonymous runs)
  userId          String?
  organizationId  String?
  user            User?         @relation(fields: [userId], references: [id])
  organization    Organization? @relation(fields: [organizationId], references: [id])

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

Add `audits Audit[]` relation to existing `User` and `Organization` models.

---

## 4. Audit Pipeline

### Step 1: Crawl (`/api/audit/crawl`)

Input: URL
Output: Detected industry, location, and raw crawl data.

**What it extracts:**
- Title tag, meta description, canonical, robots directives
- All heading tags (H1-H6) with hierarchy analysis
- JSON-LD / schema markup (all types found)
- Open Graph and Twitter Card tags
- robots.txt content (fetch `{origin}/robots.txt`)
- sitemap.xml content (fetch `{origin}/sitemap.xml`)
- Internal link inventory (from `<a>` tags)
- NAP (name, address, phone) from page content and footer
- Word count estimate
- Technology detection (platform signals like GHL, WordPress, Shopify from script sources and meta generators)

**Industry detection logic:**
- Parse title tag, meta description, H1s, and page content for industry keywords
- Match against a keyword-to-industry mapping (e.g., "chiropractor|chiropractic|adjustment" → "Chiropractor", "dentist|dental|orthodont" → "Dentist", "plumber|plumbing|drain" → "Plumber")
- Fall back to DataForSEO domain overview category if no match
- If no industry detected, prompt user to enter manually

**Location detection logic:**
- Extract address from page content using address patterns (street + city + state + zip)
- Check JSON-LD `address` field if schema exists
- Parse footer content for city/state patterns
- Fall back to WHOIS or IP geolocation if nothing found on page
- If no location detected, prompt user to enter manually

### Step 2: Confirmation UI

After crawl returns, show a confirmation card on the `/audit` page:

```
We detected:
  Industry: [Chiropractor]     ← editable dropdown/text
  Location: [Wilmington, NC]   ← editable text
  
  [Edit] [Continue →]
```

User can accept or override. On "Continue," the audit record is created and the 7-step pipeline begins.

### Step 3: Full Audit (`/api/audit/run`)

Input: Audit ID (record already created with crawlData, industry, location)
Output: Updates audit record as each step completes.

7 parallel steps:

| # | Step | Source | Existing Endpoint |
|---|------|--------|-------------------|
| 1 | PageSpeed / Lighthouse | DataForSEO | `/api/dataforseo/lighthouse` |
| 2 | Search Volume (auto-generated keyword list) | DataForSEO | `/api/dataforseo/search-volume` |
| 3 | Ranked Keywords | DataForSEO | `/api/dataforseo/ranked-keywords` |
| 4 | Domain Overview + Backlinks | DataForSEO | `/api/dataforseo/domain-overview` + `/api/dataforseo/backlinks-summary` |
| 5 | Organic SERP + Local Pack | SerpAPI | Google Search + Google Maps |
| 6 | Ad Transparency | SerpAPI | Google Ads Transparency Center |
| 7 | Competitor Analysis | DataForSEO | `/api/dataforseo/competitors` + `/api/dataforseo/ranked-keywords` on top 3-5 |

**Keyword auto-generation (Step 2 input):**
- Use DataForSEO `/api/dataforseo/keyword-ideas` with the detected industry + location as seed
- Generate 30-50 relevant keywords automatically
- Include "[industry] [location]", "[industry] near me", condition/service variations
- Feed the generated list into search-volume endpoint

**Competitor analysis (Step 7):**
- From SERP data (Step 5), identify top 3-5 organic competitors by domain
- Run domain-overview on each (DA, backlinks, traffic estimate)
- Run ranked-keywords on each (what they rank for)
- Compute keyword gap: keywords competitors rank for that the target domain doesn't
- Include competitor Local Pack data (ratings, review counts) from Step 5

**Progress tracking:**
- Each step updates the audit record's JSON column as it completes
- Frontend polls `/api/audit/[id]` on an interval to update progress bar
- Status field transitions: `confirmed` → `running` → `complete` (or `failed`)
- Progress is derived from which JSON columns are non-null (0/7 → 7/7)

---

## 5. Report View (`/audit/[id]`)

Renders the completed audit as a dashboard using Pulsecheck's existing dark theme and component patterns.

### Report Sections

| # | Section | Data Source |
|---|---------|-------------|
| 1 | Executive Summary | Compiled from all steps — score cards for overall grade, PageSpeed, keywords, traffic, competition level |
| 2 | Business Overview | crawlData — detected business info, NAP, platform, services |
| 3 | Technical SEO Issues | crawlData — missing schema, sitemap, canonicals, heading issues, broken links, etc. |
| 4 | PageSpeed Analysis | pageSpeedData — mobile/desktop scores, Core Web Vitals, top opportunities |
| 5 | Current Organic Visibility | rankingsData — keywords ranked, positions, traffic estimate |
| 6 | Keyword Opportunities | keywordData — sortable table with volume, competition, CPC, opportunity tier |
| 7 | Competitive Landscape | competitorData + serpData + adsData — who ranks, who advertises, Local Pack leaders, keyword gaps |
| 8 | Recommendations | Generated from issues found — prioritized action items (P0/P1/P2/P3) |

### Technical Issue Detection Rules

The crawl data is analyzed against these checks to auto-generate the issues list:

| Check | Condition | Severity |
|-------|-----------|----------|
| No JSON-LD schema | No `<script type="application/ld+json">` found | Critical |
| No sitemap | sitemap.xml empty or 404 | Critical |
| Empty robots.txt | robots.txt empty or 404 | Critical |
| No canonical tags | No `<link rel="canonical">` on any page | Critical |
| Wrong/missing title | Title empty, duplicate, or mismatched to page | High |
| Multiple H1 tags | More than 1 H1 per page | High |
| No H1 tag | Page has no H1 | High |
| Missing meta description | No meta description tag | High |
| No OG image | No `og:image` tag | Medium |
| Broken internal links | Links returning 404 | High |
| Duplicate pages | Multiple URLs with identical titles | High |
| Thin content | Word count < 500 on service pages | Medium |
| Missing alt text | Images without alt attributes | Medium |
| Mixed content | HTTP resources on HTTPS page | Medium |
| Mobile viewport missing | No `<meta name="viewport">` | High |
| Heading hierarchy skips | H1 → H3 (skips H2) | Medium |

### Recommendation Engine

Recommendations are auto-generated based on detected issues and keyword data:

- Each technical issue maps to a specific fix recommendation with priority level
- Keyword opportunities generate content recommendations (e.g., "Create a dedicated /stemwave-therapy page targeting 'stemwave therapy' — 4,400 vol/mo, CI 20")
- Competitor gaps generate strategic recommendations (e.g., "Competitors average 300+ Google reviews. Implement review generation strategy.")
- Low PageSpeed generates performance recommendations with specific savings

---

## 6. Export

### HTML Export (`/api/audit/[id]/export/html`)

Generates a self-contained HTML file matching the Daly Advertising dashboard style:

- Dark theme: `#0a0a0a` background, `#141414` surfaces, `#EF5744` accent
- Sticky sidebar nav with section outline
- Sortable tables (vanilla JS, inline)
- Color-coded severity badges
- All CSS/JS inline (zero external dependencies)
- Daly Advertising branding in footer
- Print-friendly styles

The HTML template lives at `/lib/audit/templates/report.html` with Handlebars-style placeholders (`{{section}}`) populated from audit data at export time.

### PDF Export (`/api/audit/[id]/export/pdf`)

Uses Puppeteer to render the HTML export headlessly and return a PDF:

- Dependency: `puppeteer` (dev) + `@sparticuz/chromium` (for Netlify serverless)
- Renders the HTML export at a fixed viewport width
- Applies `@media print` styles for clean page breaks
- Returns `Content-Type: application/pdf`
- Filename: `{domain}-seo-audit-{date}.pdf`

**Netlify consideration:** Puppeteer on Netlify Functions requires `@sparticuz/chromium` for the binary. The function may need increased memory (1024MB) and timeout (30s). If this proves unreliable, fall back to a client-side `window.print()` approach as a simpler alternative.

---

## 7. UI Components

Built using Pulsecheck's existing design system (Tailwind dark theme, Lucide icons, Framer Motion).

### `/audit` Page

```
┌─────────────────────────────────────────┐
│  SEO Audit                              │
│                                         │
│  ┌───────────────────────────┐          │
│  │ Enter website URL         │  [Audit] │
│  └───────────────────────────┘          │
│                                         │
│  ┌─ Confirmation Card ──────────────┐   │
│  │ Industry: [Chiropractor ▾]       │   │
│  │ Location: [Wilmington, NC    ]   │   │
│  │                    [Continue →]   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌─ Progress ───────────────────────┐   │
│  │ ████████░░░░░░░░  4/7 complete   │   │
│  │ ✓ PageSpeed  ✓ Keywords          │   │
│  │ ✓ Rankings   ✓ Backlinks         │   │
│  │ ◻ SERP       ◻ Ads              │   │
│  │ ◻ Competitors                    │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### `/audits` List Page

```
┌──────────────────────────────────────────────────┐
│  Your Audits                          [New Audit]│
│                                                  │
│  Domain           Industry     Date      Status  │
│  ─────────────────────────────────────────────── │
│  ogdenfamily...   Chiropractor  Apr 13   Complete│
│  example.com      Plumber       Apr 10   Complete│
│  test.com         Dentist       Apr 8    Failed  │
└──────────────────────────────────────────────────┘
```

### `/audit/[id]` Report Page

Full dashboard with:
- Action bar: [Export HTML] [Export PDF] [Share Link] [Re-run Audit]
- Tab or scrollable sections matching the 8 report sections
- Sortable tables for keywords and competitors
- Collapsible sections for technical issues

---

## 8. File Structure

New files to create in the Pulsecheck project:

```
app/
  audit/
    page.tsx              # Input + confirmation + progress
    [id]/
      page.tsx            # Report view
  audits/
    page.tsx              # List of saved audits
  api/
    audit/
      crawl/
        route.ts          # POST - crawl URL, detect industry/location
      run/
        route.ts          # POST - orchestrate 7-step audit
      [id]/
        route.ts          # GET - fetch audit, DELETE - remove audit
        export/
          html/
            route.ts      # GET - generate HTML export
          pdf/
            route.ts      # GET - generate PDF export

lib/
  audit/
    crawl.ts              # Site crawling + content extraction (cheerio)
    detect.ts             # Industry + location detection logic
    keywords.ts           # Auto-generate keyword list from industry + location
    issues.ts             # Technical issue detection rules
    recommendations.ts    # Auto-generate recommendations from issues + data
    report.ts             # Compile all data into report summary
    templates/
      report.html         # HTML export template (self-contained)

components/
  audit/
    AuditInput.tsx        # URL input + run button
    ConfirmationCard.tsx  # Industry/location confirmation with edit
    ProgressTracker.tsx   # 7-step progress bar
    ReportDashboard.tsx   # Full report view (8 sections)
    ScoreCard.tsx         # Executive summary score cards
    IssueTable.tsx        # Technical issues with severity badges
    KeywordTable.tsx      # Sortable keyword table
    CompetitorTable.tsx   # Competitor comparison table
    ExportBar.tsx         # Export HTML / PDF / Share buttons
    AuditList.tsx         # Audits list table
```

### New Dependencies

```
cheerio            # HTML parsing for crawl (server-side)
puppeteer          # PDF generation (dev)
@sparticuz/chromium  # Puppeteer binary for Netlify
```

---

## 9. DataForSEO API Cost Estimate

Per audit, based on DataForSEO pricing:

| Call | Cost |
|------|------|
| Lighthouse (1 URL, mobile + desktop) | $0.004 |
| Search Volume (1 call, 30-50 keywords) | $0.075 |
| Keyword Ideas (1 call) | $0.075 |
| Ranked Keywords (target domain) | $0.05 |
| Domain Overview (target domain) | $0.02 |
| Backlinks Summary (target domain) | $0.02 |
| Competitors (1 call) | $0.05 |
| Domain Overview (3-5 competitors) | $0.06-0.10 |
| Ranked Keywords (3-5 competitors) | $0.15-0.25 |
| **Total per audit** | **~$0.50-0.65** |

SerpAPI: ~3 calls (organic SERP, maps, ads transparency) at current plan limits.

Compared to the manual audit which burned ~200K+ Claude tokens ($3-6+), the automated version costs under $1 in API fees.

---

## 10. Sidebar Integration

Add "SEO Audit" to Pulsecheck's existing sidebar navigation (`components/Sidebar.tsx`):

- Icon: `Search` or `FileSearch` from Lucide
- Position: Near the top, grouped with other analysis tools
- Sub-items: "New Audit" (`/audit`), "All Audits" (`/audits`)

---

*Spec prepared by Daly Advertising — April 13, 2026*
