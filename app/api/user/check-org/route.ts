import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ hasOrganization: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      hasOrganization: !!user?.organizationId,
      organizationName: user?.organization?.name || null,
    });
  } catch (error) {
    console.error("Check organization error:", error);
    return NextResponse.json({ hasOrganization: false });
  }
}
