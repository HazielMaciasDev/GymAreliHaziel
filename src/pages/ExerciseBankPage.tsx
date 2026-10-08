import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
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
      <div className="py-6 md:py-10">
        <header className="mb-8 md:mb-10">
          <p className="text-eyebrow text-black/50">Catálogo</p>
          <h1 className="mt-2 text-display-sm text-black md:text-display">
            Banco.
          </h1>
          <p className="mt-4 max-w-[44ch] font-serif text-[18px] leading-[1.56] text-[#615d59]">
            Tocá un ejercicio para ver técnica, ángulos y músculos trabajados. Para planificarlo, andá a Rutina.
          </p>
        </header>

        <div className="mb-5">
          <Input
            placeholder="Buscar ejercicio o músculo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<Icon.Search size={16} className="text-black/50" />}
          />
        </div>

        <div className="mb-6 -mx-1 overflow-x-auto pb-1">
          <div className="flex gap-1.5 px-1">
            <FilterChip
              label="Todos"
              active={muscleFilter === null}
              onClick={() => setMuscleFilter(null)}
            />
            {MUSCLE_LIST.map((m) => (
              <FilterChip
                key={m.id}
                label={m.label}
                active={muscleFilter === m.id}
                onClick={() => setMuscleFilter(muscleFilter === m.id ? null : m.id)}
              />
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-[13px] text-[#615d59]">
            <span className="font-semibold text-black">{filtered.length}</span> de {exercises.length} ejercicios
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <BankItem key={ex.id} exercise={ex} onSelect={setSelected} />
          ))}
        </ul>

        {filtered.length === 0 ? (
          <Card padding="lg" className="mt-4 text-center">
            <p className="text-[16px] font-semibold text-black">Sin resultados</p>
            <p className="mt-1 text-[14px] text-[#615d59]">
              Probá quitar el filtro o ajustar la búsqueda.
            </p>
          </Card>
        ) : null}
      </div>

      {selected ? (
        <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
      ) : null}
    </AppShell>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'shrink-0 rounded-full border px-3.5 h-9 text-[13px] font-medium transition-colors',
        active
          ? 'bg-black text-white border-black'
          : 'bg-white text-black/70 border-black/10 hover:border-black/30 hover:text-black',
      )}
    >
      {label}
    </button>
  );
}

function BankItem({ exercise, onSelect }: { exercise: Exercise; onSelect: (e: Exercise) => void }) {
  const primary = MUSCLES[exercise.primaryMuscle];
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-[12px] border border-black/[0.08] bg-white text-left transition-transform duration-200 hover:-translate-y-0.5 hover:border-black/20"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.04]">
          <ExerciseMedia
            src={exercise.gifPath}
            alt={exercise.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <h3 className="text-[16px] font-semibold leading-[1.25] text-black">
            {exercise.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag tone="muted">{primary.label}</Tag>
            <Tag tone="muted">{exercise.difficulty}</Tag>
          </div>
        </div>
      </button>
    </li>
  );
}