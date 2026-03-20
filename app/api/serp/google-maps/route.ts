import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      keyword,
      location_code = 2840,
      language_code = 'en',
      depth = 20,
    } = body as {
      keyword: string;
      location_code?: number;
      language_code?: string;
      depth?: number;
    };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload = [
      {
        keyword: keyword.trim(),
        location_code,
        language_code,
        depth,
      },
    ];

    const response = await fetch(
      'https://api.dataforseo.com/v3/serp/google/maps/live/advanced',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(
      'DataForSEO SERP google-maps response:',
      data.tasks?.[0]?.status_code,
      data.tasks?.[0]?.status_message
    );
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching google maps SERP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch google maps SERP' },
      { status: 500 }
    );
  }
}
