import { NextResponse } from 'next/server';
import { getSearchConsole } from '@/lib/gsc-auth';

export async function GET() {
  try {
    const sc = getSearchConsole();
    const res = await sc.sites.list();
    return NextResponse.json({ sites: res.data.siteEntry || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
