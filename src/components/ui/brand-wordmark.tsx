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
      <Image
        src={logoImage}
        alt="Cele.bio logo"
        className={cn('-mr-[0.08em] h-[1.15em] w-[1.15em] shrink-0 align-middle', iconClassName)}
        style={{ marginRight: '-0.08em' }}
      />
      <span className="align-middle">
        Cele<span className={dotClassName}>.bio</span>
      </span>
    </span>
  );
}