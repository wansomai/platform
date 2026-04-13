// src/app/api/public/export-payment-config/route.ts
//
// Unauthenticated — mirrors the logic in /api/payments/initialize:
// 1. Detect the user's country via x-vercel-ip-country
// 2. Try local currency first against Paystack
// 3. If Paystack says currency is not supported → fall back to USD
// 4. Return the validated config (amount, currency, channels, publicKey) to the client

import { NextRequest, NextResponse } from 'next/server';
import { EXPORT_PRICING, DEFAULT_EXPORT_PRICING, type ExportPricing } from '@/lib/exportPricing';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function isCurrencyError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('currency') ||
    lower.includes('not supported') ||
    lower.includes('invalid currency') ||
    lower.includes('unsupported')
  );
}

async function initializeTransaction(pricing: ExportPricing): Promise<{ ok: boolean }> {
  if (!PAYSTACK_SECRET_KEY) return { ok: false };

  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'currency-check@wansom.ai',
        amount: pricing.amount,
        currency: pricing.currency,
        reference: `EXPORT-CHECK-${pricing.currency}-${Date.now()}`,
        callback_url: 'https://www.wansom.ai',
        metadata: { isCurrencyCheck: true },
      }),
    });

    const data = await res.json();

    if (!data.status && isCurrencyError(data.message ?? '')) {
      return { ok: false };
    }

    return { ok: true };
  } catch {
    // Network error — assume supported to avoid blocking the user
    return { ok: true };
  }
}

export async function GET(request: NextRequest) {
  const publicKey =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ??
    process.env.PAYSTACK_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 500 }
    );
  }

  // Detect country — Vercel header in production, env var for local dev
  const rawCountry =
    request.headers.get('x-vercel-ip-country') ??
    process.env.DEV_COUNTRY_CODE ??
    '';
  const countryCode = rawCountry.toLowerCase();

  const localPricing: ExportPricing | null = countryCode
    ? (EXPORT_PRICING[countryCode] ?? null)
    : null;

  let pricing: ExportPricing;

  if (localPricing) {
    // Try local currency — same approach as /api/payments/initialize
    const { ok } = await initializeTransaction(localPricing);

    if (ok) {
      pricing = localPricing;
    } else {
      console.warn(
        `[export-payment-config] ${localPricing.currency} not yet enabled on merchant account ` +
        `(country: ${countryCode}). Falling back to USD.`
      );
      pricing = DEFAULT_EXPORT_PRICING;
    }
  } else {
    // Country not in pricing map → USD
    pricing = DEFAULT_EXPORT_PRICING;
  }

  return NextResponse.json({
    data: {
      amount: pricing.amount,
      currency: pricing.currency,
      label: pricing.label,
      channels: pricing.channels,
      publicKey,
    },
  });
}
