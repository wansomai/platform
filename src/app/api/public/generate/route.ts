// src/app/api/public/generate/route.ts
// Public endpoint — no auth required. Streams Gemini-generated legal document HTML.
import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getJurisdictionById } from '@/lib/jurisdictions';

export const maxDuration = 60;

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const DOCUMENT_TYPES: Record<string, { title: string; prompt: string }> = {
  'nda': {
    title: 'Non-Disclosure Agreement',
    prompt: 'a comprehensive mutual Non-Disclosure Agreement (NDA) protecting confidential business information between two parties',
  },
  'employment-contract': {
    title: 'Employment Contract',
    prompt: 'a detailed Employment Contract covering role, compensation, benefits, duties, IP rights, and termination clauses',
  },
  'tenancy-agreement': {
    title: 'Tenancy Agreement',
    prompt: 'a complete residential Tenancy/Lease Agreement covering rent, duration, deposit, obligations of landlord and tenant, and termination',
  },
  'affidavit': {
    title: 'General Affidavit',
    prompt: 'a General Affidavit with deponent details, proper oath/affirmation language, and jurat',
  },
  'sale-agreement': {
    title: 'Sale Agreement',
    prompt: 'a Sale and Purchase Agreement covering description, price, payment terms, delivery, warranties, and risk transfer',
  },
  'service-agreement': {
    title: 'Service Agreement',
    prompt: 'a professional Services Agreement covering scope of work, fees, payment schedule, IP ownership, confidentiality, and termination',
  },
  'loan-agreement': {
    title: 'Loan Agreement',
    prompt: 'a Loan Agreement covering principal, interest rate, repayment schedule, security/collateral, default, and remedies',
  },
  'board-resolution': {
    title: 'Board Resolution',
    prompt: 'a formal Board of Directors Resolution with proper recitals, resolved clauses, and signature blocks',
  },
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { documentType, documentTitle, jurisdictionId } = body;

  // Resolve document description: freeform title takes priority over enum lookup
  let docPromptDescription: string;
  if (documentTitle?.trim()) {
    docPromptDescription = documentTitle.trim();
  } else {
    const docConfig = DOCUMENT_TYPES[documentType];
    if (!docConfig) {
      return new Response(
        JSON.stringify({ type: 'error', error: 'Invalid document type' }) + '\n',
        { status: 400 }
      );
    }
    docPromptDescription = docConfig.prompt;
  }

  const jurisdiction = jurisdictionId ? getJurisdictionById(jurisdictionId) : null;
  const jurisdictionName = jurisdiction?.name || 'Nigeria';
  const legalSystem = jurisdiction?.legalSystem === 'civil-law' ? 'civil law' : 'common law';

  const systemPrompt = `You are an expert legal document drafter specialising in ${jurisdictionName} law. You produce complete, professionally formatted legal documents ready for immediate use.

Output rules — follow exactly:
- All variable fields use [SQUARE_BRACKETS] e.g. [FULL_NAME], [DATE], [ADDRESS], [AMOUNT]
- Return ONLY the document HTML body — no <html>, <head>, <body>, or <style> tags
- Document title: <h1>TITLE IN UPPERCASE</h1>
- Main numbered sections: <h2>1. SECTION TITLE</h2>
- Subsections: <h3>1.1 Subsection Title</h3>
- Body text: <p>paragraph</p>
- Numbered clauses: <ol><li>clause text</li></ol>
- Bullet points: <ul><li>item</li></ul>
- Signature block: use <p> tags with "____________________" underscores for signature lines
- Do NOT use markdown, code fences, or any tags outside the above list
- Do NOT truncate or summarise — generate the complete document in full`;

  const userPrompt = `Draft a complete, professional ${docPromptDescription} governed by ${jurisdictionName} law (${legalSystem} system).

Requirements:
- Include every standard clause required under ${jurisdictionName} law — do not omit sections
- Minimum 8 substantive sections
- Include: definitions, obligations of both parties, term and termination, dispute resolution, governing law clause referencing ${jurisdictionName}, and execution/signature blocks
- Use proper legal drafting language appropriate for ${jurisdictionName}
- Generate the full document now — do not abbreviate or add placeholder sections`;

  try {
    const encoder = new TextEncoder();
    const result = await genAI.models.generateContentStream({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
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
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'complete', fullContent }) + '\n')
          );
        } catch {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'error', error: 'Generation failed' }) + '\n')
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
      JSON.stringify({ type: 'error', error: 'Failed to generate document' }) + '\n',
      { status: 500 }
    );
  }
}
