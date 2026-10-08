import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/format';

type Tone = 'ink' | 'white' | 'grass' | 'coral' | 'sky' | 'sunshine' | 'sandstone';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

const TONES: Record<Tone, string> = {
  ink: 'bg-[#2c2e2a] text-white',
  white: 'bg-white text-[#2c2e2a] border border-[#2c2e2a]',
  grass: 'bg-[#8ed462] text-[#2c2e2a]',
  coral: 'bg-[#ff705d] text-white',
  sky: 'bg-[#2ba0ff] text-white',
  sunshine: 'bg-[#f5e211] text-[#2c2e2a]',
  sandstone: 'bg-[#e0dbce] text-[#2c2e2a]',
};

export function Tag({ tone = 'ink', icon, size = 'sm', className, children, ...rest }: TagProps) {
  return (
    <span
      {...rest}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-[10px] font-medium',
        size === 'sm' ? 'px-3 h-7 text-[12px]' : 'px-4 h-9 text-[13px]',
        TONES[tone],
        className,
      )}
    >
      {icon ? <span className="flex h-3 w-3 items-center">{icon}</span> : null}
      {children}
    </span>
  );
}