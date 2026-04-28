import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // Consume the param to avoid Next.js warnings
  return NextResponse.json(
    { error: "PDF export coming soon" },
    { status: 501 }
  );
}
