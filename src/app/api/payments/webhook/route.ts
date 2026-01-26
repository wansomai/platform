// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Verify Paystack webhook signature
function verifyPaystackSignature(body: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) return false;

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

  return hash === signature;
}

// Calculate subscription period end date based on plan interval
function calculatePeriodEnd(interval: string): Date {
  const now = new Date();
  const periodEnd = new Date(now);

  switch (interval) {
    case 'daily':
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;
    case 'weekly':
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;
    case 'monthly':
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      break;
    case 'quarterly':
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      break;
    case 'biannually':
      periodEnd.setMonth(periodEnd.getMonth() + 6);
      break;
    case 'annually':
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      break;
    default:
      periodEnd.setMonth(periodEnd.getMonth() + 1); // Default to monthly
  }

  return periodEnd;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature || !verifyPaystackSignature(body, signature)) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const data = event.data;

    console.log(`[Paystack Webhook] Processing event: ${eventType}`);

    switch (eventType) {
      // ========== SUBSCRIPTION EVENTS ==========
      case 'subscription.create': {
        // Subscription created successfully
        const subscriptionCode = data.subscription_code;
        const customerCode = data.customer?.customer_code;
        const customerEmail = data.customer?.email;
        const planCode = data.plan?.plan_code;
        const planName = data.plan?.name;
        const planInterval = data.plan?.interval;
        const amount = data.amount;
        const metadata = data.metadata || {};
        const organizationId = metadata.organizationId;

        if (!organizationId) {
          // Try to find organization by customer email
          const user = await prisma.user.findUnique({
            where: { email: customerEmail },
            include: { organization: true },
          });

          if (user?.organization) {
            const orgId = user.organization.id;
            const now = new Date();
            const periodEnd = calculatePeriodEnd(planInterval);

            await prisma.subscription.upsert({
              where: { organizationId: orgId },
              create: {
                organizationId: orgId,
                paystackSubscriptionId: subscriptionCode,
                paystackCustomerId: customerCode,
                planName: planName || 'professional',
                planPrice: String(amount / 100),
                billingCycle: planInterval || 'monthly',
                status: 'active',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
              update: {
                paystackSubscriptionId: subscriptionCode,
                paystackCustomerId: customerCode,
                planName: planName || 'professional',
                planPrice: String(amount / 100),
                billingCycle: planInterval || 'monthly',
                status: 'active',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            });

            console.log(`[Paystack Webhook] Subscription created for org: ${orgId}`);
          }
        } else {
          const now = new Date();
          const periodEnd = calculatePeriodEnd(planInterval);

          await prisma.subscription.upsert({
            where: { organizationId },
            create: {
              organizationId,
              paystackSubscriptionId: subscriptionCode,
              paystackCustomerId: customerCode,
              planName: planName || 'professional',
              planPrice: String(amount / 100),
              billingCycle: planInterval || 'monthly',
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
            update: {
              paystackSubscriptionId: subscriptionCode,
              paystackCustomerId: customerCode,
              planName: planName || 'professional',
              planPrice: String(amount / 100),
              billingCycle: planInterval || 'monthly',
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });

          console.log(`[Paystack Webhook] Subscription created for org: ${organizationId}`);
        }
        break;
      }

      case 'subscription.not_renew': {
        // Subscription marked as non-renewing (user cancelled but current period still active)
        const subscriptionCode = data.subscription_code;

        if (subscriptionCode) {
          await prisma.subscription.updateMany({
            where: { paystackSubscriptionId: subscriptionCode },
            data: { status: 'non_renewing' },
          });

          console.log(`[Paystack Webhook] Subscription marked non-renewing: ${subscriptionCode}`);
        }
        break;
      }

      case 'subscription.disable': {
        // Subscription fully cancelled/disabled
        const subscriptionCode = data.subscription_code;

        if (subscriptionCode) {
          await prisma.subscription.updateMany({
            where: { paystackSubscriptionId: subscriptionCode },
            data: { status: 'cancelled' },
          });

          console.log(`[Paystack Webhook] Subscription disabled: ${subscriptionCode}`);
        }
        break;
      }

      // ========== CHARGE/PAYMENT EVENTS ==========
      case 'charge.success': {
        // Successful payment (initial or recurring)
        const reference = data.reference;
        const amount = data.amount;
        const currency = data.currency;
        const channel = data.channel;
        const paidAt = data.paid_at;
        const metadata = data.metadata || {};
        const organizationId = metadata.organizationId;
        const customerEmail = data.customer?.email;

        // Check if payment already processed
        const existingPayment = await prisma.payment.findUnique({
          where: { paystackReference: reference },
        });

        if (existingPayment) {
          console.log(`[Paystack Webhook] Payment already processed: ${reference}`);
          break;
        }

        // Find the subscription to link the payment
        let subscription = null;

        if (organizationId) {
          subscription = await prisma.subscription.findUnique({
            where: { organizationId },
          });
        }

        if (!subscription && customerEmail) {
          // Try to find by customer email
          const user = await prisma.user.findUnique({
            where: { email: customerEmail },
            include: { organization: true },
          });

          if (user?.organization) {
            subscription = await prisma.subscription.findUnique({
              where: { organizationId: user.organization.id },
            });

            // If no subscription exists yet, create one (for initial payment)
            if (!subscription && data.plan) {
              const planInterval = data.plan?.interval || 'monthly';
              const now = new Date();
              const periodEnd = calculatePeriodEnd(planInterval);

              subscription = await prisma.subscription.create({
                data: {
                  organizationId: user.organization.id,
                  paystackCustomerId: data.customer?.customer_code,
                  planName: data.plan?.name || 'professional',
                  planPrice: String(amount / 100),
                  billingCycle: planInterval,
                  status: 'active',
                  currentPeriodStart: now,
                  currentPeriodEnd: periodEnd,
                },
              });
            }
          }
        }

        if (subscription) {
          // Create payment record
          await prisma.payment.create({
            data: {
              subscriptionId: subscription.id,
              paystackReference: reference,
              amount: amount,
              currency: currency || 'USD',
              status: 'success',
              paymentMethod: channel || 'card',
              paidAt: paidAt ? new Date(paidAt) : new Date(),
              metadata: {
                gatewayResponse: data.gateway_response,
                channel: channel,
                source: 'webhook',
              },
            },
          });

          // Update subscription period for recurring payments
          if (data.plan) {
            const planInterval = data.plan?.interval || 'monthly';
            const now = new Date();
            const periodEnd = calculatePeriodEnd(planInterval);

            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'active',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            });
          }

          console.log(`[Paystack Webhook] Payment recorded for subscription: ${subscription.id}`);
        }
        break;
      }

      // ========== INVOICE EVENTS ==========
      case 'invoice.create': {
        // Invoice created (3 days before payment due)
        console.log(`[Paystack Webhook] Invoice created for subscription: ${data.subscription?.subscription_code}`);
        break;
      }

      case 'invoice.payment_failed': {
        // Payment attempt failed
        const subscriptionCode = data.subscription?.subscription_code;
        const reference = data.reference;
        const description = data.description;

        if (subscriptionCode) {
          // Update subscription status to attention
          const subscription = await prisma.subscription.findFirst({
            where: { paystackSubscriptionId: subscriptionCode },
          });

          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'attention' },
            });

            // Record the failed payment attempt
            if (reference) {
              const existingPayment = await prisma.payment.findUnique({
                where: { paystackReference: reference },
              });

              if (!existingPayment) {
                await prisma.payment.create({
                  data: {
                    subscriptionId: subscription.id,
                    paystackReference: reference,
                    amount: data.amount || 0,
                    currency: data.currency || 'USD',
                    status: 'failed',
                    metadata: {
                      failureReason: description,
                      source: 'webhook',
                    },
                  },
                });
              }
            }

            console.log(`[Paystack Webhook] Payment failed for subscription: ${subscriptionCode}, reason: ${description}`);
          }
        }
        break;
      }

      case 'invoice.update': {
        // Invoice status updated after payment attempt
        console.log(`[Paystack Webhook] Invoice updated: ${data.reference}`);
        break;
      }

      default:
        console.log(`[Paystack Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
