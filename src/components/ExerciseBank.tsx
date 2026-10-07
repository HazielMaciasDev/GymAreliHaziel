
import type { Exercise, MuscleGroup } from '@/types';
import { MUSCLE_LIST, MUSCLES } from '@/lib/muscles';
import { ExerciseCard } from '@/components/ExerciseCard';
import { Pill } from '@/components/ui/Pill';
import { Input } from '@/components/ui/Input';
import { useMemo, useState } from 'react';

interface ExerciseBankProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseBank({ exercises, onSelect }: ExerciseBankProps) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (muscleFilter) {
        const matches =
          ex.primaryMuscle === muscleFilter ||
          ex.secondaryMuscles.includes(muscleFilter);
        if (!matches) return false;
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pebble">
              Banco
            </p>
            <h2 className="text-[28px] font-black leading-[1] tracking-[-0.02em] text-forest-ink md:text-[36px]">
              Ejercicios
            </h2>
          </div>
          <Pill tone="dark">{filtered.length} / {exercises.length}</Pill>
        </div>
        <Input
          placeholder="Buscar ejercicio o músculo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar ejercicio"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setMuscleFilter(null)}
          className={`shrink-0 rounded-pill px-4 h-9 text-[13px] font-medium transition ${
            muscleFilter === null
              ? 'bg-lime-voltage text-forest-ink'
              : 'bg-fog text-charcoal hover:bg-linen-mist'
          }`}
        >
          Todos
        </button>
        {MUSCLE_LIST.map((m) => {
          const active = muscleFilter === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMuscleFilter(active ? null : m.id)}
              className={`shrink-0 rounded-pill px-4 h-9 text-[13px] font-medium transition ${
                active
                  ? 'bg-lime-voltage text-forest-ink'
                  : 'bg-fog text-charcoal hover:bg-linen-mist'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onSelect={onSelect} />
        ))}
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-card border border-dashed border-pebble bg-fog/40 px-6 py-12 text-center">
            <p className="text-[16px] font-medium text-charcoal">Sin resultados</p>
            <p className="mt-1 text-[13px] text-pebble">
              Probá quitar el filtro o ajustar la búsqueda.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
