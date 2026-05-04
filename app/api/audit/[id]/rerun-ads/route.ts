import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runMetaAds } from "@/lib/audit/steps/meta-ads";
import { runTikTokAds } from "@/lib/audit/steps/tiktok-ads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { businessName } = await request.json();

  if (!businessName) {
    return NextResponse.json({ error: "businessName required" }, { status: 400 });
  }

  const audit = await prisma.audit.findUnique({ where: { id }, select: { domain: true } });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [metaAdsData, tiktokAdsData] = await Promise.all([
    runMetaAds(businessName, audit.domain),
    runTikTokAds(businessName),
  ]);

  await prisma.audit.update({
    where: { id },
    data: {
      metaAdsData: metaAdsData as any,
      tiktokAdsData: tiktokAdsData as any,
    },
  });

  return NextResponse.json({
    ok: true,
    meta: { running: metaAdsData.running, ad_count: metaAdsData.ad_count },
    tiktok: { running: tiktokAdsData.running, ad_count: tiktokAdsData.ad_count },
  });
}
