import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';
import type { Exercise, MuscleGroup } from '@/types';
import { MUSCLES, MUSCLE_LIST } from '@/lib/muscles';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/ui/Input';
import { classNames } from '@/lib/format';

interface ExercisePaletteProps {
  exercises: Exercise[];
  takenExerciseIds: Set<string>;
}

export function ExercisePalette({ exercises, takenExerciseIds }: ExercisePaletteProps) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (muscleFilter) {
        if (ex.primaryMuscle !== muscleFilter && !ex.secondaryMuscles.includes(muscleFilter)) return false;
      }
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        MUSCLES[ex.primaryMuscle].label.toLowerCase().includes(q)
      );
    });
  }, [exercises, query, muscleFilter]);

  return (
    <aside className="flex h-full flex-col gap-4 border border-fog bg-paper">
      <div className="border-b border-fog p-4">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Arrastrá a un día</p>
        <h2 className="mt-2 text-[18px] font-semibold text-forest-ink">Catálogo</h2>
        <div className="mt-3">
          <Input
            placeholder="Buscar ejercicio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Músculo</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setMuscleFilter(null)}
            className={classNames(
              'h-7 px-2.5 text-[10px] font-medium tracking-[0.08em] uppercase transition-colors',
              muscleFilter === null
                ? 'bg-forest-ink text-paper'
                : 'bg-fog text-slate hover:bg-linen-mist',
            )}
          >
            Todos
          </button>
          {MUSCLE_LIST.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMuscleFilter(muscleFilter === m.id ? null : m.id)}
              className={classNames(
                'h-7 px-2.5 text-[10px] font-medium tracking-[0.08em] uppercase transition-colors',
                muscleFilter === m.id
                  ? 'bg-forest-ink text-paper'
                  : 'bg-fog text-slate hover:bg-linen-mist',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="flex flex-col gap-1">
          {filtered.map((ex) => (
            <PaletteItem key={ex.id} exercise={ex} taken={takenExerciseIds.has(ex.id)} />
          ))}
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-[13px] text-pebble">Sin resultados</li>
          ) : null}
        </ul>
      </div>
    </aside>
  );
}

function PaletteItem({ exercise, taken }: { exercise: Exercise; taken: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${exercise.id}`,
    data: { type: 'palette', exerciseId: exercise.id },
    disabled: taken,
  });

  const primary = MUSCLES[exercise.primaryMuscle];

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 150ms',
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={taken}
        className={classNames(
          'flex w-full items-center justify-between gap-3 border border-fog px-3 py-2 text-left text-[13px] transition-colors',
          taken
            ? 'cursor-not-allowed bg-fog text-pebble line-through'
            : isDragging
              ? 'cursor-grabbing border-forest-ink bg-fog'
              : 'cursor-grab text-forest-ink hover:border-forest-ink hover:bg-fog',
        )}
        aria-label={`Arrastrar ${exercise.name}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{exercise.name}</p>
          <p className="mt-0.5 text-[10px] tracking-[0.08em] uppercase text-pebble">{primary.label}</p>
        </div>
        <span className="text-pebble">
          <Icon.Drag size={14} />
        </span>
      </button>
    </li>
  );
}