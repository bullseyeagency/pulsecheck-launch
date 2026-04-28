import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data_id, place_id, hl = "en", sort_by = "newestFirst" } =
      await request.json();

    if (!data_id && !place_id) {
      return NextResponse.json(
        { error: "data_id or place_id is required" },
        { status: 400 }
      );
    }

    const data = await searchSerpAPI({
      engine: "google_maps_reviews",
      data_id,
      place_id,
      hl,
      sort_by,
    });

    return NextResponse.json({
      results: {
        reviews: data.reviews || [],
        rating: data.place_info?.rating,
        total_reviews: data.place_info?.reviews,
        topics: data.topics || [],
      },
    });
  } catch (error) {
    console.error("[serpapi/google-maps-reviews]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
