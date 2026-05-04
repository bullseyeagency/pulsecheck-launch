import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, email, phone } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const audit = await prisma.audit.findUnique({
      where: { id },
      select: { id: true, domain: true, industry: true, location: true, report: true, contactEmail: true },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Store contact info on audit record
    await prisma.audit.update({
      where: { id },
      data: {
        contactName: name || null,
        contactEmail: email,
        contactPhone: phone || null,
        contactSubmittedAt: new Date(),
      },
    });

    const reportUrl = `${process.env.NEXTAUTH_URL || "https://pulsecheck.dalyadvertising.com"}/scan/${id}`;
    const report = audit.report as Record<string, any> | null;
    const issueCount = report?.totalIssues
      ? (report.totalIssues.critical || 0) + (report.totalIssues.high || 0) + (report.totalIssues.medium || 0) + (report.totalIssues.low || 0)
      : 0;

    // Notify Daly Advertising of new lead
    getResend()?.emails.send({
      from: "PulseCheck <noreply@dalyadvertising.com>",
      replyTo: email,
      to: "marco@dalyadvertising.com",
      subject: `New audit lead: ${name || email} — ${audit.domain}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; background: #EF5744; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">
              PulseCheck — New Lead
            </div>
          </div>
          <h2 style="margin: 0 0 16px; font-size: 20px;">Someone just claimed their audit report</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="color: #8b8b93; padding: 6px 0; width: 120px;">Name</td><td style="color: #fff;">${name || "—"}</td></tr>
            <tr><td style="color: #8b8b93; padding: 6px 0;">Email</td><td style="color: #fff;">${email}</td></tr>
            <tr><td style="color: #8b8b93; padding: 6px 0;">Phone</td><td style="color: #fff;">${phone || "—"}</td></tr>
            <tr><td style="color: #8b8b93; padding: 6px 0;">Domain</td><td style="color: #fff;">${audit.domain}</td></tr>
            <tr><td style="color: #8b8b93; padding: 6px 0;">Industry</td><td style="color: #fff;">${audit.industry}</td></tr>
            <tr><td style="color: #8b8b93; padding: 6px 0;">Location</td><td style="color: #fff;">${audit.location}</td></tr>
            <tr><td style="color: #8b8b93; padding: 6px 0;">Issues found</td><td style="color: #EF5744; font-weight: bold;">${issueCount}</td></tr>
          </table>
          <a href="${reportUrl}" style="display: inline-block; background: #EF5744; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View Their Report
          </a>
        </div>
      `,
    }).catch((err) => console.error("[contact] notify email failed:", err));

    // Send report link to the lead
    getResend()?.emails.send({
      from: "PulseCheck <noreply@dalyadvertising.com>",
      replyTo: "marco@dalyadvertising.com",
      to: email,
      subject: `Your free digital audit for ${audit.domain} is ready`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; background: #EF5744; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">
              PulseCheck
            </div>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 20px;">Your audit is ready${name ? `, ${name.split(' ')[0]}` : ''}</h2>
          <p style="color: #a1a1aa; margin: 0 0 8px; font-size: 14px;">
            We scanned <strong style="color: #fff;">${audit.domain}</strong> across 10 data sources.
            ${issueCount > 0 ? `We found <strong style="color: #EF5744;">${issueCount} issues</strong> affecting your online visibility.` : ''}
          </p>
          <p style="color: #a1a1aa; margin: 0 0 24px; font-size: 14px;">
            Your full report is ready to view — including competitor comparison, keyword opportunities, and plain-English recommendations.
          </p>
          <a href="${reportUrl}" style="display: inline-block; background: #EF5744; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View Full Report
          </a>
          <p style="color: #555; font-size: 12px; margin-top: 32px; border-top: 1px solid #1a1a1a; padding-top: 16px;">
            This report was generated by PulseCheck, a tool by <a href="https://dalyadvertising.com" style="color: #EF5744;">Daly Advertising</a>.
            Questions? Reply to this email or call us.
          </p>
        </div>
      `,
    }).catch((err) => console.error("[contact] lead email failed:", err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save contact";
    console.error("[contact]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
