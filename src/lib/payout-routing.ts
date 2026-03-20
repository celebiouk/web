export type PayoutProvider = 'stripe' | 'paystack' | 'manual_bank';

export const PAYSTACK_COUNTRIES = ['NG', 'GH', 'ZA', 'KE', 'CI'] as const;

// Stripe-connected account availability (rolling list; keep updated as Stripe expands)
export const STRIPE_SUPPORTED_COUNTRIES = [
  'AE', 'AT', 'AU', 'BE', 'BG', 'BR', 'CA', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES',
  'FI', 'FR', 'GB', 'GI', 'GR', 'HK', 'HR', 'HU', 'IE', 'IN', 'IT', 'JP', 'LI', 'LT',
  'LU', 'LV', 'MT', 'MX', 'MY', 'NL', 'NO', 'NZ', 'PL', 'PT', 'RO', 'SE', 'SG', 'SI',
  'SK', 'TH', 'US',
] as const;

const PAYSTACK_SET = new Set<string>(PAYSTACK_COUNTRIES);
const STRIPE_SET = new Set<string>(STRIPE_SUPPORTED_COUNTRIES);

export function normalizeCountryCode(countryCode: string | null | undefined): string {
  return (countryCode || '').trim().toUpperCase();
}

export function isPaystackCountry(countryCode: string | null | undefined): boolean {
  return PAYSTACK_SET.has(normalizeCountryCode(countryCode));
}

export function isStripeCountry(countryCode: string | null | undefined): boolean {
  return STRIPE_SET.has(normalizeCountryCode(countryCode));
}

export function resolvePayoutProvider(countryCode: string | null | undefined): PayoutProvider {
  const normalized = normalizeCountryCode(countryCode);

  if (!normalized) return 'manual_bank';
  if (isPaystackCountry(normalized)) return 'paystack';
  if (isStripeCountry(normalized)) return 'stripe';

  return 'manual_bank';
}

export function nextManualPayoutDate(fromDate = new Date()): Date {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day <= 9) return new Date(year, month, 9);
  if (day <= 24) return new Date(year, month, 24);

  return new Date(year, month + 1, 9);
}
