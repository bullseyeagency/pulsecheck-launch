import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      keyword,
      data_type = "TIMESERIES",
      date = "today 12-m",
      geo = "US",
      hl = "en",
    } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "keyword is required" },
        { status: 400 }
      );
    }

    const data = await searchSerpAPI({
      engine: "google_trends",
      q: keyword,
      data_type,
      date,
      geo,
      hl,
    });

    return NextResponse.json({
      results: {
        interest_over_time: data.interest_over_time?.timeline_data || [],
        related_queries: data.related_queries || [],
        related_topics: data.related_topics || [],
      },
    });
  } catch (error) {
    console.error("[serpapi/google-trends]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
