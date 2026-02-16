// app/api/cron/legal-digest/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { generateLegalDigest } from '@/services/legalDigestService';
import { sendLegalDigestEmail } from '@/lib/email-service';
import { PRACTICE_AREA_LABELS } from '@/types/associates';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return createErrorResponse(
      new AppError('Unauthorized', 'AUTH_REQUIRED', 401)
    );
  }

  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  // Fetch active subscriptions: daily always, weekly only on Mondays
  const subscriptions = await prisma.digestSubscription.findMany({
    where: {
      isActive: true,
      frequency: isMonday ? { in: ['daily', 'weekly'] } : 'daily',
    },
    include: {
      user: {
        select: { email: true, fullName: true },
      },
    },
  });

  if (subscriptions.length === 0) {
    return createApiResponse({ sent: 0, failed: 0 }, 'No active subscriptions');
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      // Convert topic keys to readable labels for the AI prompt
      const topicLabels = sub.topics.map(
        (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t
      );

      const digest = await generateLegalDigest(
        topicLabels,
        sub.jurisdictions,
        sub.frequency as 'daily' | 'weekly'
      );

      // Send the email
      const result = await sendLegalDigestEmail({
        email: sub.user.email,
        fullName: sub.user.fullName || 'there',
        digest,
        frequency: sub.frequency,
      });

      if (result.success) {
        // Record history and update lastSentAt
        await prisma.$transaction([
          prisma.digestHistory.create({
            data: {
              subscriptionId: sub.id,
              subject: `Law 360 ${sub.frequency === 'daily' ? 'Daily' : 'Weekly'} Digest: ${digest.headline}`,
              contentSummary: digest.summary,
              sourceCount: digest.sources.length,
            },
          }),
          prisma.digestSubscription.update({
            where: { id: sub.id },
            data: { lastSentAt: now },
          }),
        ]);
        sent++;
      } else {
        console.error(`Failed to send digest to ${sub.user.email}:`, result.error);
        failed++;
      }
    } catch (error) {
      console.error(`Error processing digest for subscription ${sub.id}:`, error);
      failed++;
    }
  }

  return createApiResponse(
    { sent, failed, total: subscriptions.length },
    `Digest run complete: ${sent} sent, ${failed} failed`
  );
}
