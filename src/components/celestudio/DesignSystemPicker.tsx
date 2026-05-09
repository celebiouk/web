'use client';

import { Check, Lock } from 'lucide-react';
import { DESIGN_SYSTEM_LIST, type DesignSystemSlug } from '@/lib/celestudio/design-systems';
import { cn } from '@/lib/utils';

interface DesignSystemPickerProps {
  value: DesignSystemSlug;
  onChange: (slug: DesignSystemSlug) => void;
  isPro: boolean;
  // Slug -> true if locked for this user
  proOnlySlugs?: DesignSystemSlug[];
}

export function DesignSystemPicker({ value, onChange, isPro, proOnlySlugs = [] }: DesignSystemPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {DESIGN_SYSTEM_LIST.map(ds => {
        const isLocked = !isPro && proOnlySlugs.includes(ds.slug);
        const isActive = value === ds.slug;

        return (
          <button
            key={ds.slug}
            type="button"
            onClick={() => !isLocked && onChange(ds.slug)}
            disabled={isLocked}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200',
              isActive
                ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                : 'border-zinc-800/60 hover:border-zinc-700',
              isLocked && 'opacity-60 cursor-not-allowed'
            )}
            style={{ background: '#0F0F11' }}
          >
            {/* Thumbnail / preview swatch */}
            <div
              className="relative mb-3 h-24 w-full rounded-xl overflow-hidden"
              style={{ background: ds.previewGradient }}
            >
              <div className="absolute inset-x-3 inset-y-2 flex flex-col justify-between">
                <div
                  className="h-1.5 w-12 rounded-full"
                  style={{ background: ds.dark.accent, opacity: 0.7 }}
                />
                <div
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: ds.dark.text, fontFamily: ds.fontHeading }}
                >
                  Aa Bb Cc
                </div>
              </div>
              {isActive && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}
              {isLocked && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/90">
                  <Lock className="h-3 w-3 text-amber-400" strokeWidth={2} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100">{ds.name}</h3>
              </div>
              <p className="text-xs text-zinc-500">{ds.tagline}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
