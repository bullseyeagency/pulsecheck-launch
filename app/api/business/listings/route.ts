import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, location, categories } = body as {
      keyword: string;
      location?: string;
      categories?: string[];
    };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const payload = [
      {
        categories: categories?.length ? categories : [keyword.trim()],
        description: location ? `${keyword.trim()} in ${location.trim()}` : keyword.trim(),
      },
    ];

    const response = await fetch(
      'https://api.dataforseo.com/v3/business_data/business_listings/search/live',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('Business listings response status:', response.status);

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Business listings:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching business listings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business listings' },
      { status: 500 }
    );
  }
}
