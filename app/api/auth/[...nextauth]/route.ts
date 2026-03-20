import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function wrappedGET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (err: any) {
    console.error("[AUTH GET ERROR]", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function wrappedPOST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (err: any) {
    console.error("[AUTH POST ERROR]", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
