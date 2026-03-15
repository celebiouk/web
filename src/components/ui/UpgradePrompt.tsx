'use client';

import Link from 'next/link';
import { X, Sparkles, Check, Lock } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { FEATURE_COPY, type BooleanFeatureKey } from '@/lib/gates/featureGates';

interface UpgradePromptProps {
  feature: BooleanFeatureKey;
  variant?: 'inline' | 'modal';
  isOpen?: boolean;
  onClose?: () => void;
}

export function UpgradePrompt({
  feature,
  variant = 'inline',
  isOpen = true,
  onClose,
}: UpgradePromptProps) {
  const copy = FEATURE_COPY[feature];

  if (variant === 'modal') {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close upgrade prompt"
          >
            <X className="h-5 w-5" />
          </button>
          <PromptContent feature={feature} copy={copy} compact={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 shadow-sm dark:border-amber-500/20 dark:from-amber-500/10 dark:via-gray-900 dark:to-emerald-500/10">
      <PromptContent feature={feature} copy={copy} compact />
    </div>
  );
}

function PromptContent({
  feature,
  copy,
  compact,
}: {
  feature: BooleanFeatureKey;
  copy: (typeof FEATURE_COPY)[BooleanFeatureKey];
  compact: boolean;
}) {
  return (
    <div className={compact ? 'p-6' : 'p-8'}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="pro">PRO</Badge>
            <Badge variant="brand" size="sm">
              <Lock className="mr-1 h-3 w-3" />
              {copy.name}
            </Badge>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{copy.title}</h3>
        </div>
      </div>

      <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.description}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {copy.bullets.map((bullet) => (
          <div
            key={bullet}
            className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-300"
          >
            <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              <span className="font-medium">Included</span>
            </div>
            <p>{bullet}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={`/dashboard/settings/billing?upgrade=${feature}`} className="flex-1">
          <Button fullWidth>
            Upgrade to Pro
          </Button>
        </Link>
        <Link href="/pricing" className="flex-1">
          <Button fullWidth variant="outline">
            View full pricing
          </Button>
        </Link>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Free creators pay 8% commission. Pro is $19.99/mo or $167.90/yr and includes 0% commission.
      </p>
    </div>
  );
}
