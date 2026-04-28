import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      asin,
      location_code = 2840,
      language_code = 'en_US',
      depth = 100,
    } = body as {
      asin: string;
      location_code?: number;
      language_code?: string;
      depth?: number;
    };

    if (!asin?.trim()) {
      return NextResponse.json({ error: 'asin is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const headers = {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    };

    const taskPayload = [
      {
        asin: asin.trim(),
        location_code,
        language_code,
        depth,
        priority: 2,
      },
    ];

    const taskRes = await fetch(
      'https://api.dataforseo.com/v3/merchant/amazon/reviews/task_post',
      { method: 'POST', headers, body: JSON.stringify(taskPayload) }
    );

    console.log('Amazon reviews task_post status:', taskRes.status);

    if (!taskRes.ok) {
      throw new Error(`DataForSEO task_post error: ${taskRes.statusText}`);
    }

    const taskData = await taskRes.json();
    const taskId = taskData.tasks?.[0]?.id;

    if (!taskId) {
      throw new Error('No task ID returned from DataForSEO');
    }

    console.log('Amazon reviews task ID:', taskId);

    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(3000);

      const resultRes = await fetch(
        `https://api.dataforseo.com/v3/merchant/amazon/reviews/task_get/advanced/${taskId}`,
        { method: 'GET', headers }
      );

      console.log(`Amazon reviews poll attempt ${i + 1}:`, resultRes.status);

      if (!resultRes.ok) continue;

      const resultData = await resultRes.json();
      const statusCode = resultData.tasks?.[0]?.status_code;

      if (statusCode === 20000) {
        const results = resultData.tasks?.[0]?.result || [];
        return NextResponse.json({ results });
      }
    }

    return NextResponse.json(
      { error: 'Task is still processing. Try again in a few seconds.', taskId },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error fetching Amazon reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Amazon reviews' },
      { status: 500 }
    );
  }
}
