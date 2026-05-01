// app/api/lead/route.ts
// Receives landing page form submissions from dalyadvertising.com,
// crawls the domain, and kicks off the full audit pipeline.

import { NextRequest, NextResponse } from "next/server";
import { crawlSite } from "@/lib/audit/crawl";

const VERTICAL_TO_INDUSTRY: Record<string, string> = {
  "HVAC": "hvac",
  "Roofing": "roofing",
  "Kitchen Remodeling": "kitchen remodeling",
  "Plumbing": "plumbing",
  "Electrical": "electrical",
  "Landscaping": "landscaping",
  "Pest Control": "pest control",
  "Painting": "painting",
  "Other": "home services",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://dalyadvertising.com",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export async function POST(req: NextRequest) {
  const cors = { "Access-Control-Allow-Origin": "https://dalyadvertising.com" };

  try {
    const { domain, vertical, email, phone, fullName, companyName } = await req.json() as {
      domain: string;
      vertical?: string;
      email?: string;
      phone?: string;
      fullName?: string;
      companyName?: string;
    };

    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400, headers: cors });
    }

    const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();
    const url = `https://${cleanDomain}`;
    const industry = VERTICAL_TO_INDUSTRY[vertical ?? ""] || vertical?.toLowerCase() || "home services";

    // Crawl the site so the audit has real on-page data
    let crawlData;
    try {
      crawlData = await crawlSite(url);
    } catch {
      crawlData = {
        url, domain: cleanDomain, title: companyName || cleanDomain,
        metaDescription: "", canonical: "", robotsDirectives: [],
        headings: [], headingCounts: {}, jsonLd: [], ogTags: {}, twitterCard: {},
        robotsTxt: "", sitemapXml: "", internalLinks: [], wordCount: 0,
        technologies: [], images: [], nap: { name: companyName || "", address: "", phone: phone || "" },
      };
    }

    const res = await fetch(new URL("/api/audit/run", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        domain: cleanDomain,
        industry,
        location: "Tampa, FL",
        crawlData,
        notifyEmail: email,
        notifyPhone: phone,
        contactName: fullName,
      }),
    });

    const data = await res.json();
    const auditId = data.id;
    const reportUrl = `https://launch.dalyadvertising.com/scan/${auditId}`;

    return NextResponse.json({ success: true, auditId, reportUrl }, { headers: cors });
  } catch (err) {
    console.error("[lead]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: cors });
  }
}
