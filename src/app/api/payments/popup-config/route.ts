// src/app/api/payments/popup-config/route.ts
//
// Returns the config needed by the ProAccess modal to open a Paystack inline popup.
// Authenticated — requires a valid Bearer token.

import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';
import { getSubscriptionPricing } from '@/lib/subscriptionPricing';

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

    const pricing = getSubscriptionPricing(countryCode);

    return createApiResponse({
      publicKey: paystackPublicKey,
      email: user.email,
      organizationId: user.organization.id,
      countryCode,
      pricing,
    });
  })
);
