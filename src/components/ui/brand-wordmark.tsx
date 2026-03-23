import Image from 'next/image';
import logoImage from '@/app/celelogo.png';
import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  dotClassName?: string;
  iconClassName?: string;
};

export function BrandWordmark({ className, dotClassName, iconClassName }: BrandWordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 leading-none', className)}>
      <Image
        src={logoImage}
        alt="bio logo"
        className={cn('h-[1.25em] w-[1.25em] shrink-0 align-middle', iconClassName)}
      />
      <span className={cn('align-middle', dotClassName)}>
        bio
      </span>
    </span>
  );
}