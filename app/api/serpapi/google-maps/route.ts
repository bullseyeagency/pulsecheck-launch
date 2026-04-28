import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, ll, location, type = "search", gl = "us", hl = "en" } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "google_maps",
      q: keyword,
      ll,
      location,
      type,
      gl,
      hl,
    });

    return NextResponse.json({
      results: {
        places: data.local_results || [],
        place_info: data.place_results || null,
      },
    });
  } catch (error) {
    console.error("[serpapi/google-maps]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
