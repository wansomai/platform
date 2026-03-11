// src/app/api/public/payment/initialize/route.ts
// Public endpoint — no auth required. Initializes a one-time Paystack transaction
// for guest document export with the correct currency for the user's jurisdiction.
import { NextRequest } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Pricing per jurisdiction (amount in smallest currency unit)
const JURISDICTION_PRICING: Record<string, { amount: number; currency: string }> = {
  ng: { amount: 250000, currency: 'NGN' }, // ₦2,500
  ke: { amount: 35000,  currency: 'KES' }, // KES 350
  za: { amount: 4500,   currency: 'ZAR' }, // R45
  gh: { amount: 7500,   currency: 'GHS' }, // GHS 75
};
const DEFAULT_PRICING = { amount: 500, currency: 'USD' }; // $5

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, jurisdictionId, documentType, documentTitle } = body;

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'A valid email address is required' }, { status: 400 });
  }

  if (!PAYSTACK_SECRET_KEY) {
    // Dev/test environment — return a dummy access code so the client skips payment
    return Response.json({ accessCode: null, reference: null });
  }

  const pricing = JURISDICTION_PRICING[jurisdictionId] || DEFAULT_PRICING;
  const reference = `WANSOM-DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: pricing.amount,
      currency: pricing.currency,
      reference,
      metadata: {
        documentType,
        documentTitle,
        jurisdictionId,
        custom_fields: [
          { display_name: 'Document', variable_name: 'document_type', value: documentTitle || documentType },
          { display_name: 'Jurisdiction', variable_name: 'jurisdiction', value: jurisdictionId },
        ],
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    console.error('[public/payment/initialize] Paystack error:', paystackData);
    return Response.json(
      { error: paystackData.message || 'Failed to initialize payment' },
      { status: 502 }
    );
  }

  return Response.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
    amount: pricing.amount,
    currency: pricing.currency,
  });
}
