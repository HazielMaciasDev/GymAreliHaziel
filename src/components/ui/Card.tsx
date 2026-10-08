import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'white' | 'cream' | 'sandstone' | 'coral' | 'grass' | 'sky' | 'sunshine' | 'ink';
  as?: 'div' | 'section' | 'article';
}

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4 md:p-5',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
  xl: 'p-8 md:p-10',
};

const TONE: Record<NonNullable<CardProps['tone']>, string> = {
  white: 'bg-white text-[#2c2e2a]',
  cream: 'bg-[#f5f1e4] text-[#2c2e2a]',
  sandstone: 'bg-[#e0dbce] text-[#2c2e2a]',
  coral: 'bg-[#ff705d] text-white',
  grass: 'bg-[#8ed462] text-[#2c2e2a]',
  sky: 'bg-[#2ba0ff] text-white',
  sunshine: 'bg-[#f5e211] text-[#2c2e2a]',
  ink: 'bg-[#2c2e2a] text-white',
};

export function Card({
  children,
  padding = 'md',
  tone = 'white',
  as: Tag = 'div',
  className,
  ...attrs
}: CardProps) {
  return (
    <Tag
      {...attrs}
      className={classNames(
        'rounded-[50px] md:rounded-[64px]',
        TONE[tone],
        PAD[padding],
        className,
      )}
    >
      {children}
    </Tag>
  );
}