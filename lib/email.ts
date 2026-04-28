import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(key);
}

export async function sendAuditReadyEmail({
  to,
  domain,
  auditId,
  industry,
  location,
}: {
  to: string;
  domain: string;
  auditId: string;
  industry: string;
  location: string;
}) {
  const reportUrl = `${process.env.NEXTAUTH_URL || 'https://pulsecheck.dalyadvertising.com'}/scan/${auditId}`;

  await getResend().emails.send({
    from: 'PulseCheck <noreply@dalyadvertising.com>',
    to,
    subject: `Your audit for ${domain} is ready`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
        <div style="margin-bottom: 24px;">
          <div style="display: inline-block; background: #EF5744; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">
            PulseCheck
          </div>
        </div>
        <h2 style="margin: 0 0 8px; font-size: 20px;">Your SEO audit is ready</h2>
        <p style="color: #a1a1aa; margin: 0 0 24px; font-size: 14px;">
          The full audit for <strong style="color: #fff;">${domain}</strong>
          ${location ? `· ${industry} · ${location}` : industry ? `· ${industry}` : ''}
          has finished. View the report and share the link with your prospect.
        </p>
        <a href="${reportUrl}" style="display: inline-block; background: #EF5744; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Report
        </a>
        <p style="color: #555; font-size: 12px; margin-top: 32px; border-top: 1px solid #1a1a1a; padding-top: 16px;">
          Share this link: <a href="${reportUrl}" style="color: #EF5744;">${reportUrl}</a>
        </p>
      </div>
    `,
  });
}

export async function sendAuditViewedEmail({
  to,
  domain,
  auditId,
  industry,
  location,
}: {
  to: string;
  domain: string;
  auditId: string;
  industry: string;
  location: string;
}) {
  const reportUrl = `${process.env.NEXTAUTH_URL || 'https://pulsecheck.dalyadvertising.com'}/scan/${auditId}`;

  await getResend().emails.send({
    from: 'PulseCheck <noreply@dalyadvertising.com>',
    to,
    subject: `${domain} just viewed their SEO audit`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 8px;">
        <div style="margin-bottom: 24px;">
          <div style="display: inline-block; background: #EF5744; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">
            PulseCheck
          </div>
        </div>
        <h2 style="margin: 0 0 8px; font-size: 20px;">Your prospect opened the report</h2>
        <p style="color: #a1a1aa; margin: 0 0 24px; font-size: 14px;">
          Someone just opened the SEO audit for <strong style="color: #fff;">${domain}</strong>. Good time to follow up.
        </p>
        <a href="${reportUrl}" style="display: inline-block; background: #EF5744; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Report
        </a>
      </div>
    `,
  });
}
