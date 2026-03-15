'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';
import type { SubscriptionTier } from '@/types/supabase';
import { getEmailSubscriberLimit, isFeatureAllowed } from '@/lib/gates/featureGates';

interface UseSubscriptionReturn {
  tier: SubscriptionTier;
  isPro: boolean;
  isLoading: boolean;
  canAccessCourses: boolean;
  commissionRate: number;
  maxEmailSubscribers: number;
}

/**
 * Hook for checking subscription status and gating features
 * Use this throughout the app to check if user has Pro access
 * 
 * @example
 * const { isPro, canAccessCourses } = useSubscription();
 * if (!canAccessCourses) {
 *   return <UpgradePrompt />;
 * }
 */
export function useSubscription(): UseSubscriptionReturn {
  const { profile, isLoading } = useAuth();

  const subscription = useMemo(() => {
    const tier = profile?.subscription_tier ?? 'free';
    const isPro = tier === 'pro';

    return {
      tier,
      isPro,
      isLoading,
      // Feature gates
      canAccessCourses: isFeatureAllowed('courses', tier),
      // Commission rates (in percent)
      commissionRate: isFeatureAllowed('zeroCommission', tier) ? 0 : 8,
      // Email subscriber limits
      maxEmailSubscribers: getEmailSubscriberLimit(tier),
    };
  }, [profile?.subscription_tier, isLoading]);

  return subscription;
}

/**
 * Simple check if user has Pro subscription
 * Useful for conditional rendering inline
 */
export function useIsPro(): boolean {
  const { isPro } = useSubscription();
  return isPro;
}
