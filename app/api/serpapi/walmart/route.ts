import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, page = 1 } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "walmart",
      query: keyword,
      page,
    });

    return NextResponse.json({ results: data.organic_results || data });
  } catch (error) {
    console.error("[serpapi/walmart]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
