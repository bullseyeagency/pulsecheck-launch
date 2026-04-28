import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, gl = "us", hl = "en", location } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "keyword is required" },
        { status: 400 }
      );
    }

    const data = await searchSerpAPI({
      engine: "google",
      q: keyword,
      gl,
      hl,
      location,
    });

    const paaResults = data.related_questions || [];

    return NextResponse.json({ results: paaResults });
  } catch (error) {
    console.error("[serpapi/paa]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
