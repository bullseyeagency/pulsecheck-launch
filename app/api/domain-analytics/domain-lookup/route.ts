import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target } = body as { target: string };

    if (!target?.trim()) {
      return NextResponse.json({ error: 'target domain is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload: Record<string, unknown>[] = [{
      target: target.trim(),
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/domain_analytics/technologies/domain_technologies/live',
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
    console.error('Error fetching domain technologies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch domain technologies' },
      { status: 500 }
    );
  }
}
