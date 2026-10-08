import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
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
        <section className="relative">
          <span className="t-eyebrow text-[#80827f]">Catálogo · {exercises.length} ejercicios</span>
          <h1 className="mt-3 t-display text-[#2c2e2a]">Banco.</h1>
          <p className="mt-3 max-w-[44ch] t-body-lg text-[#2c2e2a]">
            Tocá un ejercicio para ver técnica y ángulos. Después armás la rutina en Rutina.
          </p>
          <div className="absolute right-0 top-0 hidden md:block">
            <Sparkle size={36} color="#ff705d" className="animate-float" />
          </div>
        </section>

        <div className="mt-6 md:mt-8">
          <Input
            placeholder="Buscar ejercicio o músculo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            pillSize="lg"
            prefix={<Icon.Search size={18} className="text-[#80827f]" />}
          />
        </div>

        <div className="mt-4 -mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <div className="flex gap-1.5">
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

        <p className="mt-6 t-body-sm text-[#80827f]">
          <span className="font-semibold text-[#2c2e2a]">{filtered.length}</span> de {exercises.length} ejercicios
        </p>

        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <BankItem key={ex.id} exercise={ex} onSelect={setSelected} />
          ))}
        </ul>

        {filtered.length === 0 ? (
          <Card padding="lg" className="mt-4 text-center">
            <p className="t-body-lg font-semibold text-[#2c2e2a]">Sin resultados</p>
            <p className="mt-1 t-body text-[#80827f]">
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
        'shrink-0 rounded-full border-2 px-4 h-10 text-[13px] font-medium transition-colors',
        active
          ? 'border-[#2c2e2a] bg-[#2c2e2a] text-white'
          : 'border-[#2c2e2a]/10 bg-white text-[#2c2e2a] hover:border-[#2c2e2a]/30',
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
        className="group flex h-full w-full flex-col overflow-hidden rounded-[50px] border-2 border-[#2c2e2a]/10 bg-white text-left transition-transform hover:-translate-y-1 hover:border-[#2c2e2a]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f1e4]">
          <ExerciseMedia
            src={exercise.gifPath}
            alt={exercise.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="t-subheading text-[#2c2e2a]">{exercise.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag tone="grass" size="sm">{primary.label}</Tag>
            <Tag tone="sandstone" size="sm">{exercise.difficulty}</Tag>
          </div>
        </div>
      </button>
    </li>
  );
}