import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Variant = 'primary' | 'outline' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-lime-voltage text-forest-ink hover:brightness-95 active:brightness-90 disabled:opacity-50',
  outline:
    'bg-paper text-forest-ink border border-forest-ink hover:bg-linen-mist disabled:opacity-50',
  ghost:
    'bg-transparent text-forest-ink hover:bg-fog disabled:opacity-50',
  dark:
    'bg-forest-ink text-lime-voltage hover:bg-spruce disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[14px]',
  md: 'h-11 px-6 text-[16px]',
  lg: 'h-14 px-8 text-[18px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all duration-150 select-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {iconLeft ? <span className="-ml-1 flex h-5 w-5 items-center">{iconLeft}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {iconRight ? <span className="-mr-1 flex h-5 w-5 items-center">{iconRight}</span> : null}
    </button>
  );
}