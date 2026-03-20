import { NextResponse } from 'next/server';
import { getSearchConsole } from '@/lib/gsc-auth';

async function fetchAndParseXml(url: string): Promise<string[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const xml = await res.text();

  // Check if this is a sitemap index (contains <sitemap> tags)
  const sitemapUrls = [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (sitemapUrls.length > 0) {
    // It's a sitemap index — recursively fetch each child sitemap
    const allUrls: string[] = [];
    for (const childUrl of sitemapUrls) {
      const childUrls = await fetchAndParseXml(childUrl);
      allUrls.push(...childUrls);
    }
    return allUrls;
  }

  // Regular sitemap — extract <url><loc> entries
  const pageUrls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  return pageUrls;
}

export async function POST(request: Request) {
  try {
    const { siteUrl } = await request.json();
    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl required' }, { status: 400 });
    }

    // Get sitemap URLs from GSC
    const sc = getSearchConsole();
    const res = await sc.sitemaps.list({ siteUrl });
    const sitemaps = res.data.sitemap || [];

    if (!sitemaps.length) {
      return NextResponse.json({ error: 'No sitemaps found in GSC for this property' }, { status: 404 });
    }

    // Fetch and parse each sitemap (handles sitemap indexes recursively)
    const allUrls: string[] = [];
    for (const sitemap of sitemaps) {
      if (sitemap.path) {
        const urls = await fetchAndParseXml(sitemap.path);
        allUrls.push(...urls);
      }
    }

    // Deduplicate
    const uniqueUrls = [...new Set(allUrls)];

    return NextResponse.json({ urls: uniqueUrls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
