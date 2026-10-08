import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({ children, padding = 'md', as: Tag = 'div', className, ...attrs }: CardProps) {
  return (
    <Tag
      {...attrs}
      className={classNames(
        'rounded-large bg-paper border border-fog',
        PAD[padding],
        className,
      )}
    >
      {children}
    </Tag>
  );
}