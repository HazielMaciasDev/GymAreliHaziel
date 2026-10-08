import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Tone =
  | 'default'
  | 'muted'
  | 'invert'
  | 'sky-tint'
  | 'marigold'
  | 'coral'
  | 'sky'
  | 'mocha';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

const TONES: Record<Tone, string> = {
  default: 'bg-white text-black border-black/8',
  muted: 'bg-black/[0.04] text-black/60 border-transparent',
  invert: 'bg-[#02093a] text-white border-transparent',
  'sky-tint': 'bg-[#e6f3fe] text-[#0075de] border-transparent',
  marigold: 'bg-[#ffb110] text-black border-transparent',
  coral: 'bg-[#f64932] text-white border-transparent',
  sky: 'bg-[#62aef0] text-[#02093a] border-transparent',
  mocha: 'bg-[#b18164] text-white border-transparent',
};

export function Tag({ tone = 'default', icon, className, children, ...rest }: TagProps) {
  return (
    <span
      {...rest}
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 h-6 text-[11px] font-medium tracking-[0.04em] rounded-full border',
        TONES[tone],
        className,
      )}
    >
      {icon ? <span className="flex h-3 w-3 items-center">{icon}</span> : null}
      {children}
    </span>
  );
}