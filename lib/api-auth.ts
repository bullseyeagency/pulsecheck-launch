import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Validates either a NextAuth session (browser) or an x-api-key header (service-to-service).
 * Returns true if authorized, false otherwise.
 */
export async function authorizeRequest(request: NextRequest): Promise<boolean> {
  // Check API key first (service-to-service calls from agent-api)
  const apiKey = request.headers.get("x-api-key");
  const validKey = process.env.PULSECHECK_API_KEY;

  if (apiKey && validKey && apiKey === validKey) {
    return true;
  }

  // Fall back to NextAuth session (browser calls)
  const session = await auth();
  return !!session;
}
