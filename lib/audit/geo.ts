import { CrawlData, Issue } from "./types";

export interface GeoSignals {
  // AI Crawlability (15%)
  blockedBots: string[];
  hasLlmsTxt: boolean;
  hasCanonical: boolean;
  hasDateModified: boolean;
  httpsOnly: boolean;
  // Structure & Position (25%)
  hasArticleSchema: boolean;
  hasFaqSchema: boolean;
  hasHowToSchema: boolean;
  h1Present: boolean;
  wordCount: number;
  // Authority Signals (25%)
  hasAuthorSchema: boolean;
  hasAuthorSameAs: boolean;
  hasOrganizationSchema: boolean;
  hasDatePublished: boolean;
  // Evidence Density (35%)
  hasStatisticsOrNumbers: boolean;
  hasCitations: boolean;
  hasNamedEntities: boolean;
  schemaCount: number;
}

export interface GeoResult {
  score: number;
  grade: string;
  label: string;
  signals: GeoSignals;
  issues: Issue[];
}

const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "anthropic-ai",
  "ChatGPT-User",
  "Bytespider",
];

export function runGeoAudit(crawlData: CrawlData, llmsTxt?: string): GeoResult {
  const issues: Issue[] = [];
  const robots = crawlData.robotsTxt || "";
  const jsonLd = crawlData.jsonLd || [];

  // --- AI Crawlability ---
  const blockedBots = AI_BOTS.filter((bot) => {
    const botSection = robots.match(
      new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?(?=User-agent:|$)`, "i")
    );
    return botSection && /Disallow:\s*\//i.test(botSection[0]);
  });

  const hasLlmsTxt = !!llmsTxt && llmsTxt.length > 0;
  const hasCanonical = !!crawlData.canonical;
  const hasDateModified = jsonLd.some((item) => item.dateModified);
  const httpsOnly = crawlData.url.startsWith("https://");

  // --- Structure & Position ---
  const hasArticleSchema = jsonLd.some((item) =>
    ["Article", "BlogPosting", "NewsArticle", "TechArticle"].includes(
      String(item["@type"] || "")
    )
  );
  const hasFaqSchema = jsonLd.some((item) => item["@type"] === "FAQPage");
  const hasHowToSchema = jsonLd.some((item) => item["@type"] === "HowTo");
  const h1Present = (crawlData.headingCounts?.["h1"] || 0) > 0;

  // --- Authority Signals ---
  const hasAuthorSchema = jsonLd.some(
    (item) => item.author || item["@type"] === "Person"
  );
  const hasAuthorSameAs = jsonLd.some((item) => {
    const author = item.author as Record<string, unknown> | undefined;
    return author?.sameAs;
  });
  const hasOrganizationSchema = jsonLd.some((item) =>
    ["Organization", "LocalBusiness", "Corporation"].includes(
      String(item["@type"] || "")
    )
  );
  const hasDatePublished = jsonLd.some((item) => item.datePublished);

  // --- Evidence Density (heuristic from page text signals) ---
  const allText = [
    crawlData.title,
    crawlData.metaDescription,
    (crawlData.headings || []).map((h) => h.text).join(" "),
  ].join(" ");

  // Check for numbers with units — proxy for statistics
  const hasStatisticsOrNumbers = /\d+(\.\d+)?(%|mph|kg|lb|ft|sqft|°|hrs?|days?|years?|\+)/i.test(allText);
  // Check for citation signals (source, study, according to, per, data from)
  const hasCitations = /\b(according to|source:|study|research|data from|per the|cited by|published by|report by)\b/i.test(allText);
  // Named entities (capitalized proper noun runs)
  const namedEntityMatches = allText.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g) || [];
  const hasNamedEntities = namedEntityMatches.length >= 3;

  // --- Scoring ---
  // Weight: Evidence Density 35%, Structure 25%, Authority 25%, Crawlability 15%

  const crawlScore =
    ((blockedBots.length === 0 ? 30 : 0) +
      (hasLlmsTxt ? 20 : 0) +
      (hasCanonical ? 25 : 0) +
      (hasDateModified ? 15 : 0) +
      (httpsOnly ? 10 : 0)) *
    0.15;

  const structureScore =
    ((hasArticleSchema ? 30 : 0) +
      (hasFaqSchema ? 25 : 0) +
      (hasHowToSchema ? 15 : 0) +
      (h1Present ? 20 : 0) +
      (crawlData.wordCount > 500 ? 10 : 0)) *
    0.25;

  const authorityScore =
    ((hasAuthorSchema ? 35 : 0) +
      (hasAuthorSameAs ? 25 : 0) +
      (hasOrganizationSchema ? 25 : 0) +
      (hasDatePublished ? 15 : 0)) *
    0.25;

  const evidenceScore =
    ((hasStatisticsOrNumbers ? 40 : 0) +
      (hasCitations ? 35 : 0) +
      (hasNamedEntities ? 25 : 0)) *
    0.35;

  const score = Math.round(crawlScore + structureScore + authorityScore + evidenceScore);

  // --- Issues ---
  if (blockedBots.length > 0) {
    issues.push({
      id: "geo-blocked-bots",
      title: `AI crawlers blocked: ${blockedBots.join(", ")}`,
      description: `Your robots.txt blocks ${blockedBots.join(", ")}. These bots power ChatGPT, Claude, and Perplexity — blocking them means you won't appear in AI-generated answers.`,
      severity: "critical",
      category: "GEO",
    });
  }
  if (!hasArticleSchema && !hasFaqSchema) {
    issues.push({
      id: "geo-no-content-schema",
      title: "No content schema (Article or FAQPage)",
      description: "AI engines heavily rely on structured data to extract and cite your content. Add Article or FAQPage schema so your answers can be extracted cleanly.",
      severity: "high",
      category: "GEO",
    });
  }
  if (!hasAuthorSchema) {
    issues.push({
      id: "geo-no-author",
      title: "No author markup found",
      description: "AI engines like Claude and Perplexity prioritize content with identifiable authors. Add a Person schema with name and credentials.",
      severity: "high",
      category: "GEO",
    });
  }
  if (!hasDateModified) {
    issues.push({
      id: "geo-no-date-modified",
      title: "No dateModified in schema",
      description: "Perplexity and ChatGPT heavily weight recency. Add a dateModified field to your schema so AI engines know your content is current.",
      severity: "medium",
      category: "GEO",
    });
  }
  if (!hasLlmsTxt) {
    issues.push({
      id: "geo-no-llms-txt",
      title: "No llms.txt file",
      description: "llms.txt is an emerging standard that tells AI crawlers which content is most valuable. Adding it gives you more control over how AI engines represent your site.",
      severity: "low",
      category: "GEO",
    });
  }

  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : score >= 25 ? "D" : "F";
  const label =
    grade === "A" ? "Strong AI visibility" :
    grade === "B" ? "Good AI presence" :
    grade === "C" ? "Partial AI visibility" :
    grade === "D" ? "Poor AI visibility" :
    "Not visible to AI engines";

  return {
    score,
    grade,
    label,
    signals: {
      blockedBots,
      hasLlmsTxt,
      hasCanonical,
      hasDateModified,
      httpsOnly,
      hasArticleSchema,
      hasFaqSchema,
      hasHowToSchema,
      h1Present,
      wordCount: crawlData.wordCount,
      hasAuthorSchema,
      hasAuthorSameAs,
      hasOrganizationSchema,
      hasDatePublished,
      hasStatisticsOrNumbers,
      hasCitations,
      hasNamedEntities,
      schemaCount: jsonLd.length,
    },
    issues,
  };
}
