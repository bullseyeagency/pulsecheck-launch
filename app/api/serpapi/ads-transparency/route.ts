import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, advertiser_id, domain, region, created_before, created_after } =
      await request.json();

    if (!text && !advertiser_id && !domain) {
      return NextResponse.json(
        { error: "text, advertiser_id, or domain is required" },
        { status: 400 }
      );
    }

    const data = await searchSerpAPI({
      engine: "google_ads_transparency_center",
      text,
      advertiser_id,
      domain,
      region,
      created_before,
      created_after,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/ads-transparency]", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
