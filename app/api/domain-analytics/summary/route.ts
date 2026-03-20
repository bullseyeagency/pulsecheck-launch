import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { technology } = body as { technology: string };

    if (!technology?.trim()) {
      return NextResponse.json({ error: 'technology is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload: Record<string, unknown>[] = [{
      technologies: [technology.trim()],
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/domain_analytics/technologies/technologies_summary/live',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching technologies summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch technologies summary' },
      { status: 500 }
    );
  }
}
