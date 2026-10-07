
import type { Exercise } from '@/types';
import { MUSCLES } from '@/lib/muscles';
import { Pill } from '@/components/ui/Pill';
import { classNames } from '@/lib/format';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
  variant?: 'bank' | 'compact';
}

const DIFFICULTY_LABEL: Record<Exercise['difficulty'], string> = {
  principiante: 'PRINCIPIANTE',
  intermedio: 'INTERMEDIO',
  avanzado: 'AVANZADO',
};

const DIFFICULTY_TONE: Record<Exercise['difficulty'], 'mist' | 'lime' | 'dark'> = {
  principiante: 'lime',
  intermedio: 'mist',
  avanzado: 'dark',
};

export function ExerciseCard({ exercise, onSelect, variant = 'bank' }: ExerciseCardProps) {
  const primary = MUSCLES[exercise.primaryMuscle];
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="flex items-center gap-3 rounded-card border border-fog bg-paper p-2 text-left transition-all hover:border-lime-voltage"
      >
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-mask bg-fog">
          <img
            src={exercise.gifPath}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              const target = event.currentTarget;
              target.style.display = 'none';
              target.parentElement!.style.background = 'var(--color-fog)';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-forest-ink">{exercise.name}</p>
          <p className="truncate text-[11px] text-pebble">{primary.label}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className="group flex flex-col overflow-hidden rounded-card border border-fog bg-paper text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime-voltage hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-fog">
        <img
          src={exercise.gifPath}
          alt={exercise.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.opacity = '0.2';
          }}
        />
        <div className="absolute left-3 top-3">
          <Pill tone={DIFFICULTY_TONE[exercise.difficulty]}>
            {DIFFICULTY_LABEL[exercise.difficulty]}
          </Pill>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[16px] font-semibold leading-tight text-forest-ink">
          {exercise.name}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={classNames(
              'inline-flex h-6 items-center rounded-pill bg-lime-voltage px-2.5 text-[11px] font-bold uppercase tracking-wider text-forest-ink',
            )}
          >
            {primary.label}
          </span>
          {exercise.secondaryMuscles.length > 0 ? (
            <span className="truncate text-[11px] text-pebble">
              + {exercise.secondaryMuscles.slice(0, 2).map((m) => MUSCLES[m].label).join(', ')}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
