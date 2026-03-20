import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { siteUrl } = await request.json();
    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl required' }, { status: 400 });
    }

    // Get latest inspection per URL
    const latest = await prisma.$queryRaw<Array<{
      pageUrl: string;
      verdict: string;
      coverageState: string | null;
      lastCrawlTime: string | null;
      crawledAs: string | null;
      checkedAt: Date;
    }>>`
      SELECT DISTINCT ON ("pageUrl")
        "pageUrl", "verdict", "coverageState", "lastCrawlTime", "crawledAs", "checkedAt"
      FROM "GscInspection"
      WHERE "siteUrl" = ${siteUrl}
      ORDER BY "pageUrl", "checkedAt" DESC
    `;

    // Get summary stats
    const total = latest.length;
    const indexed = latest.filter((r) => r.verdict === 'PASS').length;
    const partial = latest.filter((r) => r.verdict === 'PARTIAL').length;
    const notIndexed = latest.filter((r) => r.verdict === 'FAIL').length;

    return NextResponse.json({
      results: latest,
      summary: { total, indexed, partial, notIndexed },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
