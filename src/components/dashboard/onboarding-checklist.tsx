import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
  href?: string;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  completedCount: number;
}

/**
 * Onboarding checklist widget for dashboard
 * Shows progress and links to complete remaining steps
 */
export function OnboardingChecklist({
  items,
  completedCount,
}: OnboardingChecklistProps) {
  const totalCount = items.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Progress Header */}
        <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Complete your profile
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {completedCount} of {totalCount} steps completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href || '#'}
                className={cn(
                  'flex items-center gap-4 px-4 py-4 transition-colors',
                  item.isCompleted
                    ? 'bg-success-50/50 dark:bg-success-500/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full',
                    item.isCompleted
                      ? 'bg-success-500 text-white'
                      : 'border-2 border-gray-300 dark:border-gray-600'
                  )}
                >
                  {item.isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <span
                  className={cn(
                    'flex-1 text-sm font-medium',
                    item.isCompleted
                      ? 'text-success-600 line-through dark:text-success-500'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {item.label}
                </span>
                {!item.isCompleted && (
                  <span className="text-sm text-brand-600 dark:text-brand-400">
                    Complete →
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
