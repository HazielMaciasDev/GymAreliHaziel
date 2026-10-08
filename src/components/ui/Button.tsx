import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'text' | 'outline' | 'danger';
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
    'bg-[#0075de] text-white hover:bg-[#0066c5] active:bg-[#005bab] disabled:bg-[#0075de]/40 disabled:text-white/90',
  secondary:
    'bg-[#e6f3fe] text-[#0075de] hover:bg-[#d9ebfd] active:bg-[#cce4fc] disabled:opacity-50',
  ghost:
    'bg-transparent text-black/90 hover:bg-black/5 active:bg-black/10 disabled:opacity-40',
  text:
    'bg-transparent text-black/90 hover:bg-black/5 active:bg-black/10 disabled:opacity-40',
  outline:
    'bg-transparent text-black/90 border border-black/10 hover:border-black/30 hover:bg-black/[0.02] disabled:opacity-40',
  danger:
    'bg-transparent text-[#f64932] hover:bg-[#f64932]/10 disabled:opacity-40',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-5 text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classNames(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[8px] transition-colors duration-150 select-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {iconLeft ? <span className="flex h-4 w-4 items-center">{iconLeft}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {iconRight ? <span className="flex h-4 w-4 items-center">{iconRight}</span> : null}
    </button>
  );
}