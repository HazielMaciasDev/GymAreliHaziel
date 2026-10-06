import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'card' | 'large';
  dark?: boolean;
  children: ReactNode;
}

export function Card({ size = 'card', dark, className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={classNames(
        size === 'large' ? 'rounded-large p-8 md:p-10' : 'rounded-card p-6',
        dark ? 'bg-forest-ink text-paper' : 'bg-paper text-charcoal border border-fog',
        className,
      )}
    >
      {children}
    </div>
  );
}