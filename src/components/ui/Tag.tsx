import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Tone = 'default' | 'muted' | 'invert' | 'accent';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

const TONES: Record<Tone, string> = {
  default: 'bg-paper text-forest-ink border border-fog',
  muted: 'bg-fog text-slate border border-transparent',
  invert: 'bg-forest-ink text-paper border border-forest-ink',
  accent: 'bg-lime-voltage text-forest-ink border border-lime-voltage',
};

export function Tag({ tone = 'default', icon, className, children, ...rest }: TagProps) {
  return (
    <span
      {...rest}
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 h-6 text-[10.5px] font-medium tracking-[0.08em] uppercase',
        TONES[tone],
        className,
      )}
    >
      {icon ? <span className="flex h-3 w-3 items-center">{icon}</span> : null}
      {children}
    </span>
  );
}