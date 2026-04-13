import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

const ALLOWED_CDN_HOSTS = ['cdn.sanity.io', 'assets.sanity.io'];

export async function POST(req: NextRequest) {
  let templateUrl = '';
  try {
    const body = await req.json();
    templateUrl = body.templateUrl;
    const mode: string = body.mode || 'html';

    if (!templateUrl || typeof templateUrl !== 'string') {
      return NextResponse.json({ error: 'templateUrl is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(templateUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!ALLOWED_CDN_HOSTS.includes(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    const fileResponse = await fetch(templateUrl, {
      headers: { 'User-Agent': 'WansomAI/1.0' },
    });

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: `CDN fetch failed: ${fileResponse.status} ${fileResponse.statusText}` },
        { status: 502 }
      );
    }

    const filename = parsedUrl.pathname.split('/').pop() || 'template.docx';
    const isLegacyDoc = filename.toLowerCase().endsWith('.doc') && !filename.toLowerCase().endsWith('.docx');

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (mode === 'download') {
      const contentType = isLegacyDoc
        ? 'application/msword'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Legacy .doc — mammoth cannot parse binary Word format
    if (isLegacyDoc) {
      return NextResponse.json({ html: null, reason: 'legacy-doc' });
    }

    // HTML mode — convert DOCX → HTML
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value?.trim();

    if (!html || html.length < 20) {
      return NextResponse.json({ error: 'Conversion produced empty output' }, { status: 422 });
    }

    return NextResponse.json({ html });

  } catch (error: any) {
    console.error('[fetch-template] error for', templateUrl, error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
