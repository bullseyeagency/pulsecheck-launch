import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, date_from, date_to } = body as {
      keyword: string;
      date_from?: string;
      date_to?: string;
    };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload = [{
      keyword: keyword.trim(),
      ...(date_from ? { date_from } : {}),
      ...(date_to ? { date_to } : {}),
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/content_analysis/phrase_trends/live',
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
    console.log('DataForSEO phrase-trends response:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch phrase trends';
    console.error('Error fetching phrase trends:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
