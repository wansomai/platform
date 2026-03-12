// src/app/api/public/chat/route.ts
// Public endpoint — no auth required. Handles guest chat about the open document.
import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getJurisdictionById } from '@/lib/jurisdictions';

export const maxDuration = 60;

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { message, documentHtml, jurisdictionId, documentType, documentTitle } = body;

  if (!message?.trim()) {
    return new Response(
      JSON.stringify({ type: 'error', error: 'Message is required' }) + '\n',
      { status: 400 }
    );
  }

  const jurisdiction = jurisdictionId ? getJurisdictionById(jurisdictionId) : null;
  const jurisdictionName = jurisdiction?.name || 'Nigeria';

  const docLabel = documentTitle?.trim() || documentType || 'legal';
  const systemPrompt = `You are a legal document assistant helping a user with their ${docLabel} document governed by ${jurisdictionName} law.

You can:
1. Answer questions about the document or legal concepts
2. Explain clauses and legal terms in plain language
3. Suggest improvements
4. Modify the document when asked

When the user asks you to change, update, add, or remove something in the document, you MUST return the complete updated document HTML in a fenced code block at the very end of your response, like this:

\`\`\`document-update
<h1>DOCUMENT TITLE</h1>
<h2>1. SECTION</h2>
<p>Content...</p>
\`\`\`

For questions and explanations, respond in plain text only — no code block.
Always apply ${jurisdictionName} law. Keep responses concise and practical.`;

  // Truncate document to avoid token limits
  const truncatedDoc = documentHtml ? documentHtml.slice(0, 10000) : '';
  const docContext = truncatedDoc
    ? `The user's current document (HTML):\n${truncatedDoc}`
    : 'No document has been generated yet.';

  const encoder = new TextEncoder();

  try {
    const result = await genAI.models.generateContentStream({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: docContext }] },
        { role: 'model', parts: [{ text: 'I have reviewed the document and I am ready to help.' }] },
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';

          for await (const chunk of result) {
            const text = chunk.text || '';
            if (text) {
              fullContent += text;
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: 'text', content: text }) + '\n')
              );
            }
          }

          // Check if the AI included a document update block
          const updateMatch = fullContent.match(/```document-update\n([\s\S]*?)```/);
          if (updateMatch) {
            const updatedHtml = updateMatch[1].trim();
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: 'document_update', html: updatedHtml }) + '\n'
              )
            );
          }

          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'complete' }) + '\n')
          );
        } catch {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'error', error: 'Chat failed' }) + '\n')
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ type: 'error', error: 'Chat failed' }) + '\n',
      { status: 500 }
    );
  }
}
