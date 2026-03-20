import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { customerId } = await request.json();

    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Clean the customer ID (remove dashes)
    const cleanCustomerId = customerId.replace(/-/g, "");

    // Fetch user with organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    // Update the Google Ads connection with the customer ID
    await prisma.googleAdsConnection.updateMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      data: {
        customerId: cleanCustomerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Configure customer ID error:", error);
    return NextResponse.json(
      { error: "Failed to configure customer ID" },
      { status: 500 }
    );
  }
}
