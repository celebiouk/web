'use client';

import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Avatar component with fallback to initials
 */
export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };

  const imageSizes = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
  };

  if (src) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          sizes[size],
          className
        )}
      >
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          fill
          className="object-cover"
          sizes={`${imageSizes[size]}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white',
        sizes[size],
        className
      )}
    >
      {getInitials(name || '')}
    </div>
  );
}
