import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchSerpAPI } from "@/lib/serpapi";
import { sendAuditReadyEmail } from "@/lib/email";
import { detectIssues } from "@/lib/audit/issues";
import { generateRecommendations } from "@/lib/audit/recommendations";
import { compileReport } from "@/lib/audit/report";
import { CrawlData } from "@/lib/audit/types";
import { Prisma } from "@prisma/client";

const DATAFORSEO_BASE = "https://api.dataforseo.com/v3";

function getDataForSEOAuth(): string {
  const login = process.env.DATAFORSEO_LOGIN || "";
  const password = process.env.DATAFORSEO_PASSWORD || "";
  return Buffer.from(`${login}:${password}`).toString("base64");
}

async function dataForSEOPost(
  endpoint: string,
  payload: unknown[]
): Promise<unknown> {
  const auth = getDataForSEOAuth();
  const response = await fetch(`${DATAFORSEO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
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

    // Check session (optional - unauthenticated audits allowed)
    let userId: string | undefined;
    let organizationId: string | undefined;
    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id;
        organizationId = session.user.organizationId;
      }
    } catch {
      // No session, continue as anonymous
    }

    // Create audit record
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

    const auditId = audit.id;

    // Fire-and-forget background processing so we can return the ID immediately
    processAuditBackground(auditId, {
      url,
      domain,
      industry: industry || "general business",
      location: location || "United States",
      crawlData,
      notifyEmail: audit.notifyEmail ?? undefined,
    });

    return NextResponse.json({ id: auditId });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to run audit";
    console.error("[audit/run]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- Background Processor ---

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

  try {
    // Run all 7 steps in parallel, updating DB after each one completes individually
    await Promise.allSettled([
      runPageSpeed(url).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { pageSpeedData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] pageSpeed failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { pageSpeedData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runKeywordResearch(industry, location).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { keywordData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] keywords failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { keywordData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runRankedKeywords(domain).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { rankingsData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] rankings failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { rankingsData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runDomainOverview(domain).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { backlinksData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] domain overview failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { backlinksData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runSerpAnalysis(industry, location).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { serpData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] serp failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { serpData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runAdTransparency(domain, industry, location).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { adsData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] ads failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { adsData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runCompetitorAnalysis(industry, location, domain).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { competitorData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] competitors failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { competitorData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runGBP(domain, industry, location, crawlData).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { gbpData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] gbp failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { gbpData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runMetaAds(domain, crawlData).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { metaAdsData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] meta ads failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { metaAdsData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),

      runExaResearch(domain, location, crawlData).then(async (data) => {
        await prisma.audit.update({
          where: { id: auditId },
          data: { exaData: (data ?? Prisma.DbNull) as Prisma.InputJsonValue },
        });
      }).catch(async (err) => {
        console.error("[audit] exa failed:", err);
        await prisma.audit.update({
          where: { id: auditId },
          data: { exaData: { error: String(err) } as Prisma.InputJsonValue },
        });
      }),
    ]);

    // All steps done — fetch latest data, compile report, mark complete
    const auditRecord = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!auditRecord) return;

    const pageSpeedData = auditRecord.pageSpeedData as Record<string, unknown> | null;
    const keywordData = auditRecord.keywordData as Record<string, unknown> | null;
    const rankingsData = auditRecord.rankingsData as Record<string, unknown> | null;
    const domainData = auditRecord.backlinksData as Record<string, unknown> | null;
    const serpData = auditRecord.serpData as Record<string, unknown> | null;
    const competitorData = auditRecord.competitorData as Record<string, unknown> | null;

    const issues = detectIssues(
      crawlData,
      pageSpeedData ?? undefined,
      keywordData ?? undefined,
      domainData ?? undefined
    );
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

    // AI analysis via agent-api (runs after data collection for richer context)
    const aiAnalysis = await runAgentAnalysis(domain, crawlData, pageSpeedData, report.scores).catch(
      (err) => { console.error("[audit/run] agent analysis failed:", err); return null; }
    );

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

    // Notify if email was provided
    if (notifyEmail) {
      sendAuditReadyEmail({
        to: notifyEmail,
        domain,
        auditId,
        industry,
        location,
      }).catch((err) => console.error("[audit/run] email failed:", err));
    }
  } catch (err) {
    console.error("[audit/run] background processing failed:", err);
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "failed" },
    }).catch(() => {});
  }
}

// --- Step Implementations ---

async function runPageSpeed(url: string) {
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
    mobile: extractResult(mobile),
    desktop: extractResult(desktop),
  };
}

async function runKeywordResearch(industry: string, location: string) {
  // Get keyword ideas
  const seeds = [
    `${industry} ${location}`,
    `${industry} near me`,
    `best ${industry} ${location}`,
  ];

  const ideasResult = await dataForSEOPost(
    "/dataforseo_labs/google/keyword_ideas/live",
    [
      {
        keywords: seeds,
        language_name: "English",
        location_code: 2840,
        limit: 50,
      },
    ]
  );

  // Extract keywords from ideas
  const ideas = ideasResult as Record<string, unknown> | null;
  const items = (ideas as any)?.items || [];
  const keywords = items
    .map((item: Record<string, unknown>) => item.keyword as string)
    .filter(Boolean)
    .slice(0, 50);

  if (keywords.length === 0) {
    return { ideas: ideasResult, volume: null, items: [] };
  }

  // Get search volume
  const volumeResult = await dataForSEOPost(
    "/keywords_data/google_ads/search_volume/live",
    [
      {
        keywords,
        language_name: "English",
        location_code: 2840,
      },
    ]
  );

  return {
    ideas: ideasResult,
    volume: volumeResult,
    items: volumeResult || [],
  };
}

async function runRankedKeywords(domain: string) {
  return dataForSEOPost(
    "/dataforseo_labs/google/ranked_keywords/live",
    [
      {
        target: domain,
        language_name: "English",
        location_code: 2840,
        limit: 100,
      },
    ]
  );
}

async function runDomainOverview(domain: string) {
  const [overview, backlinks] = await Promise.allSettled([
    dataForSEOPost("/dataforseo_labs/google/domain_rank_overview/live", [
      { target: domain },
    ]),
    dataForSEOPost("/backlinks/summary/live", [{ target: domain }]),
  ]);

  return {
    overview: extractResult(overview),
    backlinks: extractResult(backlinks),
    // Flatten common fields for issue detection
    ...((extractResult(backlinks) as Record<string, unknown>) || {}),
  };
}

async function runSerpAnalysis(industry: string, location: string) {
  const query = `${industry} ${location}`;

  const [googleSearch, googleMaps] = await Promise.allSettled([
    searchSerpAPI({
      engine: "google",
      q: query,
      location,
      num: 20,
    }),
    searchSerpAPI({
      engine: "google_maps",
      q: query,
      ll: undefined, // SerpAPI will geocode from query
    }),
  ]);

  return {
    organic: extractResult(googleSearch),
    maps: extractResult(googleMaps),
  };
}

async function runAdTransparency(
  domain: string,
  industry: string,
  location: string
) {
  const [adTransparency, paidAds] = await Promise.allSettled([
    searchSerpAPI({
      engine: "google_ads_transparency_center",
      advertiser_id: domain,
    }).catch(() => null),
    searchSerpAPI({
      engine: "google",
      q: `${industry} ${location}`,
      location,
      num: 10,
    }).then((data: Record<string, unknown>) => ({
      ads: (data as any).ads || [],
    })),
  ]);

  return {
    transparency: extractResult(adTransparency),
    paidAds: extractResult(paidAds),
  };
}

async function runCompetitorAnalysis(
  industry: string,
  location: string,
  ownDomain: string
) {
  // Get SERP to find competitors — fall back to industry-only query if location fails
  let serpData: Record<string, unknown> = {};
  try {
    serpData = await searchSerpAPI({
      engine: "google",
      q: `${industry} ${location}`,
      location,
      num: 20,
    });
  } catch {
    try {
      serpData = await searchSerpAPI({ engine: "google", q: industry, num: 20 });
    } catch {
      return { competitors: [], competitorDomains: [] };
    }
  }

  const organicResults = (serpData as Record<string, unknown[]>)
    .organic_results || [];

  // Extract unique competitor domains (exclude our own)
  const competitorDomains: string[] = [];
  for (const result of organicResults as Array<Record<string, string>>) {
    try {
      const resultDomain = new URL(result.link || "").hostname.replace(
        /^www\./,
        ""
      );
      if (
        resultDomain !== ownDomain &&
        !competitorDomains.includes(resultDomain) &&
        !resultDomain.includes("yelp.com") &&
        !resultDomain.includes("facebook.com") &&
        !resultDomain.includes("google.com") &&
        !resultDomain.includes("yellowpages.com") &&
        !resultDomain.includes("bbb.org")
      ) {
        competitorDomains.push(resultDomain);
      }
    } catch {
      // Skip invalid URLs
    }
    if (competitorDomains.length >= 5) break;
  }

  // Get data for each competitor
  const competitorPromises = competitorDomains.map(async (compDomain) => {
    const [overview, rankings] = await Promise.allSettled([
      dataForSEOPost("/dataforseo_labs/google/domain_rank_overview/live", [
        { target: compDomain },
      ]),
      dataForSEOPost("/dataforseo_labs/google/ranked_keywords/live", [
        {
          target: compDomain,
          language_name: "English",
          location_code: 2840,
          limit: 50,
        },
      ]),
    ]);

    const overviewData = extractResult(overview) as Record<
      string,
      unknown
    > | null;
    const rankingsDataResult = extractResult(rankings) as Record<
      string,
      unknown
    > | null;

    return {
      domain: compDomain,
      overview: overviewData,
      rankings: rankingsDataResult,
      keywords:
        (rankingsDataResult as any)?.total_count ||
        ((rankingsDataResult as any)?.items as unknown[])?.length ||
        0,
      traffic: (overviewData as any)?.etv || 0,
      overlap: 0, // Would require intersection analysis
    };
  });

  const competitors = await Promise.all(competitorPromises);

  return { competitors, competitorDomains };
}

// --- New Steps: GBP, Meta Ads, Exa ---

function getBusinessName(crawlData: CrawlData, domain: string): string {
  const nap = (crawlData as any)?.nap;
  return nap?.name || (crawlData as any)?.title || domain;
}

async function runGBP(
  domain: string,
  industry: string,
  location: string,
  crawlData: CrawlData
) {
  const businessName = getBusinessName(crawlData, domain);
  const q = `${businessName} ${location}`.trim() || `${industry} ${location}`;

  const data = await searchSerpAPI({ engine: "google_maps", q });
  const place =
    (data as any).local_results?.[0] || (data as any).place_results || null;

  if (!place) return { found: false };

  return {
    found: true,
    rating: place.rating || null,
    reviews: place.reviews || place.user_ratings_total || null,
    address: place.address || null,
    place_id: place.place_id || null,
    data_id: place.data_id || null,
    categories: place.type || place.types || null,
    phone: place.phone || null,
  };
}

async function runMetaAds(domain: string, crawlData: CrawlData) {
  const businessName = getBusinessName(crawlData, domain);

  const data = await searchSerpAPI({
    engine: "meta_ad_library",
    q: businessName,
    ad_reached_countries: "US",
  });

  const ads = (data as any).ads || [];
  if (ads.length === 0) return { running: false, ad_count: 0 };

  return {
    running: true,
    ad_count: ads.length,
    platforms: [
      ...new Set(ads.flatMap((a: any) => a.publisher_platforms || [])),
    ],
    sample:
      ads[0]?.ad_creative_bodies?.[0] ||
      ads[0]?.ad_creative_link_titles?.[0] ||
      null,
    page_name: ads[0]?.page_name || null,
  };
}

async function runExaResearch(
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
        required: [
          "company_name",
          "years_in_business",
          "services",
          "pain_points",
          "reputation",
          "digital_presence",
        ],
        properties: {
          company_name: { type: "string" },
          years_in_business: {
            type: "string",
            description: 'How long in business, or "unknown"',
          },
          services: {
            type: "array",
            description: "Main services offered",
            items: { type: "string" },
          },
          pain_points: {
            type: "array",
            description:
              "Digital marketing weaknesses: poor SEO, no ads, bad reviews, outdated site, etc.",
            items: { type: "string" },
          },
          reputation: {
            type: "string",
            description: "One sentence summary of their online reputation",
          },
          digital_presence: {
            type: "string",
            description: "Overall digital marketing strength: weak / moderate / strong",
          },
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

// --- Agent API Analysis ---

async function runAgentAnalysis(
  domain: string,
  crawlData: CrawlData,
  pageSpeedData: Record<string, unknown> | null,
  scores: { pagespeedMobile: number; pagespeedDesktop: number; seo: number; accessibility: number }
): Promise<string | null> {
  const agentApiUrl = process.env.AGENT_API_URL || 'http://localhost:3005';
  const agentApiKey = process.env.AGENT_API_KEY || '';

  const imagesWithoutAlt = crawlData.images.filter((img) => !img.hasAlt).length;
  const schemaTypes = crawlData.jsonLd.map((j) => j['@type']).filter(Boolean).join(', ') || 'none';

  const message = `Run an SEO audit on ${domain}.

Crawl data:
- Title: ${crawlData.title || 'missing'}
- Meta description: ${crawlData.metaDescription || 'missing'}
- Canonical: ${crawlData.canonical || 'missing'}
- Robots directives: ${crawlData.robotsDirectives.join(', ') || 'none'}
- Robots.txt: ${crawlData.robotsTxt ? 'present' : 'missing'}
- Sitemap: ${crawlData.sitemapXml ? 'present' : 'missing'}
- H1: ${crawlData.headings.find((h) => h.level === 1)?.text || 'missing'}
- Total headings: ${crawlData.headings.length}
- Word count: ${crawlData.wordCount}
- Internal links: ${crawlData.internalLinks.length}
- Images: ${crawlData.images.length} total, ${imagesWithoutAlt} missing alt text
- Schema markup: ${schemaTypes}
- NAP: ${crawlData.nap.address || 'not found'}

Performance scores (0–100):
- Mobile speed: ${scores.pagespeedMobile}
- Desktop speed: ${scores.pagespeedDesktop}
- SEO (Lighthouse): ${scores.seo}
- Accessibility: ${scores.accessibility}

Produce a prioritized audit covering crawlability, performance, on-page SEO, and quick wins. Be specific to this domain's actual data.`;

  const res = await fetch(`${agentApiUrl}/api/agents/marketing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(agentApiKey && { 'x-api-key': agentApiKey }),
    },
    body: JSON.stringify({ message, skill: 'seo-audit' }),
  });

  if (!res.ok) throw new Error(`agent-api ${res.status}: ${await res.text()}`);
  const data = await res.json() as { reply?: string };
  return data.reply || null;
}

// --- Utility ---

function extractResult(
  settled: PromiseSettledResult<unknown>
): unknown | null {
  if (settled.status === "fulfilled") return settled.value;
  console.error("[audit/run] Step failed:", settled.reason);
  return null;
}
