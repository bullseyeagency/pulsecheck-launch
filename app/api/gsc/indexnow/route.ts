import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { host, urls, key } = await req.json();

    if (!host || !key || !urls?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: host, key, and urls' },
        { status: 400 }
      );
    }

    if (urls.length > 10000) {
      return NextResponse.json(
        { error: 'Maximum 10,000 URLs per submission' },
        { status: 400 }
      );
    }

    const payload = {
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: urls,
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    let body: string | null = null;
    try {
      body = await response.text();
    } catch {
      // Some responses may have no body
    }

    if (response.status === 200 || response.status === 202) {
      return NextResponse.json({
        success: true,
        status: response.status,
        message:
          response.status === 200
            ? 'URLs submitted successfully'
            : 'URLs accepted and will be processed',
        urlCount: urls.length,
        body,
      });
    }

    const errorMessages: Record<number, string> = {
      400: 'Bad request — invalid format',
      403: 'API key not valid',
      422: 'URLs don\'t match the specified host',
      429: 'Too many requests — try again later',
    };

    return NextResponse.json(
      {
        success: false,
        status: response.status,
        error: errorMessages[response.status] || `IndexNow returned status ${response.status}`,
        body,
      },
      { status: response.status }
    );
  } catch (err: any) {
    console.error('IndexNow API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
