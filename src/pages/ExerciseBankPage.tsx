import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { Icon } from '@/components/Icon';
import { MUSCLES, MUSCLE_LIST } from '@/lib/muscles';
import { EXERCISES } from '@/data/exercises';
import type { Exercise, MuscleGroup } from '@/types';
import { classNames } from '@/lib/format';

export function ExerciseBankPage() {
  const { profile } = useProfile();
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<Exercise | null>(null);

  const exercises = useMemo(() => {
    if (!profile) return [];
    return EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile));
  }, [profile]);

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

  if (!profile) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 md:mb-10">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Catálogo</p>
          <h1 className="mt-2 font-display text-[clamp(40px,5vw,60px)] leading-[0.95] text-forest-ink">
            BANCO
          </h1>
          <p className="mt-3 max-w-[44ch] text-[14px] leading-[1.5] text-slate">
            Tocá un ejercicio para ver el detalle. Para planificarlo en tu semana, andá a Rutina y arrastralo al día correspondiente.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="md:w-[360px]">
            <Input
              placeholder="Buscar ejercicio o músculo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setMuscleFilter(null)}
              className={classNames(
                'h-8 px-3 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors',
                muscleFilter === null
                  ? 'bg-forest-ink text-paper'
                  : 'border border-fog text-slate hover:border-forest-ink hover:text-forest-ink',
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
                  'h-8 px-3 text-[10px] font-medium tracking-[0.12em] uppercase transition-colors',
                  muscleFilter === m.id
                    ? 'bg-forest-ink text-paper'
                    : 'border border-fog text-slate hover:border-forest-ink hover:text-forest-ink',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-4 text-[12px] tracking-[0.08em] uppercase text-pebble">
          {filtered.length} de {exercises.length} ejercicios
        </p>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ex) => (
            <BankItem key={ex.id} exercise={ex} onSelect={setSelected} />
          ))}
        </ul>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-fog py-12 text-center">
            <p className="text-[14px] text-charcoal">Sin resultados</p>
            <p className="mt-1 text-[12px] text-pebble">Probá quitar el filtro o ajustar la búsqueda.</p>
          </div>
        ) : null}
      </div>

      {selected ? (
        <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
      ) : null}
    </AppShell>
  );
}

function BankItem({ exercise, onSelect }: { exercise: Exercise; onSelect: (e: Exercise) => void }) {
  const primary = MUSCLES[exercise.primaryMuscle];
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="group flex w-full flex-col overflow-hidden border border-fog bg-paper text-left transition-colors hover:border-forest-ink"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-fog">
          <ExerciseMedia
            src={exercise.gifPath}
            alt={exercise.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold leading-[1.25] text-forest-ink">
              {exercise.name}
            </h3>
            <Icon.ChevronRight size={14} className="mt-1 shrink-0 text-pebble" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="default">{primary.label}</Tag>
            <Tag tone="muted">{exercise.difficulty.toUpperCase()}</Tag>
          </div>
        </div>
      </button>
    </li>
  );
}