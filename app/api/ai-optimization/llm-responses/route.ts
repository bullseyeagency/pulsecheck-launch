import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

function getPlatformFromModel(modelName: string): string {
  if (modelName.startsWith('gpt-')) return 'chat_gpt';
  if (modelName.startsWith('claude-')) return 'claude';
  if (modelName.startsWith('gemini-')) return 'gemini';
  return 'chat_gpt';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_prompt,
      model_name = 'gpt-4.1-mini',
      web_search = true,
      temperature = 0.94,
      max_output_tokens = 2048,
    } = body as {
      user_prompt: string;
      model_name?: string;
      web_search?: boolean;
      temperature?: number;
      max_output_tokens?: number;
    };

    if (!user_prompt?.trim()) {
      return NextResponse.json({ error: 'user_prompt is required' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    const authHeader = Buffer.from(`${login}:${password}`).toString('base64');

    const platform = getPlatformFromModel(model_name);

    const payload = [
      {
        user_prompt: user_prompt.trim(),
        model_name,
        web_search,
        temperature,
        max_output_tokens,
      },
    ];

    const response = await fetch(
      `https://api.dataforseo.com/v3/ai_optimization/${platform}/llm_responses/live`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('DataForSEO LLM responses status:', response.status);

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('DataForSEO LLM responses:', data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    const results = data.tasks?.[0]?.result || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching LLM responses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch LLM responses' },
      { status: 500 }
    );
  }
}
