import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product_id, gl = "us", hl = "en" } = await request.json();

    if (!product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "google_immersive_product",
      product_id,
      gl,
      hl,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/google-immersive-product]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
