// src/app/api/public/export/route.ts
// Public endpoint — verifies Paystack one-time payment then returns a clean DOCX.
import { NextRequest } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { paystackReference, documentHtml, documentTitle } = body;

  if (!documentHtml) {
    return new Response(JSON.stringify({ error: 'Document content is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify Paystack payment (skip only if key is missing — useful for local dev)
  if (PAYSTACK_SECRET_KEY) {
    if (!paystackReference) {
      return new Response(JSON.stringify({ error: 'Payment reference is required' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const verifyResponse = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(paystackReference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const htmlDocx = await import('html-docx-js/dist/html-docx');

    const title = documentTitle || 'Legal Document';
    const cleanBody = documentHtml
      .replace(/class="lexical-[^"]*"/g, '')
      .replace(/class="[^"]*lexical[^"]*"/g, '');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 1in 1in 1in 1.5in; }
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; }
    h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 24pt 0 12pt; }
    h2 { font-size: 14pt; font-weight: bold; margin: 18pt 0 6pt; }
    h3 { font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 12pt 0 6pt; }
    p { margin: 0; padding: 2px 0; }
    ol { padding-left: 36pt; }
    ul { padding-left: 36pt; }
    blockquote { border-left: 3px solid #000; padding-left: 24pt; margin: 12pt 0 12pt 36pt; font-style: italic; }
  </style>
</head>
<body>${cleanBody}</body>
</html>`;

    const docxBlob = htmlDocx.asBlob(fullHtml);
    const arrayBuffer = await docxBlob.arrayBuffer();

    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-wansom.docx`;

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('DOCX generation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate document file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
