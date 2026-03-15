import type { SubscriptionTier } from '@/types/supabase';

export const FEATURE_GATES = {
  courses: (tier: SubscriptionTier) => tier === 'pro',
  customDomain: (tier: SubscriptionTier) => tier === 'pro',
  unlimitedEmail: (tier: SubscriptionTier) => tier === 'pro',
  advancedAnalytics: (tier: SubscriptionTier) => tier === 'pro',
  bundleBuilder: (tier: SubscriptionTier) => tier === 'pro',
  zeroCommission: (tier: SubscriptionTier) => tier === 'pro',
  emailSubscriberLimit: (tier: SubscriptionTier) => (tier === 'free' ? 500 : Number.POSITIVE_INFINITY),
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES;
export type BooleanFeatureKey = Exclude<FeatureKey, 'emailSubscriberLimit'>;

export const FEATURE_COPY: Record<BooleanFeatureKey, {
  name: string;
  title: string;
  description: string;
  bullets: string[];
}> = {
  courses: {
    name: 'Courses',
    title: 'Launch unlimited courses',
    description: 'Turn your expertise into structured lessons, modules, and recurring student revenue.',
    bullets: ['Unlimited courses', 'Student progress tracking', 'Dedicated sales pages'],
  },
  customDomain: {
    name: 'Custom domain',
    title: 'Use your own domain',
    description: 'Make your page look premium and on-brand with your own domain name.',
    bullets: ['YourBrand.com storefront', 'Cleaner brand perception', 'Higher trust at checkout'],
  },
  unlimitedEmail: {
    name: 'Unlimited email subscribers',
    title: 'Grow without subscriber caps',
    description: 'Free creators get 500 subscribers. Pro removes the ceiling so you never have to pause growth.',
    bullets: ['Unlimited subscribers', 'No growth ceiling', 'Better list monetization'],
  },
  advancedAnalytics: {
    name: 'Advanced analytics',
    title: 'See what drives revenue',
    description: 'Track which offers convert, where sales come from, and what your audience actually buys.',
    bullets: ['Revenue insights', 'Conversion visibility', 'Faster optimization'],
  },
  bundleBuilder: {
    name: 'Bundle builder & upsells',
    title: 'Increase average order value',
    description: 'Package products together, add upsells, and earn more from every buyer.',
    bullets: ['Create bundles', 'Offer upsells', 'Grow average order value'],
  },
  zeroCommission: {
    name: '0% commission',
    title: 'Keep 100% of your revenue',
    description: 'Free creators pay 8% commission. Pro removes platform fees so more money stays with you.',
    bullets: ['0% platform fee', 'Instantly better margins', 'Best for active sellers'],
  },
};

export function getFeatureValue(feature: FeatureKey, tier: SubscriptionTier) {
  return FEATURE_GATES[feature](tier);
}

export function isFeatureAllowed(feature: BooleanFeatureKey, tier: SubscriptionTier): boolean {
  return Boolean(FEATURE_GATES[feature](tier));
}

export function getEmailSubscriberLimit(tier: SubscriptionTier): number {
  return FEATURE_GATES.emailSubscriberLimit(tier);
}
