'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { X, Zap, BookOpen, CreditCard, Globe, Check } from 'lucide-react';

interface ProGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const PRO_BENEFITS = [
  { icon: BookOpen, text: 'Create & sell unlimited courses' },
  { icon: CreditCard, text: '0% platform commission on all sales' },
  { icon: Globe, text: 'Custom domain support' },
];

const FEATURE_COMPARISON = [
  { feature: 'Digital products', free: true, pro: true },
  { feature: '1:1 Bookings', free: true, pro: true },
  { feature: 'All templates', free: true, pro: true },
  { feature: 'Basic analytics', free: true, pro: true },
  { feature: 'Online courses', free: false, pro: true },
  { feature: '0% commission', free: false, pro: true },
  { feature: 'Custom domain', free: false, pro: true },
  { feature: 'Advanced analytics', free: false, pro: true },
  { feature: 'Priority support', free: false, pro: true },
];

/**
 * Full-screen upgrade modal for Pro gating
 * Used when free tier users try to access Pro features
 */
export function ProGateModal({ isOpen, onClose, feature = 'This feature' }: ProGateModalProps) {
  const [showComparison, setShowComparison] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
            <Zap className="h-8 w-8 text-white" />
          </div>

          {/* Headline */}
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
            {feature} is a Pro feature
          </h2>
          <p className="mb-8 text-center text-gray-500 dark:text-gray-400">
            Upgrade to unlock the full power of cele.bio
          </p>

          {/* Benefits */}
          <div className="mb-8 space-y-4">
            {PRO_BENEFITS.map((benefit, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
                  <benefit.icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="mb-6 rounded-xl border-2 border-brand-500 bg-brand-50/50 p-6 dark:border-brand-400 dark:bg-brand-500/10">
            <div className="mb-1 text-center text-sm font-medium text-brand-600 dark:text-brand-400">
              Pro Plan
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$19.99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <div className="mt-1 text-center text-sm text-gray-500">
              or <span className="font-semibold text-brand-600 dark:text-brand-400">$13.99/mo</span> billed yearly (save 30%)
            </div>
          </div>

          {/* CTA */}
          <Link href="/dashboard/settings/billing" onClick={onClose}>
            <Button className="w-full py-3 text-base font-semibold">
              <Zap className="mr-2 h-5 w-5" />
              Upgrade to Pro
            </Button>
          </Link>

          {/* Comparison toggle */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="mt-4 w-full text-center text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
          >
            {showComparison ? 'Hide comparison' : 'See what\'s included'}
          </button>

          {/* Features comparison table */}
          {showComparison && (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Feature</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Free</th>
                    <th className="px-4 py-3 text-center font-medium text-brand-600 dark:text-brand-400">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {FEATURE_COMPARISON.map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.feature}</td>
                      <td className="px-4 py-3 text-center">
                        {row.free ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Check className="mx-auto h-4 w-4 text-brand-600 dark:text-brand-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline upgrade prompt (non-modal)
 * Used inside pages where a section is locked
 */
export function ProGateInline({ feature = 'This feature' }: { feature?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
        <Zap className="h-7 w-7 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
        {feature} is a Pro feature
      </h3>
      <p className="mb-6 max-w-sm text-gray-500 dark:text-gray-400">
        Upgrade to Pro to unlock courses, 0% commission, custom domains, and more.
      </p>
      <Link href="/dashboard/settings/billing">
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Upgrade to Pro — $19.99/mo
        </Button>
      </Link>
    </div>
  );
}
