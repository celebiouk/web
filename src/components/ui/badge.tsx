'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'pro';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge component for status and labels
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    default:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    success:
      'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
    warning:
      'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500',
    error:
      'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500',
    brand:
      'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    pro:
      'bg-gradient-to-r from-accent-400 to-accent-500 text-white shadow-sm',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
