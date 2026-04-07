// src/app/api/payments/initialize/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE;
const PAYSTACK_TEAMS_PLAN_CODE = process.env.PAYSTACK_TEAMS_PLAN_CODE;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    if (!PAYSTACK_SECRET_KEY) {
      return createErrorResponse(
        new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500)
      );
    }

    // Parse planType from body — default to 'personal'
    const body = await request.json().catch(() => ({}));
    const planType: 'personal' | 'teams' = body.planType === 'teams' ? 'teams' : 'personal';

    const planCode = planType === 'teams' ? PAYSTACK_TEAMS_PLAN_CODE : PAYSTACK_PLAN_CODE;

    if (!planCode) {
      return createErrorResponse(
        new AppError(
          planType === 'teams' ? 'Teams plan not configured' : 'Subscription plan not configured',
          'PLAN_NOT_CONFIGURED',
          500
        )
      );
    }

    // Get user and primary organization (including trial fields)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            trialExpiresAt: true,
            trialExpired: true,
          },
        },
      },
    });

    if (!user?.organization) {
      return createErrorResponse(new AppError('User or organization not found', 'NOT_FOUND', 404));
    }

    if (!user.email) {
      return createErrorResponse(new AppError('User email not found', 'NOT_FOUND', 404));
    }

    // Only the org owner can upgrade
    if (user.organization.ownerId !== userId) {
      return createErrorResponse(new AppError('Only organization owners can upgrade', 'FORBIDDEN', 403));
    }

    // Check for an existing active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organization.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      // Allow upgrading from personal → teams even when a subscription exists
      if (existingSubscription.planType === planType) {
        return createBadRequestResponse(
          planType === 'teams'
            ? 'Your organization is already on the Teams plan.'
            : 'Your organization already has an active subscription.'
        );
      }
      // Different planType — proceed to let them switch (verify will upsert)
    }

    const reference = `WAN-${user.organization.id.slice(0, 8)}-${Date.now()}`;

    // If the user is currently on an active manual trial, defer the billing
    // start date to the day the trial expires so they are not charged twice.
    const now = new Date();
    const trialExpiresAt = user.organization.trialExpiresAt;
    const isActiveTrial =
      !user.organization.trialExpired &&
      trialExpiresAt != null &&
      trialExpiresAt > now;
    const startDate = isActiveTrial ? trialExpiresAt.toISOString() : undefined;

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        plan: planCode,
        // Paystack requires a valid amount even with a plan code.
        // The plan amount overrides this for actual billing — 100 is the safe minimum (1 unit of currency).
        amount: 100,
        reference,
        ...(startDate ? { start_date: startDate } : {}),
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          userId: user.id,
          organizationId: user.organization.id,
          organizationName: user.organization.name,
          planType,
          custom_fields: [
            {
              display_name: 'Organization',
              variable_name: 'organization_name',
              value: user.organization.name,
            },
            {
              display_name: 'User',
              variable_name: 'user_name',
              value: user.fullName || user.email,
            },
            {
              display_name: 'Plan Type',
              variable_name: 'plan_type',
              value: planType,
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return createErrorResponse(
        new AppError(
          paystackData.message || 'Failed to initialize payment',
          'PAYSTACK_ERROR',
          500
        )
      );
    }

    return createApiResponse(
      {
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        reference: paystackData.data.reference,
      },
      'Payment initialized successfully'
    );
  })
);
