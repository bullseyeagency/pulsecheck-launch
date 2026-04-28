import { NextRequest, NextResponse } from "next/server";
import { crawlSite } from "@/lib/audit/crawl";
import { detectIndustryAndLocation } from "@/lib/audit/detect";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url?.trim()) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const crawlData = await crawlSite(normalizedUrl);
    const { industry, location } = detectIndustryAndLocation(crawlData);

    return NextResponse.json({ crawlData, industry, location });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to crawl site";
    console.error("[audit/crawl]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
