'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/use-subscription';
import { isFeatureAllowed, type BooleanFeatureKey } from '@/lib/gates/featureGates';

export function useFeatureGate(feature: BooleanFeatureKey): {
  allowed: boolean;
  showUpgradePrompt: () => void;
} {
  const router = useRouter();
  const { tier } = useSubscription();

  const allowed = isFeatureAllowed(feature, tier);

  const showUpgradePrompt = useCallback(() => {
    router.push(`/dashboard/settings/billing?upgrade=${feature}`);
  }, [feature, router]);

  return { allowed, showUpgradePrompt };
}
