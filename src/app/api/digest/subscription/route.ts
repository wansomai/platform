// app/api/digest/subscription/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withAuth } from '@/lib/api/middleware';
import {
  createApiResponse,
  createBadRequestResponse,
} from '@/lib/api/response';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { sendDigestSubscriptionEmail } from '@/lib/email-service';
import { PRACTICE_AREA_LABELS } from '@/types/associates';
import { JURISDICTIONS } from '@/services/legalDigestService';
import { z } from 'zod';

const subscriptionSchema = z.object({
  frequency: z.enum(['daily', 'weekly']),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  jurisdictions: z.array(z.string()).min(1, 'Select at least one jurisdiction'),
});

/**
 * GET - Fetch the current user's digest subscription
 */
export const GET = withErrorHandler(
  withAuth(async (_request: NextRequest, userId: string) => {
    const organizationId = await getActiveOrganizationId(userId);
    if (!organizationId) {
      return createBadRequestResponse('No active organization');
    }

    const subscription = await prisma.digestSubscription.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      include: {
        history: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    return createApiResponse(subscription);
  })
);

/**
 * POST - Create or update a digest subscription
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    const organizationId = await getActiveOrganizationId(userId);
    if (!organizationId) {
      return createBadRequestResponse('No active organization');
    }

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return createBadRequestResponse(parsed.error.errors[0].message);
    }

    const { frequency, topics, jurisdictions } = parsed.data;

    // Check if this is a new subscription (not an update)
    const existing = await prisma.digestSubscription.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    const isNewSubscription = !existing || !existing.isActive;

    const subscription = await prisma.digestSubscription.upsert({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      update: {
        frequency,
        topics,
        jurisdictions,
        isActive: true,
      },
      create: {
        userId,
        organizationId,
        frequency,
        topics,
        jurisdictions,
        isActive: true,
      },
    });

    // Send confirmation email for new subscriptions
    if (isNewSubscription) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (user) {
        const jurisdictionNames = jurisdictions.map(
          (code) => JURISDICTIONS[code]?.name || code
        );
        const topicLabels = topics.map(
          (t) => PRACTICE_AREA_LABELS[t as keyof typeof PRACTICE_AREA_LABELS] || t
        );

        sendDigestSubscriptionEmail({
          email: user.email,
          fullName: user.fullName || 'there',
          frequency,
          jurisdictions: jurisdictionNames,
          topics: topicLabels,
        });
      }
    }

    return createApiResponse(subscription, 'Subscription updated');
  })
);

/**
 * DELETE - Unsubscribe (deactivate)
 */
export const DELETE = withErrorHandler(
  withAuth(async (_request: NextRequest, userId: string) => {
    const organizationId = await getActiveOrganizationId(userId);
    if (!organizationId) {
      return createBadRequestResponse('No active organization');
    }

    const existing = await prisma.digestSubscription.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!existing) {
      return createApiResponse(null, 'No subscription found');
    }

    await prisma.digestSubscription.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return createApiResponse(null, 'Unsubscribed successfully');
  })
);
