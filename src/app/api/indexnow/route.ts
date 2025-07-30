// app/api/indexnow/route.ts

import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';

export async function POST(req: NextRequest) {
  const key = process.env.INDEXNOW_KEY!;
  const host = process.env.NEXT_PUBLIC_APP_URL!;
  const keyLocation = `https://${host}/${key}.txt`;

  const body = await req.json();
  const slug = body?.fields?.slug?.['en-US']; // Adjust locale as needed

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug in payload' }, { status: 400 });
  }

  const url = `https://${host}/blogs/${slug}`;

  try {
    const res = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        url
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: 500 });
    }

    return NextResponse.json({ message: 'Submitted to IndexNow', url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
