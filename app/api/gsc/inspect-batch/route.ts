import { NextResponse } from 'next/server';
import { getSearchConsole } from '@/lib/gsc-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { siteUrl, urls } = await request.json();
    if (!siteUrl || !urls?.length) {
      return NextResponse.json({ error: 'siteUrl and urls[] required' }, { status: 400 });
    }

    const sc = getSearchConsole();
    const results = [];

    for (const url of urls) {
      try {
        const res = await sc.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: url,
            siteUrl,
          },
        });

        const indexResult = res.data.inspectionResult?.indexStatusResult;
        results.push({
          url,
          verdict: indexResult?.verdict || 'UNKNOWN',
          coverageState: indexResult?.coverageState || 'Unknown',
          lastCrawlTime: indexResult?.lastCrawlTime || null,
          crawledAs: indexResult?.crawledAs || null,
          robotsTxtState: indexResult?.robotsTxtState || null,
          indexingState: indexResult?.indexingState || null,
        });
      } catch (err: any) {
        results.push({
          url,
          verdict: 'ERROR',
          coverageState: err.message || 'Request failed',
          lastCrawlTime: null,
          crawledAs: null,
          robotsTxtState: null,
          indexingState: null,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Persist all results to database
    await prisma.gscInspection.createMany({
      data: results.map((r) => ({
        siteUrl,
        pageUrl: r.url,
        verdict: r.verdict,
        coverageState: r.coverageState,
        lastCrawlTime: r.lastCrawlTime,
        crawledAs: r.crawledAs,
        robotsTxtState: r.robotsTxtState,
        indexingState: r.indexingState,
      })),
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
