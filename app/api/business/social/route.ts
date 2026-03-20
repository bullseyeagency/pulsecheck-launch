import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target } = body as { target: string };

    if (!target?.trim()) {
      return NextResponse.json({ error: 'target URL is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const headers = {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    };

    const payload = JSON.stringify([{ target: target.trim() }]);

    // Call Pinterest and Reddit endpoints in parallel
    const [pinterestRes, redditRes] = await Promise.all([
      fetch(
        'https://api.dataforseo.com/v3/business_data/social_media/pinterest/live',
        { method: 'POST', headers, body: payload }
      ),
      fetch(
        'https://api.dataforseo.com/v3/business_data/social_media/reddit/live',
        { method: 'POST', headers, body: payload }
      ),
    ]);

    console.log('Social media Pinterest status:', pinterestRes.status);
    console.log('Social media Reddit status:', redditRes.status);

    const pinterestData = pinterestRes.ok ? await pinterestRes.json() : null;
    const redditData = redditRes.ok ? await redditRes.json() : null;

    const pinterest = pinterestData?.tasks?.[0]?.result || [];
    const reddit = redditData?.tasks?.[0]?.result || [];

    console.log('Pinterest results:', pinterest.length, '| Reddit results:', reddit.length);

    return NextResponse.json({ pinterest, reddit });
  } catch (error: any) {
    console.error('Error fetching social media data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social media data' },
      { status: 500 }
    );
  }
}
