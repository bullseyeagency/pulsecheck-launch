import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target, targetType, platform, location_code = 2840, limit = 20 } = body as {
      target: string;
      targetType: 'domain' | 'keyword';
      platform: string;
      location_code?: number;
      limit?: number;
    };

    if (!target?.trim()) {
      return NextResponse.json({ error: 'target is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const targetPayload =
      targetType === 'domain'
        ? [{ domain: target.trim() }]
        : [{ keyword: target.trim() }];

    const payload = [
      {
        target: targetPayload,
        platform,
        location_code,
        language_code: 'en',
        limit,
      },
    ];

    const response = await fetch(
      'https://api.dataforseo.com/v3/ai_optimization/llm_mentions/search/live',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('DataForSEO LLM mentions response status:', response.status);

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('DataForSEO LLM mentions:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching LLM mentions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch LLM mentions' },
      { status: 500 }
    );
  }
}
