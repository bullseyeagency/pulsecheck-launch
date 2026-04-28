import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { searchSerpAPI } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, gl = "us", hl = "en", location, num = 10 } =
      await request.json();

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
      num,
    });

    return NextResponse.json({
      results: {
        organic: data.organic_results || [],
        local_pack: data.local_results || null,
        featured_snippet: data.answer_box || null,
        paa: data.related_questions || [],
        knowledge_graph: data.knowledge_graph || null,
        ads: data.ads || [],
      },
    });
  } catch (error) {
    console.error("[serpapi/google-search]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
