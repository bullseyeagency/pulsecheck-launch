import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDbUrl: !!process.env.DATABASE_URL,
    nextauthUrl: process.env.NEXTAUTH_URL || "NOT SET",
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 15) || "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  });
}
