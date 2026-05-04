import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runCompetitorAds } from "@/lib/audit/steps/competitor-ads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { domains } = await request.json();

  if (!domains?.length) {
    return NextResponse.json({ error: "domains array required" }, { status: 400 });
  }

  const result = await runCompetitorAds(domains.slice(0, 5));

  await prisma.audit.update({
    where: { id },
    data: { competitorAdsData: result as any },
  });

  return NextResponse.json({ ok: true, domains: Object.keys(result) });
}
