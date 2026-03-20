import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { search_terms, keywords, mode = 'entry', limit = 50 } = body as {
      search_terms: string[];
      keywords?: string[];
      mode?: string;
      limit?: number;
    };

    if (!search_terms?.length) {
      return NextResponse.json({ error: 'search_terms is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload: Record<string, unknown>[] = [{
      search_terms,
      mode,
      limit,
      ...(keywords?.length ? { keywords } : {}),
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/domain_analytics/technologies/domains_by_html_terms/live',
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
    console.error('Error fetching domains by HTML terms:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch domains by HTML terms' },
      { status: 500 }
    );
  }
}
