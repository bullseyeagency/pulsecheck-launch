import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";

/**
 * Fetches sitemap URLs directly from a site (no GSC needed).
 * Tries sitemap-index.xml, sitemap.xml, then robots.txt for sitemap location.
 */

async function fetchAndParseXml(url: string): Promise<string[]> {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const xml = await res.text();

  // Check if sitemap index
  const sitemapUrls = [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1]
  );
  if (sitemapUrls.length > 0) {
    const allUrls: string[] = [];
    for (const childUrl of sitemapUrls) {
      const childUrls = await fetchAndParseXml(childUrl);
      allUrls.push(...childUrls);
    }
    return allUrls;
  }

  // Regular sitemap
  const pageUrls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1]
  );
  return pageUrls;
}

async function findSitemapUrl(host: string): Promise<string | null> {
  const candidates = [
    `https://${host}/sitemap-index.xml`,
    `https://${host}/sitemap.xml`,
    `https://${host}/sitemap_index.xml`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: "HEAD", next: { revalidate: 0 } });
      if (res.ok) return url;
    } catch {
      continue;
    }
  }

  // Try robots.txt
  try {
    const res = await fetch(`https://${host}/robots.txt`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/Sitemap:\s*(\S+)/i);
      if (match) return match[1];
    }
  } catch {
    // ignore
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { host } = await request.json();

    if (!host) {
      return NextResponse.json(
        { error: "host is required (e.g. dalyadvertising.com)" },
        { status: 400 }
      );
    }

    const sitemapUrl = await findSitemapUrl(host);
    if (!sitemapUrl) {
      return NextResponse.json(
        { error: `No sitemap found at ${host}` },
        { status: 404 }
      );
    }

    const urls = await fetchAndParseXml(sitemapUrl);
    const uniqueUrls = Array.from(new Set(urls));

    return NextResponse.json({
      sitemapUrl,
      urls: uniqueUrls,
      count: uniqueUrls.length,
    });
  } catch (error) {
    console.error("[sitemap-fetch]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
