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
      keywords,
      location_code = 2840,
      type = 'web',
      time_range,
      date_from,
      date_to,
    } = body as {
      keywords: string[];
      location_code?: number;
      type?: string;
      time_range?: string;
      date_from?: string;
      date_to?: string;
    };

    if (!keywords?.length) {
      return NextResponse.json({ error: 'keywords are required' }, { status: 400 });
    }

    if (keywords.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 keywords allowed' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload: Record<string, unknown>[] = [{
      keywords,
      location_code,
      type,
      ...(time_range && { time_range }),
      ...(date_from && { date_from }),
      ...(date_to && { date_to }),
    }];

    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/dataforseo_trends/explore/live',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('DataForSEO trends response status:', response.status);

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('DataForSEO trends task status:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching DataForSEO trends:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trends data' },
      { status: 500 }
    );
  }
}
