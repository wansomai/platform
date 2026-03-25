import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { createErrorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';

async function handler(request: NextRequest) {
  const body = await request.json();
  const { subject, htmlContent, offset = 0, limit = 50, delayMs = 200 } = body;

  if (!subject?.trim()) {
    return createErrorResponse('subject is required', 400);
  }
  if (!htmlContent?.trim()) {
    return createErrorResponse('htmlContent is required', 400);
  }

  // Test mode: send only to the provided addresses, skip DB
  if (Array.isArray(body.testEmails) && body.testEmails.length > 0) {
    const testUsers = (body.testEmails as string[]).map((email: string) => ({
      email: email.trim(),
      fullName: null,
    }));

    const testResults: { email: string; status: 'sent' | 'failed'; error?: string }[] = [];
    for (const user of testUsers) {
      const personalizedHtml = htmlContent
        .replace(/\{\{firstName\}\}/gi, '')
        .replace(/\{\{lastName\}\}/gi, '')
        .replace(/\{\{fullName\}\}/gi, '')
        .replace(/\{\{email\}\}/gi, user.email);
      try {
        await sendEmail({ to: user.email, subject: `[TEST] ${subject}`, html: personalizedHtml });
        testResults.push({ email: user.email, status: 'sent' });
      } catch (err) {
        testResults.push({ email: user.email, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
    return NextResponse.json({ success: true, test: true, results: testResults });
  }

  // Fetch the batch of users
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { email: true, fullName: true },
      orderBy: { createdAt: 'asc' },
      skip: Number(offset),
      take: Number(limit),
    }),
    prisma.user.count(),
  ]);

  const results: { email: string; status: 'sent' | 'failed'; error?: string }[] = [];

  for (const user of users) {
    const parts = user.fullName?.trim().split(/\s+/) ?? [];
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');

    const personalizedHtml = htmlContent
      .replace(/\{\{firstName\}\}/gi, firstName)
      .replace(/\{\{lastName\}\}/gi, lastName)
      .replace(/\{\{fullName\}\}/gi, user.fullName || '')
      .replace(/\{\{email\}\}/gi, user.email);

    try {
      await sendEmail({ to: user.email, subject, html: personalizedHtml });
      results.push({ email: user.email, status: 'sent' });
    } catch (err) {
      results.push({
        email: user.email,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    if (delayMs > 0 && results.length < users.length) {
      await new Promise((resolve) => setTimeout(resolve, Number(delayMs)));
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  return NextResponse.json({
    success: true,
    offset: Number(offset),
    limit: Number(limit),
    total,
    batchSize: users.length,
    sent,
    failed,
    results,
  });
}

export const POST = withAdminAuth(handler);
export const maxDuration = 60;
