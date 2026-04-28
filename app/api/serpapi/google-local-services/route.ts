import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, place_id, data_cid, gl = "us", hl = "en" } = await request.json();

    if (!keyword && !place_id && !data_cid) {
      return NextResponse.json(
        { error: "keyword, place_id, or data_cid is required" },
        { status: 400 }
      );
    }

    const data = await searchSerpAPI({
      engine: "google_local_services",
      q: keyword,
      place_id,
      data_cid,
      gl,
      hl,
    });

    return NextResponse.json({ results: data.local_ads || data });
  } catch (error) {
    console.error("[serpapi/google-local-services]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
