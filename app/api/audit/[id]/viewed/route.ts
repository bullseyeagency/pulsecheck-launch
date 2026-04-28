import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAuditViewedEmail } from '@/lib/email';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const audit = await prisma.audit.findUnique({ where: { id } });
    if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only notify on first view
    if (audit.viewedAt) return NextResponse.json({ alreadyViewed: true });

    await prisma.audit.update({
      where: { id },
      data: { viewedAt: new Date() },
    });

    if (audit.notifyEmail) {
      await sendAuditViewedEmail({
        to: audit.notifyEmail,
        domain: audit.domain,
        auditId: id,
        industry: audit.industry,
        location: audit.location,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[audit/viewed]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
