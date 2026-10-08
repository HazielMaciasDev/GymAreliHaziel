import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline';
}

export function IconButton({ children, size = 'md', variant = 'ghost', className, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      className={classNames(
        'inline-flex items-center justify-center transition-colors duration-150',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        variant === 'ghost' ? 'text-forest-ink hover:bg-fog' : 'border border-fog text-forest-ink hover:border-forest-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}