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
    <span className={cn('inline-flex items-center leading-none', className)}>
      <Image
        src={logoImage}
        alt="Cele.bio logo"
        className={cn('h-[1.35em] w-auto shrink-0 align-middle', iconClassName)}
      />
      <span className="align-middle -ml-0.5">
        <span className={dotClassName}>.</span>bio
      </span>
    </span>
  );
}