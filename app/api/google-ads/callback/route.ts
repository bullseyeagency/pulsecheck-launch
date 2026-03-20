import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state"); // organizationId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/onboarding?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/onboarding?error=missing_code`
      );
    }

    if (!session?.user?.email) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/onboarding?error=not_authenticated`
      );
    }

    // Fetch user from database to verify organizationId
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    });

    if (!user?.organizationId || user.organizationId !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/onboarding?error=invalid_session`
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/google-ads/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/onboarding?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();

    // Get customer ID from Google Ads API
    // For now, we'll prompt the user to enter it, or we can make an API call
    // to get accessible customers

    // Store the connection in database
    await prisma.googleAdsConnection.create({
      data: {
        organizationId: user.organizationId,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
        customerId: "PENDING", // Will be updated when user selects account
        isActive: true,
      },
    });

    // Redirect to campaign builder
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/campaign-builder?connected=true`
    );
  } catch (error) {
    console.error("Google Ads OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/onboarding?error=callback_failed`
    );
  }
}
