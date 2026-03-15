'use client';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  selected?: boolean;
}

/**
 * Premium card component with hover and selection states
 */
export function Card({
  children,
  className,
  hoverable = false,
  selected = false,
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={cn(
        'rounded-2xl border bg-white p-6 transition-all duration-200',
        'dark:bg-gray-900 dark:border-gray-800',
        hoverable &&
          'cursor-pointer hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700',
        selected &&
          'border-brand-500 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-white',
        className
      )}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p
      className={cn(
        'mt-1 text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {children}
    </p>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800',
        className
      )}
    >
      {children}
    </div>
  );
}
