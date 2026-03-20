import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, domain } = body as { keyword: string; domain?: string };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload: Record<string, unknown>[] = [{
      keyword: keyword.trim(),
      search_mode: 'as_is',
      ...(domain?.trim() ? { internal_list_limit: 10, search_mode: 'as_is' } : {}),
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/content_analysis/search/live',
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
    console.log('DataForSEO citation-search response:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to search citations';
    console.error('Error searching citations:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
