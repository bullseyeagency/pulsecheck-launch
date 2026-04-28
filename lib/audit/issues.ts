import { CrawlData, Issue, Severity } from "./types";

/**
 * Analyzes crawl + audit data to detect SEO issues.
 * Returns an array of prioritized issues.
 */
export function detectIssues(
  crawlData: CrawlData,
  pageSpeedData?: Record<string, unknown>,
  keywordData?: Record<string, unknown>,
  backlinksData?: Record<string, unknown>
): Issue[] {
  const issues: Issue[] = [];

  // --- On-Page SEO Issues ---

  if (!crawlData.title) {
    issues.push(issue("missing-title", "Missing Page Title", "The page has no <title> tag. This is critical for SEO rankings and click-through rates.", "critical", "On-Page"));
  } else if (crawlData.title.length < 30) {
    issues.push(issue("short-title", "Page Title Too Short", `Title is only ${crawlData.title.length} characters. Aim for 50-60 characters to maximize SERP visibility.`, "medium", "On-Page"));
  } else if (crawlData.title.length > 65) {
    issues.push(issue("long-title", "Page Title Too Long", `Title is ${crawlData.title.length} characters. It may be truncated in search results. Keep under 60-65 characters.`, "low", "On-Page"));
  }

  if (!crawlData.metaDescription) {
    issues.push(issue("missing-meta-desc", "Missing Meta Description", "No meta description found. This reduces click-through rates from search results.", "high", "On-Page"));
  } else if (crawlData.metaDescription.length < 100) {
    issues.push(issue("short-meta-desc", "Meta Description Too Short", `Meta description is only ${crawlData.metaDescription.length} characters. Aim for 150-160 characters.`, "medium", "On-Page"));
  } else if (crawlData.metaDescription.length > 165) {
    issues.push(issue("long-meta-desc", "Meta Description Too Long", `Meta description is ${crawlData.metaDescription.length} characters and may be truncated. Keep under 160 characters.`, "low", "On-Page"));
  }

  if (!crawlData.canonical) {
    issues.push(issue("missing-canonical", "Missing Canonical Tag", "No canonical URL is set. This can cause duplicate content issues.", "high", "Technical"));
  }

  // Headings
  const h1Count = crawlData.headingCounts["h1"] || 0;
  if (h1Count === 0) {
    issues.push(issue("missing-h1", "Missing H1 Tag", "No H1 heading found. Every page should have exactly one H1.", "critical", "On-Page"));
  } else if (h1Count > 1) {
    issues.push(issue("multiple-h1", "Multiple H1 Tags", `Found ${h1Count} H1 tags. Use only one H1 per page for clear content hierarchy.`, "medium", "On-Page"));
  }

  // Schema / Structured Data
  if (crawlData.jsonLd.length === 0) {
    issues.push(issue("no-schema", "No Structured Data (JSON-LD)", "No JSON-LD structured data found. Adding schema markup improves rich snippet eligibility.", "high", "Structured Data"));
  }

  // Open Graph
  if (!crawlData.ogTags.title || !crawlData.ogTags.description) {
    issues.push(issue("incomplete-og", "Incomplete Open Graph Tags", "Missing OG title or description. Social shares will not display optimally.", "medium", "Social"));
  }
  if (!crawlData.ogTags.image) {
    issues.push(issue("no-og-image", "Missing OG Image", "No og:image tag found. Social shares will lack a preview image.", "medium", "Social"));
  }

  // robots.txt
  if (!crawlData.robotsTxt) {
    issues.push(issue("no-robots-txt", "Missing robots.txt", "No robots.txt file found. This file guides search engine crawlers.", "medium", "Technical"));
  }

  // Sitemap
  if (!crawlData.sitemapXml) {
    issues.push(issue("no-sitemap", "Missing XML Sitemap", "No sitemap.xml found. An XML sitemap helps search engines discover and index pages.", "high", "Technical"));
  }

  // Images without alt text
  const noAltImages = crawlData.images.filter((img) => !img.hasAlt);
  if (noAltImages.length > 0) {
    const pct = Math.round((noAltImages.length / crawlData.images.length) * 100);
    issues.push(issue("images-no-alt", "Images Missing Alt Text", `${noAltImages.length} of ${crawlData.images.length} images (${pct}%) lack alt text. Alt text improves accessibility and image SEO.`, noAltImages.length > 5 ? "high" : "medium", "Accessibility"));
  }

  // Word count
  if (crawlData.wordCount < 300) {
    issues.push(issue("thin-content", "Thin Content", `Page has only ${crawlData.wordCount} words. Pages with fewer than 300 words may struggle to rank.`, "high", "Content"));
  }

  // Robots directives
  if (crawlData.robotsDirectives.includes("noindex")) {
    issues.push(issue("noindex", "Page Set to Noindex", "This page has a noindex directive and will not appear in search results.", "critical", "Technical"));
  }
  if (crawlData.robotsDirectives.includes("nofollow")) {
    issues.push(issue("nofollow", "Page Set to Nofollow", "This page has a nofollow directive. Links on this page will not pass authority.", "high", "Technical"));
  }

  // --- PageSpeed Issues ---
  if (pageSpeedData) {
    const mobile = pageSpeedData.mobile as Record<string, unknown> | undefined;
    const desktop = pageSpeedData.desktop as Record<string, unknown> | undefined;

    const mobileScore = extractPsiScore(mobile);
    const desktopScore = extractPsiScore(desktop);

    if (mobileScore !== null && mobileScore < 50) {
      issues.push(issue("poor-mobile-speed", "Poor Mobile PageSpeed Score", `Mobile PageSpeed score is ${mobileScore}/100. Scores below 50 indicate significant performance issues.`, "critical", "Performance"));
    } else if (mobileScore !== null && mobileScore < 75) {
      issues.push(issue("avg-mobile-speed", "Average Mobile PageSpeed Score", `Mobile PageSpeed score is ${mobileScore}/100. Aim for 90+ for optimal performance.`, "high", "Performance"));
    }

    if (desktopScore !== null && desktopScore < 50) {
      issues.push(issue("poor-desktop-speed", "Poor Desktop PageSpeed Score", `Desktop PageSpeed score is ${desktopScore}/100.`, "high", "Performance"));
    }
  }

  // --- Backlinks Issues ---
  if (backlinksData) {
    const bl = backlinksData as Record<string, unknown>;
    const refDomains = bl.referring_domains as number | undefined;
    const backlinksCount = bl.backlinks_count as number | undefined;

    if (refDomains !== undefined && refDomains < 10) {
      issues.push(issue("low-ref-domains", "Low Referring Domain Count", `Only ${refDomains} referring domains found. Building authoritative backlinks is critical for ranking.`, "high", "Off-Page"));
    }

    if (backlinksCount !== undefined && backlinksCount === 0) {
      issues.push(issue("no-backlinks", "No Backlinks Found", "No backlinks were detected. Off-page SEO is essential for domain authority.", "critical", "Off-Page"));
    }
  }

  return issues;
}

function issue(
  id: string,
  title: string,
  description: string,
  severity: Severity,
  category: string
): Issue {
  return { id, title, description, severity, category };
}

function extractPsiScore(data?: Record<string, unknown>): number | null {
  if (!data) return null;
  // Google PSI direct response: lighthouseResult.categories.performance.score
  const lhr = data.lighthouseResult as Record<string, unknown> | undefined;
  const lhrCategories = lhr?.categories as Record<string, { score?: number }> | undefined;
  if (lhrCategories?.performance?.score !== undefined) {
    return Math.round(lhrCategories.performance.score * 100);
  }
  // DataForSEO-wrapped response: categories.performance.score
  const categories = data.categories as Record<string, { score?: number }> | undefined;
  if (categories?.performance?.score !== undefined) {
    return Math.round(categories.performance.score * 100);
  }
  if (typeof data.score === "number") return data.score;
  return null;
}
