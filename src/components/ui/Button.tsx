import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'coral' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  dotColor?: 'sky' | 'coral' | 'grass' | 'sunshine' | 'ink';
}

const DOT_BG: Record<NonNullable<ButtonProps['dotColor']>, string> = {
  sky: 'bg-[#2ba0ff]',
  coral: 'bg-[#ff705d]',
  grass: 'bg-[#8ed462]',
  sunshine: 'bg-[#f5e211]',
  ink: 'bg-[#2c2e2a]',
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-white text-[#2c2e2a] border border-[#2c2e2a] hover:bg-[#2c2e2a] hover:text-white active:bg-[#1f211d] disabled:opacity-50',
  secondary:
    'bg-[#e0dbce] text-[#2c2e2a] hover:bg-[#d3ccba] active:bg-[#c4bda8] disabled:opacity-50',
  ghost:
    'bg-transparent text-[#2c2e2a] hover:bg-[#2c2e2a]/5 active:bg-[#2c2e2a]/10 disabled:opacity-40',
  outline:
    'bg-transparent text-[#2c2e2a] border border-[#2c2e2a] hover:bg-[#2c2e2a] hover:text-white disabled:opacity-50',
  coral:
    'bg-[#ff705d] text-white hover:bg-[#ff5a44] active:bg-[#ed4a35] disabled:opacity-50',
  dark:
    'bg-[#2c2e2a] text-white hover:bg-[#1f211d] active:bg-[#151714] disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[14px] gap-2',
  md: 'h-12 px-5 text-[15px] gap-2.5',
  lg: 'h-14 px-7 text-[16px] gap-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  dotColor = 'ink',
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
        'inline-flex items-center justify-center rounded-full font-medium transition-colors duration-150 select-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {iconLeft ? <span className="flex h-4 w-4 items-center">{iconLeft}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {iconRight ? (
        <span className="flex h-4 w-4 items-center">{iconRight}</span>
      ) : (
        <span
          className={classNames(
            'ml-0.5 h-2.5 w-2.5 shrink-0 rounded-full',
            DOT_BG[dotColor],
          )}
        />
      )}
    </button>
  );
}