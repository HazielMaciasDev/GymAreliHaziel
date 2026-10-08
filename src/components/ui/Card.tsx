import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  tone?: 'white' | 'subtle' | 'accent' | 'midnight';
  accent?: 'marigold' | 'coral' | 'sky' | 'midnight' | 'sky-tint' | 'peach';
  as?: 'div' | 'section' | 'article';
}

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const TONE: Record<NonNullable<CardProps['tone']>, string> = {
  white: 'bg-white border-black/8',
  subtle: 'bg-black/[0.02] border-transparent',
  accent: 'border-transparent',
  midnight: 'bg-[#02093a] border-transparent text-white',
};

const ACCENT: Record<NonNullable<CardProps['accent']>, string> = {
  marigold: 'bg-[#ffb110]',
  coral: 'bg-[#f64932] text-white',
  sky: 'bg-[#62aef0] text-[#02093a]',
  midnight: 'bg-[#02093a] text-white',
  'sky-tint': 'bg-[#e6f3fe] text-[#02093a]',
  peach: 'bg-[#f6d5b8]',
};

export function Card({
  children,
  padding = 'md',
  tone = 'white',
  accent,
  as: Tag = 'div',
  className,
  ...attrs
}: CardProps) {
  return (
    <Tag
      {...attrs}
      className={classNames(
        'rounded-[12px] border',
        accent ? ACCENT[accent] : TONE[tone],
        PAD[padding],
        className,
      )}
    >
      {children}
    </Tag>
  );
}