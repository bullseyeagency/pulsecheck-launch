import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { page_id } = await request.json();

    if (!page_id) {
      return NextResponse.json({ error: "page_id is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "facebook_profile",
      page_id,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/facebook]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
