import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAdsApi } from "google-ads-api";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Get Google Ads connection for this organization
    const connection = await prisma.googleAdsConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No Google Ads account connected" },
        { status: 404 }
      );
    }

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    // Use the stored customerId, or try to fetch it dynamically
    let customerId = connection.customerId;

    if (!customerId || customerId === "PENDING") {
      // Try to use the library's report method to get customer info
      try {
        // Use any customer ID temporarily just to call the API
        const tempCustomer = client.Customer({
          customer_id: "0",
          refresh_token: connection.refreshToken,
        });

        // This should fail but give us the real customer ID in the error
        // OR we can try to use the Customer.listAccessibleCustomers if it exists
        if (typeof (tempCustomer as any).listAccessibleCustomers === 'function') {
          const accessible = await (tempCustomer as any).listAccessibleCustomers();
          if (accessible && accessible.length > 0) {
            customerId = accessible[0].toString().replace(/\D/g, '');
          }
        }
      } catch (err) {
        console.log("Auto-detect attempt failed:", err);
      }

      // If still no customer ID, prompt user
      if (!customerId || customerId === "PENDING" || customerId === "0") {
        return NextResponse.json({
          success: false,
          needsConfiguration: true,
          error: "Please configure your Google Ads Customer ID",
          message: "Go to your Google Ads account and copy your 10-digit Customer ID (format: 123-456-7890)"
        });
      }

      // Update the connection with the discovered customer ID
      await prisma.googleAdsConnection.update({
        where: { id: connection.id },
        data: { customerId },
      });
    }

    // Get customer with refresh token
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: connection.refreshToken,
    });

    // Query for customer client accounts (if this is a manager account)
    try {
      const query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.status
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
        ORDER BY customer_client.descriptive_name
      `;

      const results = await customer.query(query);

      const accounts = results.map((row: any) => ({
        id: row.customer_client.id.toString(),
        name: row.customer_client.descriptive_name,
        currency: row.customer_client.currency_code,
        timeZone: row.customer_client.time_zone,
      }));

      return NextResponse.json({ success: true, accounts });
    } catch (queryError) {
      // If query fails (not a manager account), return the single account
      const accountQuery = `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        WHERE customer.id = ${customerId}
        LIMIT 1
      `;

      const [result] = await customer.query(accountQuery);

      const accounts = [{
        id: customerId,
        name: result.customer?.descriptive_name || `Account ${customerId}`,
        currency: result.customer?.currency_code ?? '',
        timeZone: result.customer?.time_zone ?? '',
      }];

      return NextResponse.json({ success: true, accounts });
    }
  } catch (error) {
    console.error("Fetch accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
