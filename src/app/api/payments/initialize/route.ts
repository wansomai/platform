// src/app/api/payments/initialize/route.ts
import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';
import { AppError } from '@/types/error';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PLAN_CODE = process.env.PAYSTACK_PLAN_CODE; // Your Paystack subscription plan code
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    if (!PAYSTACK_SECRET_KEY) {
      return createErrorResponse(
        new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500)
      );
    }

    if (!PAYSTACK_PLAN_CODE) {
      return createErrorResponse(
        new AppError('Subscription plan not configured', 'PLAN_NOT_CONFIGURED', 500)
      );
    }

    // Get user and organization info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });

    if (!user || !user.organization) {
      return createErrorResponse(
        new AppError('User or organization not found', 'NOT_FOUND', 404)
      );
    }

    // Check if user is the organization owner
    if (user.organization.ownerId !== userId) {
      return createErrorResponse(
        new AppError('Only organization owners can upgrade', 'FORBIDDEN', 403)
      );
    }

    // Check if already on enterprise plan
    if (user.organization.accountType === 'enterprise') {
      return createBadRequestResponse('Already on enterprise plan');
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organization.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return createBadRequestResponse('Already have an active subscription');
    }

    // Generate unique reference
    const reference = `WAN-${user.organization.id.slice(0, 8)}-${Date.now()}`;

    // Initialize Paystack transaction with plan (creates subscription on successful payment)
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        plan: PAYSTACK_PLAN_CODE, // This creates a subscription on successful payment
        amount: 2, // Amount is handled by the plan
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          userId: user.id,
          organizationId: user.organization.id,
          organizationName: user.organization.name,
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
