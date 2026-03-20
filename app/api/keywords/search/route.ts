import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dataForSEO } from '@/lib/dataforseo';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword } = body as { keyword: string };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const results = await dataForSEO.getKeywordSuggestions(keyword.trim());

    const suggestions = results.map((item) => ({
      keyword: item.keyword,
      search_volume: item.search_volume ?? null,
      cpc: item.cpc ?? null,
      competition: item.competition ?? null,
      competition_index: item.competition_index != null
        ? item.competition_index / 100
        : null,
    }));

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error fetching keyword suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keyword suggestions' },
      { status: 500 }
    );
  }
}
