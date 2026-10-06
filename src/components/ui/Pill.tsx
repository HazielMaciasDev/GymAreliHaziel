import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Tone = 'forest' | 'mist' | 'lime' | 'dark';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

const TONES: Record<Tone, string> = {
  forest: 'bg-forest-ink text-lime-voltage',
  mist: 'bg-linen-mist text-forest-ink',
  lime: 'bg-lime-voltage text-forest-ink',
  dark: 'bg-fog text-forest-ink',
};

export function Pill({ tone = 'mist', size = 'sm', icon, className, children, ...rest }: PillProps) {
  return (
    <span
      {...rest}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-pill font-medium tracking-tight',
        TONES[tone],
        size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-9 px-4 text-[14px]',
        className,
      )}
    >
      {icon ? <span className="flex h-3.5 w-3.5 items-center">{icon}</span> : null}
      {children}
    </span>
  );
}