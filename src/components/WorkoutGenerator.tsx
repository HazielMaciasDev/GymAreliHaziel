import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Exercise, MuscleGroup, RoutineExercise } from '@/types';

interface WorkoutGeneratorProps {
  exercises: Exercise[];
  onAdd: (items: Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>>) => void;
  onClose: () => void;
}

type Goal = 'hypertrophy' | 'strength' | 'endurance' | 'general';

const GOAL_OPTIONS: { id: Goal; label: string; tag: string }[] = [
  { id: 'hypertrophy', label: 'Hipertrofia', tag: 'Volumen · 8-12 reps' },
  { id: 'strength', label: 'Fuerza', tag: 'Pesado · 3-6 reps' },
  { id: 'endurance', label: 'Resistencia', tag: 'Ligero · 15-20 reps' },
  { id: 'general', label: 'General', tag: 'Mixto' },
];

const TARGET_MUSCLES: MuscleGroup[] = ['pecho', 'espalda', 'hombros', 'cuadriceps', 'femorales', 'core'];

const PARAMS_BY_GOAL: Record<Goal, { sets: number; reps: number }> = {
  hypertrophy: { sets: 4, reps: 10 },
  strength: { sets: 5, reps: 5 },
  endurance: { sets: 3, reps: 18 },
  general: { sets: 3, reps: 12 },
};

function buildRoutine(
  exercises: Exercise[],
  goal: Goal,
): Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>> {
  const byMuscle = new Map<string, Exercise>();
  for (const ex of exercises) {
    if (!byMuscle.has(ex.primaryMuscle)) byMuscle.set(ex.primaryMuscle, ex);
  }
  const params = PARAMS_BY_GOAL[goal];
  const items: Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>> = [];
  for (const m of TARGET_MUSCLES) {
    const ex = byMuscle.get(m);
    if (!ex) continue;
    items.push({ exerciseId: ex.id, sets: params.sets, reps: params.reps, weightKg: null });
  }
  return items;
}

export function WorkoutGenerator({ exercises, onAdd, onClose }: WorkoutGeneratorProps) {
  const [goal, setGoal] = useState<Goal>('hypertrophy');

  const handleGenerate = () => {
    onAdd(buildRoutine(exercises, goal));
    onClose();
  };

  const preview = buildRoutine(exercises, goal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest-ink/40 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-gen-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-large bg-paper text-charcoal shadow-xl md:max-w-[640px] md:rounded-large"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-pill bg-paper text-forest-ink shadow-lg transition hover:bg-linen-mist"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pebble">
              Armar rutina rápida
            </p>
            <h2 id="workout-gen-title" className="mt-2 text-[28px] font-black leading-[1] tracking-[-0.02em] text-forest-ink md:text-[36px]">
              Rutina al toque
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-slate">
              Elegí un objetivo y te armo una rutina con un ejercicio por grupo muscular. La podés editar antes de empezar.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pebble">Objetivo</p>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGoal(opt.id)}
                  className={`flex flex-col items-start gap-1 rounded-card border px-4 py-3 text-left transition ${
                    goal === opt.id
                      ? 'border-lime-voltage bg-lime-voltage/15'
                      : 'border-fog bg-paper hover:border-forest-ink'
                  }`}
                >
                  <span className="text-[15px] font-black text-forest-ink">{opt.label}</span>
                  <span className="text-[11px] text-pebble">{opt.tag}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-fog bg-fog/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pebble">
              Vista previa · {preview.length} ejercicios
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {preview.map((it) => {
                const ex = exercises.find((e) => e.id === it.exerciseId);
                return (
                  <li key={it.exerciseId} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate font-medium text-forest-ink">{ex?.name ?? it.exerciseId}</span>
                    <span className="text-pebble">
                      {it.sets} × {it.reps}
                    </span>
                  </li>
                );
              })}
              {preview.length === 0 ? (
                <li className="text-[12px] text-pebble">
                  Todavía no hay ejercicios en el banco. Subí videos a <code>public/exercises/</code>.
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-t border-fog bg-paper px-6 py-4 md:px-10 md:py-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" onClick={handleGenerate} disabled={preview.length === 0}>
            Agregar a mi rutina
          </Button>
        </div>
      </div>
    </div>
  );
}