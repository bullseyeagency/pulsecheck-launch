import { CrawlData, HeadingTag, ImageInfo, OgTags, TwitterCard } from "./types";

/**
 * Crawls a URL and extracts SEO-relevant data from the page HTML,
 * robots.txt, and sitemap.xml.
 */
export async function crawlSite(url: string): Promise<CrawlData> {
  // Normalize URL
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  const parsed = new URL(normalized);
  const domain = parsed.hostname.replace(/^www\./, "");
  const origin = parsed.origin;

  // Fetch page HTML + robots.txt + sitemap + about/contact/llms.txt in parallel
  const [htmlResponse, robotsText, sitemapText, aboutHtml, contactHtml, llmsTxt] = await Promise.all([
    fetchWithTimeout(normalized, 15000),
    fetchTextSafe(`${origin}/robots.txt`),
    fetchTextSafe(`${origin}/sitemap.xml`),
    fetchTextSafe(`${origin}/about`),
    fetchTextSafe(`${origin}/contact`),
    fetchTextSafe(`${origin}/llms.txt`),
  ]);

  const html = await htmlResponse.text();
  // Merge about/contact HTML for NAP/location extraction only
  const supplementalHtml = [aboutHtml, contactHtml].filter(Boolean).join(' ');

  // Parse HTML data
  const title = extractTag(html, "title");
  const metaDescription = extractMeta(html, "description");
  const canonical = extractLink(html, "canonical");
  const robotsDirectives = extractMeta(html, "robots")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const headings = extractHeadings(html);
  const headingCounts: Record<string, number> = {};
  headings.forEach((h) => {
    const key = `h${h.level}`;
    headingCounts[key] = (headingCounts[key] || 0) + 1;
  });

  const jsonLd = extractJsonLd(html);
  const supplementalJsonLd = extractJsonLd(supplementalHtml);
  const ogTags = extractOgTags(html);
  const twitterCard = extractTwitterCard(html);
  const internalLinks = extractInternalLinks(html, domain);
  const images = extractImages(html);
  const wordCount = extractWordCount(html);
  const technologies = detectTechnologies(html);
  // Try homepage first, fall back to about/contact pages for NAP
  const homeNap = extractNAP(html, jsonLd);
  const suppNap = extractNAP(supplementalHtml, supplementalJsonLd);
  const nap = {
    name: homeNap.name || suppNap.name,
    address: homeNap.address || suppNap.address,
    phone: homeNap.phone || suppNap.phone,
  };
  // Merge all JSON-LD so detect.ts can use address from any page
  const allJsonLd = [...jsonLd, ...supplementalJsonLd];

  // Extract plain text from contact/about pages for location detection
  const supplementalText = [aboutHtml, contactHtml]
    .map(h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .join(' ')
    .slice(0, 5000);

  return {
    url: normalized,
    domain,
    title,
    metaDescription,
    canonical,
    robotsDirectives,
    headings,
    headingCounts,
    jsonLd: allJsonLd,
    ogTags,
    twitterCard,
    robotsTxt: robotsText,
    sitemapXml: sitemapText.substring(0, 5000),
    internalLinks: internalLinks.slice(0, 100),
    nap,
    supplementalText,
    llmsTxt: llmsTxt || undefined,
    wordCount,
    technologies,
    images: images.slice(0, 50),
  };
}

// --- Helpers ---

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PulsecheckBot/1.0; +https://pulsecheck.dalyadvertising.com)",
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTextSafe(url: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(url, 10000);
    if (!res.ok) return "";
    return res.text();
  } catch {
    return "";
  }
}

function extractTag(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function extractMeta(html: string, name: string): string {
  const match = html.match(
    new RegExp(
      `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`,
      "i"
    )
  );
  if (match) return match[1].trim();
  const match2 = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`,
      "i"
    )
  );
  return match2?.[1]?.trim() || "";
}

function extractLink(html: string, rel: string): string {
  const match = html.match(
    new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["']`, "i")
  );
  if (match) return match[1].trim();
  const match2 = html.match(
    new RegExp(`<link[^>]*href=["']([^"']*)["'][^>]*rel=["']${rel}["']`, "i")
  );
  return match2?.[1]?.trim() || "";
}

function extractHeadings(html: string): HeadingTag[] {
  const headings: HeadingTag[] = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]+>/g, "").trim(),
    });
  }
  return headings;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }
  return results;
}

function extractOgTags(html: string): OgTags {
  const get = (prop: string) => {
    const match = html.match(
      new RegExp(
        `<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`,
        "i"
      )
    );
    return match?.[1]?.trim();
  };
  return {
    title: get("title"),
    description: get("description"),
    image: get("image"),
    url: get("url"),
    type: get("type"),
    siteName: get("site_name"),
  };
}

function extractTwitterCard(html: string): TwitterCard {
  const get = (name: string) => {
    const match = html.match(
      new RegExp(
        `<meta[^>]*name=["']twitter:${name}["'][^>]*content=["']([^"']*)["']`,
        "i"
      )
    );
    return match?.[1]?.trim();
  };
  return {
    card: get("card"),
    title: get("title"),
    description: get("description"),
    image: get("image"),
    site: get("site"),
  };
}

function extractInternalLinks(html: string, domain: string): string[] {
  const links: string[] = [];
  const regex = /href=["'](https?:\/\/[^"']+|\/[^"']*)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith("/") || href.includes(domain)) {
      links.push(href);
    }
  }
  return [...new Set(links)];
}

function extractImages(html: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  const regex = /<img[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch?.[1] || "",
        hasAlt: !!altMatch,
      });
    }
  }
  return images;
}

function extractWordCount(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function detectTechnologies(html: string): string[] {
  const techs: string[] = [];
  if (html.includes("wp-content") || html.includes("wp-includes"))
    techs.push("WordPress");
  if (html.includes("Shopify.theme") || html.includes("cdn.shopify.com"))
    techs.push("Shopify");
  if (html.includes("__next") || html.includes("_next/static"))
    techs.push("Next.js");
  if (html.includes("gatsby")) techs.push("Gatsby");
  if (html.includes("wix.com")) techs.push("Wix");
  if (html.includes("squarespace.com")) techs.push("Squarespace");
  if (html.includes("elementor")) techs.push("Elementor");
  if (html.includes("webflow.com")) techs.push("Webflow");
  if (html.includes("gtag(") || html.includes("google-analytics.com"))
    techs.push("Google Analytics");
  if (html.includes("gtm.js") || html.includes("googletagmanager.com"))
    techs.push("Google Tag Manager");
  if (html.includes("fbq(") || html.includes("facebook.net/en_US/fbevents"))
    techs.push("Meta Pixel");
  return techs;
}

function extractNAP(
  html: string,
  jsonLd: Record<string, unknown>[]
): { name: string; address: string; phone: string } {
  for (const item of jsonLd) {
    if (
      item["@type"] === "LocalBusiness" ||
      item["@type"] === "Organization"
    ) {
      const address = item.address as Record<string, string> | undefined;
      return {
        name: (item.name as string) || "",
        address: address
          ? `${address.streetAddress || ""} ${address.addressLocality || ""} ${address.addressRegion || ""} ${address.postalCode || ""}`.trim()
          : "",
        phone: (item.telephone as string) || "",
      };
    }
  }
  return { name: "", address: "", phone: "" };
}
