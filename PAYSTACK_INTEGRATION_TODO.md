# Paystack Billing Integration - Implementation Guide

## Current Status

The database schema is ready with `Subscription` and `Payment` models that include Paystack-specific fields:
- `paystackSubscriptionId`
- `paystackCustomerId`
- `paystackReference`

However, the actual Paystack API integration is not yet complete.

## Required Implementation

### 1. Paystack Configuration

Add to `.env`:
```
PAYSTACK_SECRET_KEY=sk_test_xxxxx or sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx or pk_live_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
```

### 2. Create Paystack Service (`src/lib/paystack-service.ts`)

```typescript
import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const PaystackService = {
  // Initialize subscription
  async initializeTransaction(params: {
    email: string;
    amount: number; // in kobo (NGN) or pesewas (GHS)
    plan: string; // plan code
    metadata?: any;
  }) {
    // POST /transaction/initialize
  },

  // Create customer
  async createCustomer(params: {
    email: string;
    first_name?: string;
    last_name?: string;
  }) {
    // POST /customer
  },

  // Create subscription plan (one-time setup)
  async createPlan(params: {
    name: string;
    amount: number;
    interval: 'monthly' | 'annually';
  }) {
    // POST /plan
  },

  // Subscribe customer to plan
  async createSubscription(params: {
    customer: string; // customer code
    plan: string; // plan code
  }) {
    // POST /subscription
  },

  // Cancel subscription
  async cancelSubscription(subscriptionCode: string, cancelToken: string) {
    // POST /subscription/:code/cancel
  },

  // Verify transaction
  async verifyTransaction(reference: string) {
    // GET /transaction/verify/:reference
  },

  // Get subscription details
  async getSubscription(subscriptionCode: string) {
    // GET /subscription/:code
  }
};
```

### 3. Upgrade Endpoint Integration

Update `src/app/api/organization/upgrade/route.ts`:

**Current**: Just changes `accountType` to ENTERPRISE
**Required**:
1. Initialize Paystack transaction/subscription
2. Redirect user to Paystack payment page
3. Handle callback after payment
4. Create subscription record in database

```typescript
export const POST = async (request: NextRequest, userId: string) => {
  // ... existing permission checks ...

  // Initialize Paystack transaction
  const transaction = await PaystackService.initializeTransaction({
    email: user.email,
    amount: 50000, // e.g., NGN 500.00
    plan: 'enterprise-plan',
    metadata: {
      organizationId,
      userId
    }
  });

  // Return payment URL to frontend
  return NextResponse.json({
    success: true,
    paymentUrl: transaction.data.authorization_url,
    reference: transaction.data.reference
  });
};
```

### 4. Payment Verification Endpoint

Create `src/app/api/billing/verify-payment/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get('reference');

  // Verify transaction with Paystack
  const verification = await PaystackService.verifyTransaction(reference);

  if (verification.data.status === 'success') {
    const { organizationId } = verification.data.metadata;

    // Update organization to enterprise
    await prisma.organization.update({
      where: { id: organizationId },
      data: { accountType: 'enterprise' }
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        organizationId,
        paystackSubscriptionId: verification.data.subscription_code,
        paystackCustomerId: verification.data.customer.customer_code,
        planName: 'enterprise',
        planPrice: verification.data.amount,
        billingCycle: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculateNextBillingDate()
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        paystackReference: reference,
        amount: verification.data.amount,
        currency: verification.data.currency,
        status: 'success',
        paidAt: new Date()
      }
    });
  }

  // Redirect to success/failure page
}
```

### 5. Webhook Handler

Create `src/app/api/webhooks/paystack/route.ts`:

```typescript
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle different events
  switch (event.event) {
    case 'subscription.create':
      // Handle new subscription
      break;

    case 'subscription.disable':
      // Handle cancelled subscription
      await handleSubscriptionCancellation(event.data);
      break;

    case 'charge.success':
      // Record successful payment
      await recordPayment(event.data);
      break;

    case 'subscription.not_renew':
      // Handle failed renewal
      await handleFailedRenewal(event.data);
      break;
  }

  return NextResponse.json({ received: true });
}
```

### 6. Subscription Management Endpoints

Create `src/app/api/billing/subscription/route.ts`:

```typescript
// GET - Get current subscription details
export async function GET(request: NextRequest, userId: string) {
  // Fetch subscription from database
  // Get latest status from Paystack
  // Return subscription details
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest, userId: string) {
  // Cancel via Paystack API
  // Update database status
  // Determine grace period end date
}
```

### 7. Downgrade Endpoint Update

Update the downgrade endpoint to handle active subscriptions:

```typescript
export const DELETE = async (request: NextRequest, userId: string) => {
  // ... existing checks ...

  // Check if there's an active Paystack subscription
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId }
  });

  if (subscription?.paystackSubscriptionId) {
    // Cancel Paystack subscription
    await PaystackService.cancelSubscription(
      subscription.paystackSubscriptionId,
      subscription.paystackCustomerId
    );

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled' }
    });
  }

  // ... rest of downgrade logic ...
};
```

### 8. Frontend Integration

**Payment Page** (`app/upgrade/page.tsx`):
```typescript
async function handleUpgrade() {
  const response = await fetch('/api/organization/upgrade', {
    method: 'POST'
  });

  const data = await response.json();

  if (data.paymentUrl) {
    // Redirect to Paystack payment page
    window.location.href = data.paymentUrl;
  }
}
```

**Payment Callback Page** (`app/payment-callback/page.tsx`):
```typescript
useEffect(() => {
  const reference = searchParams.get('reference');

  // Verify payment
  fetch(\`/api/billing/verify-payment?reference=\${reference}\`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        router.push('/dashboard?upgraded=true');
      } else {
        router.push('/upgrade?error=payment_failed');
      }
    });
}, []);
```

## Testing Checklist

### Test Mode Setup
1. Use Paystack test API keys
2. Test cards: `4084 0840 8408 4081` (successful), `4084 0840 8408 4008` (declined)

### Scenarios to Test
- [ ] Successful upgrade payment
- [ ] Failed payment
- [ ] Subscription cancellation
- [ ] Subscription renewal
- [ ] Failed renewal handling
- [ ] Webhook signature verification
- [ ] Payment verification
- [ ] Downgrade with active subscription

## Security Considerations

1. **Webhook Verification**: Always verify Paystack webhook signatures
2. **Payment Verification**: Never trust client-side payment status; always verify with Paystack
3. **API Keys**: Keep secret keys secure, never expose to frontend
4. **Reference Validation**: Validate payment references before processing
5. **Idempotency**: Handle duplicate webhook events gracefully

## Additional Features to Consider

1. **Proration**: Handle mid-cycle upgrades/downgrades
2. **Trial Periods**: Implement free trials
3. **Multiple Plans**: Support different pricing tiers (Basic, Pro, Enterprise)
4. **Annual Billing**: Offer annual subscriptions with discounts
5. **Usage-Based Billing**: Track and bill for overages
6. **Invoice Generation**: Generate invoices for payments
7. **Payment History**: Display payment history to users
8. **Failed Payment Retries**: Automatic retry logic
9. **Grace Periods**: Allow access after failed payments for X days
10. **Refunds**: Implement refund processing via API

## References

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Paystack Subscriptions Guide](https://paystack.com/docs/payments/subscriptions/)
- [Paystack Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack Test Cards](https://paystack.com/docs/payments/test-payments/)
