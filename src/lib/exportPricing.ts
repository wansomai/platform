// src/lib/exportPricing.ts
//
// Single source of truth for guest document export pricing.
// Used by:
//  - /api/public/export-payment-config  (server — validates currency + fallback)
//  - GuestCanvasChatSplitView           (client — display before config loads)

export interface ExportPricing {
  amount: number;    // smallest currency unit (kobo, cents, pesewas, fils…)
  currency: string;
  label: string;     // human-readable, e.g. "KES 449"
  channels: string[]; // Paystack payment channels
}

// Pricing per country code (lowercase ISO 3166-1 alpha-2)
export const EXPORT_PRICING: Record<string, ExportPricing> = {
  // 🌍 Core African markets — PPP-adjusted (~$3–4 USD equivalent)
  ng: { amount: 349900, currency: 'NGN', label: '₦3,499',    channels: ['card'] },
  ke: { amount: 44900,  currency: 'KES', label: 'KES 449',   channels: ['mobile_money', 'card'] },
  za: { amount: 5900,   currency: 'ZAR', label: 'R59',       channels: ['card'] },
  gh: { amount: 3999,   currency: 'GHS', label: 'GHS 40',    channels: ['card'] },

  // 🇬🇧 UK — diaspora
  gb: { amount: 499,    currency: 'GBP', label: '£4.99',     channels: ['card'] },

  // 🇺🇸 USA
  us: { amount: 499,    currency: 'USD', label: '$4.99',     channels: ['card'] },

  // 🇨🇦 Canada
  ca: { amount: 1099,   currency: 'CAD', label: 'CA$10.99',  channels: ['card'] },

  // 🇦🇺 Australia
  au: { amount: 1099,   currency: 'AUD', label: 'A$10.99',   channels: ['card'] },

  // 🇦🇪 UAE
  ae: { amount: 2699,   currency: 'AED', label: 'AED 26.99', channels: ['card'] },
};

export const DEFAULT_EXPORT_PRICING: ExportPricing = {
  amount: 499,
  currency: 'USD',
  label: '$4.99',
  channels: ['card'],
};

export function getExportPricing(countryCode: string): ExportPricing {
  return EXPORT_PRICING[countryCode.toLowerCase()] ?? DEFAULT_EXPORT_PRICING;
}
