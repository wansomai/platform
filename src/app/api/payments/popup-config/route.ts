// src/app/api/payments/popup-config/route.ts
//
// Returns the config needed by the ProAccess modal to open a Paystack inline popup.
// Authenticated — requires a valid Bearer token.
//
// Currency probe: before returning local pricing, we verify the merchant account
// actually has that currency enabled. If not, we fall back to USD so the modal
// shows the correct price that the user will actually be charged.
// Results are cached in module scope (per server instance) with a 1-hour TTL
// to avoid probing Paystack on every modal open.

import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';
import {
  getSubscriptionPricing,
  getExplorerPricing,
  DEFAULT_SUBSCRIPTION_PRICING,
  DEFAULT_EXPLORER_PRICING,
} from '@/lib/subscriptionPricing';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Module-level cache so we only probe each currency once per server lifecycle.
const currencyCache = new Map<string, { supported: boolean; expiresAt: number }>();

async function isCurrencySupported(currency: string, email: string): Promise<boolean> {
  if (!PAYSTACK_SECRET_KEY) return false;

  // Return cached result if still fresh
  const cached = currencyCache.get(currency);
  if (cached && cached.expiresAt > Date.now()) return cached.supported;

  try {
    // Probe Paystack with a minimal initialize request — we only care about the
    // currency validation response, not the transaction itself.
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: 100,
        currency,
      }),
    });
    const data = await res.json();
    const supported = data.status === true;
    currencyCache.set(currency, { supported, expiresAt: Date.now() + CACHE_TTL_MS });
    return supported;
  } catch {
    // Network error — assume supported to avoid always falling back to USD
    return true;
  }
}

export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackPublicKey) {
      return createErrorResponse(
        new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500)
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, organization: { select: { id: true } } },
    });

    if (!user || !user.organization) {
      return createErrorResponse(new AppError('Organization not found', 'NOT_FOUND', 404));
    }

    // Detect country from Vercel header (production) or env var (local dev)
    const rawCountry =
      request.headers.get('x-vercel-ip-country') ??
      process.env.DEV_COUNTRY_CODE ??
      '';
    const countryCode = rawCountry.toLowerCase();

    const localPricing = getSubscriptionPricing(countryCode);
    const localExplorerPricing = getExplorerPricing(countryCode);

    // Only probe when the resolved currency differs from USD (no point probing USD itself)
    const needsProbe = localPricing.currency !== 'USD';
    const currencyOk = needsProbe ? await isCurrencySupported(localPricing.currency, user.email!) : true;

    const pricing = currencyOk ? localPricing : DEFAULT_SUBSCRIPTION_PRICING;
    const explorerPricing = currencyOk ? localExplorerPricing : DEFAULT_EXPLORER_PRICING;

    return createApiResponse({
      publicKey: paystackPublicKey,
      email: user.email,
      organizationId: user.organization.id,
      countryCode,
      pricing,
      explorerPricing,
    });
  })
);
