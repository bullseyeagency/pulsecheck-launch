// lib/sms.ts — Send SMS via GoHighLevel conversations API

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export async function sendAuditReadySms({
  phone,
  domain,
  auditId,
}: {
  phone: string;
  domain: string;
  auditId: string;
}) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.warn("[sms] GHL credentials not configured — skipping SMS");
    return;
  }

  const reportUrl = `${process.env.NEXTAUTH_URL || "https://launch.dalyadvertising.com"}/scan/${auditId}`;
  const message = `Your free audit for ${domain} is ready. View your full report here:\n${reportUrl}\n\n— Daly Advertising`;

  // Find or create a conversation for this phone number, then send
  const res = await fetch("https://services.leadconnectorhq.com/conversations/messages/outbound", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GHL_API_KEY}`,
      "Version": "2021-04-15",
    },
    body: JSON.stringify({
      type: "SMS",
      phone,
      locationId: GHL_LOCATION_ID,
      message,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GHL SMS failed ${res.status}: ${err}`);
  }
}
