import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from '@/lib/router';
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

const MUSCLE_GROUPS: { label: string; muscles: MuscleGroup[] }[] = [
  {
    label: 'Tren superior',
    muscles: ['pecho', 'espalda', 'dorsales', 'trapecio', 'hombros', 'biceps', 'triceps', 'antebrazos'],
  },
  {
    label: 'Tren inferior',
    muscles: ['cuadriceps', 'femorales', 'gluteos', 'gemelos'],
  },
  {
    label: 'Core',
    muscles: ['core', 'oblicuos'],
  },
];

export function ExerciseBankPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [openSection, setOpenSection] = useState<string | null>('Tren superior');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const groupedByMuscle = useMemo(() => {
    const map = new Map<MuscleGroup, Exercise[]>();
    for (const ex of filtered) {
      if (!map.has(ex.primaryMuscle)) map.set(ex.primaryMuscle, []);
      map.get(ex.primaryMuscle)!.push(ex);
    }
    return map;
  }, [filtered]);

  if (!profile) return null;

  const activeMuscleLabel = muscleFilter ? MUSCLES[muscleFilter].label : 'Todos';

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <section className="relative">
          <span className="t-eyebrow text-[#80827f]">Catálogo · {exercises.length} ejercicios</span>
          <h1 className="mt-3 t-display text-[#2c2e2a]">Banco.</h1>
          <p className="mt-3 max-w-[44ch] t-body-lg text-[#2c2e2a]">
            Tocá un ejercicio para ver la técnica completa. Después armás el circuito en Rutina.
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

        {/* Mobile filter button */}
        <div className="mt-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-full bg-white p-3 pr-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2c2e2a] text-[#f5f1e4]">
                <Icon.Library size={16} />
              </span>
              <div className="text-left">
                <p className="t-eyebrow text-[#80827f]">Músculo</p>
                <p className="text-[14px] font-medium text-[#2c2e2a]">{activeMuscleLabel}</p>
              </div>
            </div>
            <Icon.ChevronDown size={16} className="text-[#80827f]" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:mt-8 md:grid-cols-[260px_1fr] md:gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden md:block md:sticky md:top-[6.5rem] md:self-start">
            <MuscleSidebar
              muscleFilter={muscleFilter}
              onSelect={setMuscleFilter}
              openSection={openSection}
              onToggleSection={setOpenSection}
              exercises={exercises}
            />
          </aside>

          {/* Grid */}
          <div>
            <div className="mb-3 flex items-end justify-between">
              <p className="t-eyebrow text-[#80827f]">
                <span className="font-semibold text-[#2c2e2a]">{filtered.length}</span>{' '}
                de {exercises.length} ejercicios
              </p>
              {muscleFilter ? (
                <button
                  type="button"
                  onClick={() => setMuscleFilter(null)}
                  className="text-[12px] font-medium text-[#80827f] hover:text-[#2c2e2a]"
                >
                  Limpiar
                </button>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="t-body-lg font-semibold text-[#2c2e2a]">Sin resultados</p>
                <p className="mt-1 t-body text-[#80827f]">
                  Probá quitar el filtro o ajustar la búsqueda.
                </p>
              </Card>
            ) : muscleFilter ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((ex) => (
                  <BankItem key={ex.id} exercise={ex} onSelect={setSelected} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-8">
                {MUSCLE_GROUPS.map((group) => {
                  const sectionExercises: Exercise[] = [];
                  for (const muscle of group.muscles) {
                    const list = groupedByMuscle.get(muscle);
                    if (list) sectionExercises.push(...list);
                  }
                  if (sectionExercises.length === 0) return null;
                  return (
                    <section key={group.label}>
                      <header className="mb-3 flex items-end justify-between">
                        <h2 className="t-heading-sm text-[#2c2e2a]">{group.label}</h2>
                        <span className="t-eyebrow text-[#80827f]">
                          {sectionExercises.length}{' '}
                          {sectionExercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                        </span>
                      </header>
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {sectionExercises.map((ex) => (
                          <BankItem key={ex.id} exercise={ex} onSelect={setSelected} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected ? (
        <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
      ) : null}

      {mobileMenuOpen ? (
        <MobileMuscleMenu
          onClose={() => setMobileMenuOpen(false)}
          muscleFilter={muscleFilter}
          onSelect={(m) => {
            setMuscleFilter(m);
            setMobileMenuOpen(false);
          }}
          exercises={exercises}
        />
      ) : null}
    </AppShell>
  );
}

function MuscleSidebar({
  muscleFilter,
  onSelect,
  openSection,
  onToggleSection,
  exercises,
}: {
  muscleFilter: MuscleGroup | null;
  onSelect: (m: MuscleGroup | null) => void;
  openSection: string | null;
  onToggleSection: (s: string | null) => void;
  exercises: Exercise[];
}) {
  return (
    <nav className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={classNames(
          'flex h-12 items-center gap-3 rounded-full border-2 px-4 text-[14px] font-medium transition-colors',
          muscleFilter === null
            ? 'border-[#2c2e2a] bg-[#2c2e2a] text-[#f5f1e4]'
            : 'border-[#2c2e2a]/10 bg-white text-[#2c2e2a] hover:border-[#2c2e2a]/30',
        )}
      >
        <span
          className={classNames(
            'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold',
            muscleFilter === null ? 'bg-[#f5e211] text-[#2c2e2a]' : 'bg-[#f5f1e4] text-[#2c2e2a]',
          )}
        >
          *
        </span>
        Todos
        <span className="ml-auto text-[12px] tabular-nums opacity-70">
          {exercises.length}
        </span>
      </button>

      {MUSCLE_GROUPS.map((group) => {
        const isOpen = openSection === group.label;
        return (
          <div key={group.label} className="rounded-[20px] bg-white">
            <button
              type="button"
              onClick={() => onToggleSection(isOpen ? null : group.label)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="t-eyebrow text-[#2c2e2a]">{group.label}</span>
              <Icon.ChevronDown
                size={14}
                className={classNames(
                  'text-[#2c2e2a] transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            {isOpen ? (
              <ul className="flex flex-col gap-1 px-2 pb-2">
                {group.muscles.map((m) => {
                  const muscleMeta = MUSCLES[m];
                  const count = exercises.filter(
                    (e) => e.primaryMuscle === m || e.secondaryMuscles.includes(m),
                  ).length;
                  const active = muscleFilter === m;
                  return (
                    <li key={m}>
                      <button
                        type="button"
                        onClick={() => onSelect(active ? null : m)}
                        className={classNames(
                          'flex w-full items-center justify-between gap-2 rounded-full px-3 py-2 text-[13px] transition-colors',
                          active
                            ? 'bg-[#2c2e2a] text-[#f5f1e4]'
                            : 'text-[#2c2e2a] hover:bg-[#f5f1e4]',
                        )}
                      >
                        <span className="truncate">{muscleMeta.label}</span>
                        <span
                          className={classNames(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                            active ? 'bg-[#f5e211] text-[#2c2e2a]' : 'bg-[#f5f1e4] text-[#80827f]',
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function MobileMuscleMenu({
  onClose,
  muscleFilter,
  onSelect,
  exercises,
}: {
  onClose: () => void;
  muscleFilter: MuscleGroup | null;
  onSelect: (m: MuscleGroup | null) => void;
  exercises: Exercise[];
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2c2e2a]/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[50px] bg-[#f5f1e4]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-[#2c2e2a]/10 px-5 py-4">
          <div>
            <span className="t-eyebrow text-[#80827f]">Filtrar por</span>
            <p className="mt-1 t-heading-sm text-[#2c2e2a]">Músculo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-[#e0dbce]"
          >
            <Icon.Close size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <MuscleSidebar
            muscleFilter={muscleFilter}
            onSelect={(m) => {
              onSelect(m);
            }}
            openSection={null}
            onToggleSection={() => {}}
            exercises={exercises}
          />
        </div>
      </div>
    </div>
  );
}

function BankItem({ exercise, onSelect }: { exercise: Exercise; onSelect: (e: Exercise) => void }) {
  const primary = MUSCLES[exercise.primaryMuscle];
  const secondaryCount = exercise.secondaryMuscles.length;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-[50px] border-2 border-[#2c2e2a]/10 bg-white text-left transition-all hover:-translate-y-1 hover:border-[#2c2e2a]"
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
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-[#2c2e2a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f5f1e4]">
              +{secondaryCount} sin
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="t-subheading leading-[1.2] text-[#2c2e2a]">{exercise.name}</h3>
          <p className="t-body-sm line-clamp-2 text-[#80827f]">{exercise.description}</p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5">
            <Tag tone="grass" size="sm">{primary.label}</Tag>
            <Tag tone="sandstone" size="sm">{exercise.difficulty}</Tag>
          </div>
        </div>
      </button>
    </li>
  );
}
