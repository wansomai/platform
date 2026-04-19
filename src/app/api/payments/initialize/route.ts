// src/app/api/payments/initialize/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';
import { SUBSCRIPTION_PRICING, DEFAULT_SUBSCRIPTION_PRICING, DEFAULT_EXPLORER_PRICING, getExplorerPricing } from '@/lib/subscriptionPricing';

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

    // Parse planType and optional seatCount from body
    const body = await request.json().catch(() => ({}));
    const rawPlanType: string = body.planType ?? 'personal';
    const planType: 'personal' | 'teams' | 'explorer' =
      rawPlanType === 'teams' ? 'teams' : rawPlanType === 'explorer' ? 'explorer' : 'personal';
    const seatCount: number = planType === 'teams' && typeof body.seatCount === 'number' && body.seatCount >= 1
      ? Math.floor(body.seatCount)
      : 1;
    const firmName = typeof body.firmName === 'string' ? body.firmName.trim() : '';

    if (planType === 'teams' && !firmName) {
      return createBadRequestResponse('Firm name is required for Team Plan payment');
    }

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

    // Persist firm name and team size on the organization if provided
    if (firmName || (planType === 'teams' && seatCount >= 1)) {
      const orgUpdate: Record<string, any> = {};
      if (firmName) orgUpdate.name = firmName;
      if (planType === 'teams') orgUpdate.firmSize = String(seatCount);
      await prisma.organization.update({
        where: { id: user.organization.id },
        data: orgUpdate,
      });
    }

    const reference = `WAN-${user.organization.id.slice(0, 8)}-${Date.now()}`;
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
      seatCount,
      custom_fields: [
        { display_name: 'Organization', variable_name: 'organization_name', value: user.organization.name },
        { display_name: 'User',         variable_name: 'user_name',         value: user.fullName || user.email },
        { display_name: 'Plan Type',    variable_name: 'plan_type',         value: planType },
        { display_name: 'Seats',        variable_name: 'seat_count',        value: String(seatCount) },
      ],
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

    // ── Helper: build the USD plan-code fallback body ─────────────────────────
    const buildUsdFallbackBody = (): Record<string, any> | null => {
      const planCode = planType === 'teams' ? PAYSTACK_TEAMS_PLAN_CODE : PAYSTACK_PLAN_CODE;
      if (!planCode) return null;
      return {
        email: user.email,
        plan: planCode,
        amount: 100,
        reference,
        ...(startDate ? { start_date: startDate } : {}),
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          ...commonMetadata,
          usedUsdFallback: true,
        },
      };
    };

    // ── Explorer plan: one-time charge, 14-day access ────────────────────────
    if (planType === 'explorer') {
      const explorerPricing = getExplorerPricing(countryCode);

      // Prevent re-purchasing if an active explorer period is still running
      const existingExplorer = await prisma.subscription.findUnique({
        where: { organizationId: user.organization.id },
        select: { planName: true, status: true, currentPeriodEnd: true },
      });
      if (
        existingExplorer?.planName === 'explorer' &&
        existingExplorer.status === 'active' &&
        existingExplorer.currentPeriodEnd &&
        existingExplorer.currentPeriodEnd > new Date()
      ) {
        return createBadRequestResponse('Your Explorer access is still active.');
      }

      const buildExplorerBody = (pricing: typeof explorerPricing): Record<string, any> => ({
        email: user.email,
        amount: pricing.amount,
        currency: pricing.currency,
        channels: pricing.currency === 'KES' ? ['mobile_money', 'card'] : ['card'],
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          ...commonMetadata,
          planType: 'explorer',
          isDirectPayment: true,
          countryCode,
        },
      });

      // Try local currency first; fall back to USD if merchant hasn't enabled it
      let explorerData = await initializeTransaction(buildExplorerBody(explorerPricing));

      if (!explorerData.status && isCurrencyError(explorerData.message ?? '')) {
        console.warn(
          `[payments/initialize] Explorer: ${explorerPricing.currency} not enabled on merchant account ` +
          `(country: ${countryCode}). Falling back to USD.`
        );
        explorerData = await initializeTransaction(buildExplorerBody(DEFAULT_EXPLORER_PRICING));
      }

      if (!explorerData.status) {
        console.error('[payments/initialize] Explorer Paystack error:', explorerData);
        return createErrorResponse(
          new AppError(explorerData.message || 'Failed to initialize Explorer payment', 'PAYSTACK_ERROR', 500)
        );
      }

      return createApiResponse(
        {
          authorizationUrl: explorerData.data.authorization_url,
          accessCode: explorerData.data.access_code,
          reference: explorerData.data.reference,
        },
        'Explorer payment initialized successfully'
      );
    }

    // Check for an existing active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organization.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      // Allow upgrading from an expired or active explorer plan to a paid plan
      if (existingSubscription.planName === 'explorer') {
        // Fall through — let the pro payment proceed and upsert over the explorer record
      } else if (existingSubscription.planType === planType) {
        return createBadRequestResponse(
          planType === 'teams'
            ? 'Your organization is already on the Teams plan.'
            : 'Your organization already has an active subscription.'
        );
      }
      // Different planType — proceed to let them switch (verify will upsert)
    }

    let paystackData: any;

    if (localPricing) {
      // ── Try local currency first ───────────────────────────────────────────
      const perSeatAmount = planType === 'teams' ? localPricing.teams : localPricing.personal;
      const amount = planType === 'teams' ? perSeatAmount * seatCount : perSeatAmount;

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
