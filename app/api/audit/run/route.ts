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
import { sendAuditReadySms } from "@/lib/sms";
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
    const { url, domain, industry, location, crawlData, notifyEmail, notifyPhone, contactName } = body as {
      url: string;
      domain: string;
      industry: string;
      location: string;
      crawlData: CrawlData;
      notifyEmail?: string;
      notifyPhone?: string;
      contactName?: string;
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
        ...(notifyPhone && { contactPhone: notifyPhone }),
        ...(contactName && { contactName }),
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
      notifyPhone: audit.contactPhone ?? undefined,
    });

    return NextResponse.json({ id: audit.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to run audit";
    console.error("[audit/run]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- DB Write Helper ---

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

// --- 4-Phase Background Processor ---

async function processAuditBackground(
  auditId: string,
  params: {
    url: string;
    domain: string;
    industry: string;
    location: string;
    crawlData: CrawlData;
    notifyEmail?: string;
    notifyPhone?: string;
  }
) {
  const { url, domain, industry, location, crawlData, notifyEmail, notifyPhone } = params;
  const businessName = getBusinessName(crawlData, domain);

  try {
    // ── Phase 1: All parallel — no dependencies ───────────────────────────────
    // Autocomplete is fast (~200ms) and runs here so its seeds are ready for Phase 2
    const [autocompleteSettled] = await Promise.allSettled([
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

    // Use autocomplete seeds or fall back to basic seeds
    const seeds =
      autocompleteSettled.status === "fulfilled" && autocompleteSettled.value
        ? autocompleteSettled.value.seeds
        : [`${industry} ${location}`, `${industry} near me`, `best ${industry} ${location}`];

    // ── Phase 2: Keywords + Competitors (depend on autocomplete seeds) ────────
    const [keywordSettled, competitorSettled] = await Promise.allSettled([
      saveStep(auditId, "keywordData", runKeywords(seeds)),
      saveStep(auditId, "competitorData", runCompetitors(seeds, domain)),
    ]);

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
    await compileAndFinalize(auditId, crawlData, { domain, industry, location, notifyEmail, notifyPhone });
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
  params: { domain: string; industry: string; location: string; notifyEmail?: string; notifyPhone?: string }
) {
  const { domain, industry, location, notifyEmail, notifyPhone } = params;

  const auditRecord = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!auditRecord) return;

  const pageSpeedData = auditRecord.pageSpeedData as Record<string, unknown> | null;
  const keywordData = auditRecord.keywordData as Record<string, unknown> | null;
  const rankingsData = auditRecord.rankingsData as Record<string, unknown> | null;
  const domainData = auditRecord.backlinksData as Record<string, unknown> | null;
  const serpData = auditRecord.serpData as Record<string, unknown> | null;
  const competitorData = auditRecord.competitorData as Record<string, unknown> | null;

  // GEO + E-E-A-T scores (computed from crawl + backlinks, no external calls)
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

  if (notifyEmail) {
    sendAuditReadyEmail({
      to: notifyEmail,
      domain,
      auditId,
      industry,
      location,
    }).catch((err) => console.error("[audit/run] email failed:", err));
  }

  if (notifyPhone) {
    sendAuditReadySms({
      phone: notifyPhone,
      domain,
      auditId,
    }).catch((err) => console.error("[audit/run] sms failed:", err));
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
