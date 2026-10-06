import type { MuscleGroup } from '@/types';
import { MUSCLES, getMuscleSurfaceClasses } from '@/lib/muscles';
import { classNames } from '@/lib/format';

interface MuscleChipProps {
  muscle: MuscleGroup;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  active?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-7 text-[11px] px-3 gap-1.5',
  md: 'h-9 text-[13px] px-4 gap-2',
  lg: 'h-12 text-[16px] px-5 gap-2.5',
};

const SCALE = {
  sm: 1,
  md: 1.15,
  lg: 1.35,
};

export function MuscleChip({
  muscle,
  size = 'md',
  count,
  active = true,
  className,
}: MuscleChipProps) {
  const meta = MUSCLES[muscle];
  const tone = getMuscleSurfaceClasses(meta.surface);
  return (
    <span
      title={meta.label}
      className={classNames(
        'inline-flex items-center rounded-pill font-medium transition-all duration-150',
        active ? tone.bg : 'bg-fog text-pebble',
        active ? tone.fg : '',
        SIZES[size],
        className,
      )}
      style={count !== undefined ? { fontSize: `${SCALE[size]}rem` } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'}
        aria-hidden
      >
        <path d={meta.icon} />
      </svg>
      {meta.label}
      {count !== undefined && count > 0 ? (
        <span
          className={classNames(
            'ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-[10px] font-bold',
            active ? 'bg-paper text-forest-ink' : 'bg-paper text-pebble',
          )}
        >
          {count}
        </span>
      ) : null}
    </span>
  );
}