import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image_url, gl = "us", hl = "en" } = await request.json();

    if (!image_url) {
      return NextResponse.json({ error: "image_url is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "google_reverse_image",
      image_url,
      gl,
      hl,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/google-reverse-image]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
