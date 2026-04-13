// src/lib/subscriptionPricing.ts
//
// Single source of truth for subscription pricing used by:
//  - ProAccess modal (client) — to build the Paystack inline popup
//  - /api/payments/webhook (server) — to verify the charged amount
//  - /api/payments/popup-config (server) — to expose config to the client
//
// All amounts are in the smallest currency unit (kobo, cents, pesewas, etc.)

export interface PlanPricing {
  currency: string;
  personal: number;
  teams: number;
  channels: string[];
}

// Countries with localised pricing.
// Unsupported countries fall back to DEFAULT_SUBSCRIPTION_PRICING.
export const SUBSCRIPTION_PRICING: Record<string, PlanPricing> = {
  ke: { currency: 'KES', personal: 150000, teams: 200000, channels: ['mobile_money', 'card'] },
  ng: { currency: 'NGN', personal: 1900000, teams: 2400000, channels: ['card'] },
  za: { currency: 'ZAR', personal: 22000, teams: 27500, channels: ['card'] },
  gh: { currency: 'GHS', personal: 18000, teams: 23000, channels: ['card'] },
  gb: { currency: 'GBP', personal: 999, teams: 1199, channels: ['card'] },
  us: { currency: 'USD', personal: 1200, teams: 1500, channels: ['card'] },
  ca: { currency: 'CAD', personal: 1699, teams: 2099, channels: ['card'] },
  au: { currency: 'AUD', personal: 1899, teams: 2399, channels: ['card'] },
  ae: { currency: 'AED', personal: 4400, teams: 5500, channels: ['card'] },
};

export const DEFAULT_SUBSCRIPTION_PRICING: PlanPricing = {
  currency: 'USD',
  personal: 1200,
  teams: 1500,
  channels: ['card'],
};

export function getSubscriptionPricing(countryCode: string): PlanPricing {
  return SUBSCRIPTION_PRICING[countryCode.toLowerCase()] ?? DEFAULT_SUBSCRIPTION_PRICING;
}

/** Format an amount (smallest unit) into a human-readable string, e.g. "KES 1,500" */
export function formatSubscriptionPrice(amount: number, currency: string): string {
  const major = amount / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(0)}`;
  }
}
