import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

/**
 * Two-step AI Overview fetch:
 * 1. Google Search to get ai_overview.page_token
 * 2. Google AI Overview engine with that token
 *
 * Accepts either:
 * - { keyword } — runs both steps automatically
 * - { page_token } — skips step 1, goes directly to AI Overview
 */
export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, page_token, gl = "us", hl = "en", location } =
      await request.json();

    if (!keyword && !page_token) {
      return NextResponse.json(
        { error: "keyword or page_token is required" },
        { status: 400 }
      );
    }

    let token = page_token;

    // Step 1: If no page_token, do a Google Search first to get one
    if (!token) {
      const searchData = await searchSerpAPI({
        engine: "google",
        q: keyword,
        gl,
        hl,
        location,
      });

      token = searchData?.ai_overview?.page_token;

      if (!token) {
        // No AI Overview for this query — return whatever AI overview data
        // was embedded in the search results directly
        return NextResponse.json({
          results: {
            ai_overview_embedded: searchData?.ai_overview || null,
            has_ai_overview: !!searchData?.ai_overview,
            note: "No separate AI Overview page_token found. Embedded results returned if available.",
          },
        });
      }
    }

    // Step 2: Fetch full AI Overview with the token (expires in 1 min)
    const data = await searchSerpAPI({
      engine: "google_ai_overview",
      page_token: token,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/google-ai-overview]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
