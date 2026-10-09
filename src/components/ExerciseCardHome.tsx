import { useState } from 'react';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { MUSCLES } from '@/lib/muscles';
import { classNames } from '@/lib/format';
import type { Exercise } from '@/types';

interface ExerciseCardHomeProps {
  exercise: Exercise;
  sets: number;
  reps: number;
  position: number;
}

export function ExerciseCardHome({ exercise, sets, reps, position }: ExerciseCardHomeProps) {
  const primary = MUSCLES[exercise.primaryMuscle];
  const [expanded, setExpanded] = useState(false);

  const handleOpen = () => setExpanded(true);
  const handleClose = () => setExpanded(false);

  return (
    <div
      onMouseLeave={handleClose}
      className={classNames(
        'group relative overflow-hidden rounded-[32px] border-2 bg-white transition-colors',
        expanded ? 'border-[#2c2e2a]' : 'border-[#2c2e2a]/10',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f1e4]">
        {expanded ? (
          <ExerciseMedia
            src={exercise.gifPath}
            alt={exercise.name}
            className="h-full w-full object-cover"
            loading="eager"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
        ) : (
          <>
            <ExerciseMedia
              src={exercise.gifPath}
              alt={exercise.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '0.15';
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2c2e2a]/55 via-transparent to-transparent" />
          </>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[#2c2e2a]">
            {position}
          </span>
          <Tag tone="grass" size="sm">{primary.label}</Tag>
        </div>

        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#2c2e2a] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#f5f1e4]">
          {sets}
          <span className="opacity-50">×</span>
          {reps}
        </div>

        {!expanded ? (
          <>
            <button
              type="button"
              onClick={handleOpen}
              className="absolute inset-0 hidden md:block"
              aria-label={`Vista previa de ${exercise.name}`}
            />
            <button
              type="button"
              onClick={handleOpen}
              className="absolute bottom-3 left-1/2 inline-flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-medium text-[#2c2e2a] shadow-sm md:hidden"
            >
              <Icon.Play size={12} />
              <span>Vista previa</span>
            </button>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <p className="truncate text-[14px] font-semibold text-[#2c2e2a]">{exercise.name}</p>
        {expanded ? (
          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2c2e2a] text-[#f5f1e4] hover:bg-[#1f211d]"
            aria-label="Cerrar vista previa"
          >
            <Icon.Close size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
