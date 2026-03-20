import { NextResponse } from 'next/server';
import { getSearchConsole } from '@/lib/gsc-auth';

export async function POST(request: Request) {
  try {
    const { siteUrl, inspectionUrl } = await request.json();
    if (!siteUrl || !inspectionUrl) {
      return NextResponse.json({ error: 'siteUrl and inspectionUrl required' }, { status: 400 });
    }

    const sc = getSearchConsole();
    const res = await sc.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl,
        siteUrl,
      },
    });

    return NextResponse.json({ result: res.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
