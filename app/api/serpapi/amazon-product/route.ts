import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product_id, amazon_domain = "amazon.com" } = await request.json();

    if (!product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }

    const data = await searchSerpAPI({
      engine: "amazon_product",
      product_id,
      amazon_domain,
    });

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("[serpapi/amazon-product]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
