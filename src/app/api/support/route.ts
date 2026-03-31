// src/app/api/support/route.ts
//
// Sends a support ticket email to law@wansom.ai.
// Requires authentication — the session user is logged alongside the form payload.

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { createApiResponse, createBadRequestResponse, createUnauthorizedResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { sendEmail } from '@/lib/email-service';

const SUPPORT_EMAIL = 'law@wansom.ai';

const CATEGORY_LABELS: Record<string, string> = {
  general:         'General Inquiry',
  technical:       'Technical Issue',
  billing:         'Billing & Subscription',
  feature_request: 'Feature Request',
  account:         'Account & Access',
  other:           'Other',
};

const schema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  category: z.enum(['general', 'technical', 'billing', 'feature_request', 'account', 'other']),
  subject:  z.string().min(1).max(200),
  message:  z.string().min(20).max(5000),
});

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return createUnauthorizedResponse();

  let body: unknown;
  try { body = await request.json(); }
  catch { return createBadRequestResponse('Invalid request body'); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return createBadRequestResponse(parsed.error.errors[0].message);
  }

  const { name, email, category, subject, message } = parsed.data;
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">

        <!-- Header -->
        <div style="background: #0a4b5e; padding: 24px 32px;">
          <h1 style="margin: 0; color: #fff; font-size: 20px;">New Support Request</h1>
          <p style="margin: 4px 0 0; color: #a5d8e6; font-size: 13px;">via Wansom AI Help &amp; Support</p>
        </div>

        <!-- Meta -->
        <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280; width: 100px; white-space: nowrap;">From</td>
              <td style="padding: 4px 0; color: #111827; font-weight: 600;">${name} &lt;${email}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280;">Category</td>
              <td style="padding: 4px 0; color: #111827;">
                <span style="display: inline-block; background: #e0f2fe; color: #0369a1; border-radius: 4px; padding: 1px 8px; font-size: 12px; font-weight: 600;">${categoryLabel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #6b7280;">User ID</td>
              <td style="padding: 4px 0; color: #6b7280; font-size: 12px; font-family: monospace;">${userId}</td>
            </tr>
          </table>
        </div>

        <!-- Message -->
        <div style="padding: 24px 32px;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827;">${subject}</h2>
          <div style="font-size: 14px; color: #374151; white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Reply directly to this email to respond to the user.
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to:      SUPPORT_EMAIL,
      subject: `[Support] ${categoryLabel}: ${subject}`,
      html,
      replyTo: `"${name}" <${email}>`,
    });
  } catch (err) {
    console.error('[support] email send failed:', err);
    throw new AppError('Failed to send your message. Please try again.', 'EMAIL_SEND_FAILED', 500);
  }

  return createApiResponse(null, 'Your message has been sent. We\'ll be in touch shortly.');
}
