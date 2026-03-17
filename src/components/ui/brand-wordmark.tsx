import Image from 'next/image';
import logoImage from '@/app/logo.png';
import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  dotClassName?: string;
  iconClassName?: string;
};

export function BrandWordmark({ className, dotClassName, iconClassName }: BrandWordmarkProps) {
  return (
    <span className={cn('inline-flex items-center leading-none', className)}>
      <span>
        cele<span className={dotClassName}>.bio</span>
      </span>
      <Image
        src={logoImage}
        alt="Cele.bio logo"
        className={cn('ml-[1px] h-[1em] w-[1em] shrink-0 rounded-[0.2em]', iconClassName)}
      />
    </span>
  );
}