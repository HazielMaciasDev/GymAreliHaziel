import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
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
    'bg-forest-ink text-paper hover:bg-obsidian-0 active:bg-obsidian-0 disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'bg-paper text-forest-ink border border-forest-ink hover:bg-fog disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-forest-ink hover:bg-fog disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'bg-transparent text-alarm-red hover:bg-fog disabled:opacity-40 disabled:cursor-not-allowed',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
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
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 select-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {iconLeft ? <span className="flex h-5 w-5 items-center">{iconLeft}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {iconRight ? <span className="flex h-5 w-5 items-center">{iconRight}</span> : null}
    </button>
  );
}