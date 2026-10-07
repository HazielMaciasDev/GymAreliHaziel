'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { getWorkoutX } from '@/lib/workoutx';
import { fetchExercisesFromSdk } from '@/lib/sdk-exercises';
import type { Exercise, MuscleGroup, RoutineExercise } from '@/types';

interface WorkoutGeneratorProps {
  exercises: Exercise[];
  onAdd: (items: Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>>) => void;
  onClose: () => void;
}

type Goal = 'hypertrophy' | 'strength' | 'endurance' | 'general';
type Level = 'principiante' | 'intermedio' | 'avanzado';

const GOAL_OPTIONS: { id: Goal; label: string; tag: string }[] = [
  { id: 'hypertrophy', label: 'Hipertrofia', tag: 'Volumen · 8-12 reps' },
  { id: 'strength', label: 'Fuerza', tag: 'Pesado · 3-6 reps' },
  { id: 'endurance', label: 'Resistencia', tag: 'Ligero · 15-20 reps' },
  { id: 'general', label: 'General', tag: 'Mixto' },
];

const LEVEL_OPTIONS: { id: Level; label: string }[] = [
  { id: 'principiante', label: 'Principiante' },
  { id: 'intermedio', label: 'Intermedio' },
  { id: 'avanzado', label: 'Avanzado' },
];

const DAY_OPTIONS = [2, 3, 4, 5, 6];

function createLocalId() {
  return `local-${Math.random().toString(36).slice(2, 11)}`;
}

export function WorkoutGenerator({ exercises, onAdd, onClose }: WorkoutGeneratorProps) {
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [level, setLevel] = useState<Level>('intermedio');
  const [days, setDays] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildLocally = (): Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>> => {
    const byMuscle = new Map<string, Exercise>();
    for (const ex of exercises) {
      const cur = byMuscle.get(ex.primaryMuscle);
      if (!cur) byMuscle.set(ex.primaryMuscle, ex);
    }
    const muscles: MuscleGroup[] = ['pecho', 'espalda', 'hombros', 'cuadriceps', 'femorales', 'core'];
    const params =
      goal === 'strength'
        ? { sets: 5, reps: 5 }
        : goal === 'endurance'
          ? { sets: 3, reps: 18 }
          : goal === 'general'
            ? { sets: 3, reps: 12 }
            : { sets: 4, reps: 10 };
    const items: Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>> = [];
    for (const m of muscles) {
      const ex = byMuscle.get(m);
      if (!ex) continue;
      items.push({ exerciseId: ex.id, sets: params.sets, reps: params.reps, weightKg: null });
    }
    return items;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
      const wx = getWorkoutX();
      try {
      const result = await wx.workout.generate({
        goal,
        level,
        daysPerWeek: days,
      } as Record<string, unknown>);
      const items = extractItemsFromSdkResponse(result, exercises);
      if (items.length === 0) {
        onAdd(buildLocally());
      } else {
        onAdd(items);
      }
      onClose();
    } catch (err) {
      // plan might not include workoutGenerator; fall back to local builder
      try {
        // try a single list refresh in case we have stale data
        await fetchExercisesFromSdk(60).catch(() => null);
      } catch {
        // ignore
      }
      const msg = err instanceof Error ? err.message : 'No se pudo generar la rutina';
      setError(`${msg} · usando selección local`);
      onAdd(buildLocally());
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
              Generador IA
            </p>
            <h2 id="workout-gen-title" className="mt-2 text-[28px] font-black leading-[1] tracking-[-0.02em] text-forest-ink md:text-[36px]">
              Armá tu rutina con IA
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-slate">
              La IA arma una rutina según tu objetivo. La podés editar antes de empezar.
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

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pebble">Nivel</p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLevel(opt.id)}
                  className={`rounded-pill px-4 h-9 text-[13px] font-medium transition ${
                    level === opt.id
                      ? 'bg-lime-voltage text-forest-ink'
                      : 'bg-fog text-charcoal hover:bg-linen-mist'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pebble">Días por semana</p>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`flex h-10 w-10 items-center justify-center rounded-pill text-[14px] font-bold transition ${
                    days === d
                      ? 'bg-forest-ink text-lime-voltage'
                      : 'bg-fog text-charcoal hover:bg-linen-mist'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <Pill tone="dark">{error}</Pill>
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-t border-fog bg-paper px-6 py-4 md:px-10 md:py-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generando…' : 'Generar rutina'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function extractItemsFromSdkResponse(
  response: unknown,
  catalog: Exercise[],
): Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>> {
  if (!response || typeof response !== 'object') return [];
  const obj = response as Record<string, unknown>;

  // Try common shapes
  const candidateLists: unknown[] = [];
  for (const k of ['exercises', 'items', 'workout', 'routine', 'data']) {
    if (Array.isArray(obj[k])) candidateLists.push(obj[k]);
  }
  // Also accept { day1: [...], day2: [...] }
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v) && /day|sesion|session/i.test(k)) candidateLists.push(v);
  }
  if (candidateLists.length === 0) return [];

  const byId = new Map(catalog.map((e) => [e.id, e]));
  const items: Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>> = [];
  for (const list of candidateLists) {
    for (const raw of list as unknown[]) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      const id = (r.exerciseId as string) ?? (r.id as string) ?? (r.exercise_id as string);
      if (!id) continue;
      if (!byId.has(id)) continue;
      const sets = Number((r.sets as number) ?? 3) || 3;
      const reps = Number((r.reps as number) ?? 10) || 10;
      const weightKgRaw = r.weightKg ?? r.weight;
      const weightKg = weightKgRaw == null ? null : Number(weightKgRaw) || null;
      items.push({ exerciseId: id, sets, reps, weightKg });
    }
  }
  return items;
}