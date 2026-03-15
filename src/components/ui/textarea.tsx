'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: boolean;
  maxLength?: number;
}

/**
 * Premium textarea component with character count
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      charCount = false,
      maxLength,
      disabled,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            className={cn(
              'block w-full rounded-xl border bg-white px-4 py-3 text-base text-gray-900 transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              'dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500',
              'dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
              'resize-none',
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                : 'border-gray-200',
              className
            )}
            {...props}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            {error && (
              <p className="text-sm text-error-500">{error}</p>
            )}
            {hint && !error && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
            )}
          </div>
          {charCount && maxLength && (
            <p
              className={cn(
                'text-sm',
                currentLength >= maxLength
                  ? 'text-error-500'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
