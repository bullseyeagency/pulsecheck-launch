import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { departure_id, arrival_id, outbound_date, return_date, type = 1, hl = "en", gl = "us" } = await request.json();

    if (!departure_id || !arrival_id || !outbound_date) {
      return NextResponse.json({ error: "departure_id, arrival_id, and outbound_date are required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "google_flights",
      departure_id,
      arrival_id,
      outbound_date,
      return_date,
      type,
      hl,
      gl,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/google-flights]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
