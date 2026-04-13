// src/app/api/payments/initialize/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';
import { SUBSCRIPTION_PRICING, DEFAULT_SUBSCRIPTION_PRICING } from '@/lib/subscriptionPricing';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// Fallback plan codes for countries not in the pricing map below
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

    // Detect user country for localized pricing
    const countryCode = (
      request.headers.get('x-vercel-ip-country') ??
      process.env.DEV_COUNTRY_CODE ??
      ''
    ).toLowerCase();

    const localPricing = SUBSCRIPTION_PRICING[countryCode] ?? null;

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

    // If the user is on an active manual trial, defer billing start to trial end
    const now = new Date();
    const trialExpiresAt = user.organization.trialExpiresAt;
    const isActiveTrial =
      !user.organization.trialExpired &&
      trialExpiresAt != null &&
      trialExpiresAt > now;
    const startDate = isActiveTrial ? trialExpiresAt.toISOString() : undefined;

    const commonMetadata = {
      userId: user.id,
      organizationId: user.organization.id,
      organizationName: user.organization.name,
      planType,
      custom_fields: [
        { display_name: 'Organization', variable_name: 'organization_name', value: user.organization.name },
        { display_name: 'User',         variable_name: 'user_name',         value: user.fullName || user.email },
        { display_name: 'Plan Type',    variable_name: 'plan_type',         value: planType },
      ],
    };

    // ── Helper: build the USD plan-code fallback body ─────────────────────────
    const buildUsdFallbackBody = (): Record<string, any> | null => {
      const planCode = planType === 'teams' ? PAYSTACK_TEAMS_PLAN_CODE : PAYSTACK_PLAN_CODE;
      if (!planCode) return null;
      return {
        email: user.email,
        plan: planCode,
        amount: 100, // overridden by plan — 100 is the safe minimum Paystack requires
        reference,
        ...(startDate ? { start_date: startDate } : {}),
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          ...commonMetadata,
          usedUsdFallback: true, // diagnostic flag
        },
      };
    };

    // ── Helper: call Paystack /transaction/initialize ─────────────────────────
    const initializeTransaction = async (body: Record<string, any>) => {
      const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      return res.json();
    };

    // ── Helper: detect a currency-not-supported error from Paystack ───────────
    const isCurrencyError = (msg: string): boolean => {
      const lower = msg.toLowerCase();
      return (
        lower.includes('currency') ||
        lower.includes('not supported') ||
        lower.includes('invalid currency') ||
        lower.includes('unsupported')
      );
    };

    let paystackData: any;

    if (localPricing) {
      // ── Try local currency first ───────────────────────────────────────────
      const amount = planType === 'teams' ? localPricing.teams : localPricing.personal;

      const localBody: Record<string, any> = {
        email: user.email,
        amount,
        currency: localPricing.currency,
        channels: localPricing.channels,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          ...commonMetadata,
          isDirectPayment: true,
        },
      };

      paystackData = await initializeTransaction(localBody);

      // ── Currency not yet enabled on merchant account → fall back to USD ────
      if (!paystackData.status && isCurrencyError(paystackData.message ?? '')) {
        console.warn(
          `[payments/initialize] ${localPricing.currency} not supported on merchant account ` +
          `(country: ${countryCode}). Falling back to USD plan code.`
        );

        const fallbackBody = buildUsdFallbackBody();
        if (!fallbackBody) {
          return createErrorResponse(
            new AppError(
              'This currency is not yet enabled. USD fallback plan is also not configured.',
              'PLAN_NOT_CONFIGURED',
              500
            )
          );
        }

        paystackData = await initializeTransaction(fallbackBody);
      }
    } else {
      // ── No local pricing for this country — go straight to USD plan code ───
      const fallbackBody = buildUsdFallbackBody();
      if (!fallbackBody) {
        return createErrorResponse(
          new AppError(
            planType === 'teams' ? 'Teams plan not configured' : 'Subscription plan not configured',
            'PLAN_NOT_CONFIGURED',
            500
          )
        );
      }
      paystackData = await initializeTransaction(fallbackBody);
    }

    if (!paystackData.status) {
      console.error('[payments/initialize] Paystack initialization failed:', paystackData);
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
