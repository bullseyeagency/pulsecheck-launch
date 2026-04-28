import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, check_in_date, check_out_date, gl = "us", hl = "en" } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "google_hotels",
      q: keyword,
      check_in_date,
      check_out_date,
      gl,
      hl,
    });

    return NextResponse.json({ results: data.properties || data });
  } catch (error) {
    console.error("[serpapi/google-hotels]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
