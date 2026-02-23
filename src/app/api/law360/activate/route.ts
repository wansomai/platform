import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiResponse, createErrorResponse, createBadRequestResponse } from '@/lib/api/response';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { AppError } from '@/types/error';
import { sendLaw360WelcomeEmail } from '@/lib/email-service';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const LAW360_PLAN_CODE = process.env.LAW360_PLAN_CODE;
const LAW360KENYA_PLAN_CODE = process.env.LAW360KENYA_PLAN_CODE;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://wansom.ai';

const activateSchema = z.object({
  frequency: z.enum(['daily', 'weekly']),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  jurisdictions: z.array(z.string()).min(1, 'Select at least one jurisdiction'),
  tempPassword: z.string().optional(),
});

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    if (!PAYSTACK_SECRET_KEY) {
      return createErrorResponse(
        new AppError('Payment service not configured', 'PAYMENT_NOT_CONFIGURED', 500)
      );
    }

    if (!LAW360_PLAN_CODE && !LAW360KENYA_PLAN_CODE) {
      return createErrorResponse(
        new AppError('Briefly by Wansom plan not configured', 'PLAN_NOT_CONFIGURED', 500)
      );
    }

    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return createBadRequestResponse(
        parsed.error.errors.map((e) => e.message).join(', ')
      );
    }

    const { frequency, topics, jurisdictions, tempPassword } = parsed.data;

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return createErrorResponse(
        new AppError('User or organization not found', 'NOT_FOUND', 404)
      );
    }

    // Create or update digest subscription
    const existingSub = await prisma.digestSubscription.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: user.organizationId,
        },
      },
    });

    if (existingSub) {
      await prisma.digestSubscription.update({
        where: { id: existingSub.id },
        data: { frequency, topics, jurisdictions, isActive: true },
      });
    } else {
      await prisma.digestSubscription.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          frequency,
          topics,
          jurisdictions,
          isActive: true,
        },
      });
    }

    // Send welcome email with login details for new auto-registered users.
    // Fires before Paystack redirect so the account exists for follow-up even if payment isn't completed.
    if (tempPassword) {
      try {
        await sendLaw360WelcomeEmail({
          email: user.email,
          fullName: user.fullName || user.email,
          password: tempPassword,
          frequency,
          jurisdictions,
          topics,
        });
      } catch (err) {
        console.error('Failed to send Briefly welcome email:', err);
      }
    }

    // Determine pricing based on jurisdiction
    const isKenya = jurisdictions.includes('KE');
    const planCode = isKenya ? LAW360KENYA_PLAN_CODE : LAW360_PLAN_CODE;
    const amount = isKenya ? 1000 * 100 : 10 * 100; // Paystack expects amount in smallest currency unit
    const currency = isKenya ? 'KES' : 'USD';

    if (!planCode) {
      return createErrorResponse(
        new AppError(
          `Briefly by Wansom ${isKenya ? 'Kenya' : 'USD'} plan not configured`,
          'PLAN_NOT_CONFIGURED',
          500
        )
      );
    }

    // Initialize Paystack transaction
    const reference = `BRIEFLY-${user.id.slice(0, 8)}-${Date.now()}`;

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency,
        reference,
        plan: planCode,
        channels: isKenya ? ['mobile_money', 'card'] : undefined,
        callback_url: `${APP_URL}/law360/payment/callback`,
        metadata: {
          userId: user.id,
          organizationId: user.organizationId,
          law360: true,
          planCode,
          currency,
          custom_fields: [
            {
              display_name: 'Product',
              variable_name: 'product',
              value: 'Briefly by Wansom',
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
        reference: paystackData.data.reference,
      },
      'Payment initialized successfully'
    );
  })
);
