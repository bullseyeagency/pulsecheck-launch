import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target, limit = 100, order_by } = body as {
      target: string;
      limit?: number;
      order_by?: string[];
    };

    if (!target?.trim()) {
      return NextResponse.json({ error: 'target is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload = [{
      target: target.trim(),
      limit,
      ...(order_by?.length ? { order_by } : {}),
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/backlinks/backlinks/live',
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
    console.log('DataForSEO backlinks/backlinks response:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching backlinks list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch backlinks list' },
      { status: 500 }
    );
  }
}
