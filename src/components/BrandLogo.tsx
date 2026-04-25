import { cn } from '@/src/lib/utils';

interface BrandLogoProps {
  alt?: string;
  className?: string;
  imgClassName?: string;
  textClassName?: string;
}

export const BrandLogo = ({
  alt = 'Recruit Right Solutions logo',
  className,
  imgClassName,
  textClassName,
}: BrandLogoProps) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/logo.png"
        alt={alt}
        className={cn('block h-12 max-w-[64px] w-auto object-contain shrink-0', imgClassName)}
      />
      <div
        className={cn(
          'min-w-0 font-headline text-sm font-black leading-tight tracking-tight text-primary md:text-base',
          textClassName,
        )}
      >
        Recruit Right Solutions
      </div>
    </div>
  );
};
