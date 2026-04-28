import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, page } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "home_depot",
      q: keyword,
      page,
    });

    return NextResponse.json({ results: data.products || data });
  } catch (error) {
    console.error("[serpapi/home-depot]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
