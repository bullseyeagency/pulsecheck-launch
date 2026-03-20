import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywords, location_code = 2840, language_code = 'en' } = body as {
      keywords: string[];
      location_code?: number;
      language_code?: string;
    };

    if (!keywords?.length) {
      return NextResponse.json({ error: 'keywords are required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload = [{
      keywords,
      location_code,
      language_code,
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('DataForSEO keywords-for-keywords response status:', response.status);

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('DataForSEO keywords-for-keywords task status:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching keywords for keywords:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch related keywords' },
      { status: 500 }
    );
  }
}
