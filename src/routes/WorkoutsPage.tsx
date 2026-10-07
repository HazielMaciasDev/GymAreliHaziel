import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { useExercises } from '@/hooks/useExercises';
import { ExerciseBank } from '@/components/ExerciseBank';
import { RoutineBuilder } from '@/components/RoutineBuilder';
import { ExerciseDetail } from '@/components/ExerciseDetail';
import { MuscleCloud, computeMuscleSummaries } from '@/components/MuscleCloud';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { ExerciseBankSkeleton, BannerOffline } from '@/components/Skeleton';
import { WorkoutGenerator } from '@/components/WorkoutGenerator';
import type { Exercise, RoutineExercise } from '@/types';
import { PROFILES } from '@/lib/profiles';

type MobileTab = 'banco' | 'rutina';

interface DraftRoutineExercise extends RoutineExercise {
  _local: true;
}

function createLocalId() {
  return `local-${Math.random().toString(36).slice(2, 11)}`;
}

export function WorkoutsPage() {
  const router = useRouter();
  const { profile, clearProfile } = useProfile();
  const { exercises, loading, source, error, reload } = useExercises();
  const [mobileTab, setMobileTab] = useState<MobileTab>('banco');
  const [items, setItems] = useState<DraftRoutineExercise[]>([]);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (profile === null) {
      router.replace('/');
    }
  }, [profile, router]);

  const exercisesById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const e of exercises) map.set(e.id, e);
    return map;
  }, [exercises]);

  const muscleSummary = useMemo(
    () =>
      computeMuscleSummaries(
        items
          .map((i) => ({ exercise: exercisesById.get(i.exerciseId)! }))
          .filter((e) => e.exercise),
      ),
    [items, exercisesById],
  );

  if (!profile) {
    return null;
  }

  const profileMeta = PROFILES[profile];

  const addToRoutine = (exercise: Exercise) => {
    setItems((prev) => [
      ...prev,
      {
        id: createLocalId(),
        _local: true,
        routineId: 'pending',
        exerciseId: exercise.id,
        position: prev.length,
        sets: 3,
        reps: 10,
        weightKg: null,
        completedSets: 0,
      },
    ]);
    setMobileTab('rutina');
  };

  const updateItem = (id: string, patch: Partial<DraftRoutineExercise>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) =>
      prev
        .filter((it) => it.id !== id)
        .map((it, idx) => ({ ...it, position: idx })),
    );
  };

  const reorder = (next: RoutineExercise[]) => {
    setItems(
      next.map((it) => ({
        ...it,
        _local: true,
        routineId: 'pending',
      })),
    );
  };

  const startWorkout = () => {
    if (items.length === 0) return;
    const payload = items.map((it) => ({
      exerciseId: it.exerciseId,
      sets: it.sets,
      reps: it.reps,
      weightKg: it.weightKg,
      completedSets: 0,
    }));
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        'gym.activeSession',
        JSON.stringify({
          profileId: profile,
          routineName: 'Rutina de hoy',
          items: payload,
          startedAt: Date.now(),
          currentIndex: 0,
        }),
      );
    }
    router.push('/workouts/active');
  };

  const applyGenerated = (
    generated: Array<Omit<RoutineExercise, 'id' | '_local' | 'routineId' | 'position' | 'completedSets'>>,
  ) => {
    setItems((prev) => [
      ...prev,
      ...generated.map((g, idx) => ({
        ...g,
        id: createLocalId(),
        _local: true as const,
        routineId: 'pending',
        position: prev.length + idx,
        completedSets: 0,
      })),
    ]);
    setMobileTab('rutina');
  };

  return (
    <main className="mx-auto min-h-dvh max-w-[1400px] px-5 py-6 md:px-10 md:py-10">
      <header className="mb-6 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill bg-fog px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-ink">
            <span className="h-1.5 w-1.5 rounded-pill bg-lime-voltage" />
            Sesión de {profileMeta.name}
          </span>
          <h1 className="text-display mt-4 text-obsidian md:text-[64px]">
            ARMA TU RUTINA
          </h1>
          <p className="mt-2 max-w-[44ch] text-[14px] leading-[1.5] text-slate md:text-[16px]">
            Elegí ejercicios del banco, reordenalos arrastrando y arrancá cuando estés listo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {source === 'fallback' ? (
            <Pill tone="dark">Modo offline</Pill>
          ) : source === 'sdk' ? (
            <Pill tone="lime">WorkoutX · {exercises.length}</Pill>
          ) : (
            <Pill tone="mist">Cargando banco…</Pill>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerator(true)}
            disabled={exercises.length === 0}
          >
            Generar con IA
          </Button>
          <Button variant="ghost" size="sm" onClick={clearProfile}>
            Cambiar usuario
          </Button>
        </div>
      </header>

      {source === 'fallback' ? (
        <BannerOffline onReload={error ? reload : undefined} />
      ) : null}

      {loading ? (
        <ExerciseBankSkeleton />
      ) : (
        <>
          <div className="lg:hidden">
            <SegmentedTabs
              items={[
                { id: 'banco', label: 'Banco', badge: exercises.length },
                { id: 'rutina', label: 'Mi rutina', badge: items.length },
              ]}
              value={mobileTab}
              onChange={setMobileTab}
              size="lg"
            />
            <div className="mt-5">
              {mobileTab === 'banco' ? (
                <ExerciseBank exercises={exercises} onSelect={setActiveExercise} />
              ) : (
                <div className="flex flex-col gap-4">
                  <RoutineBuilder
                    items={items}
                    exercisesById={exercisesById}
                    onReorder={reorder}
                    onUpdateItem={updateItem}
                    onRemove={removeItem}
                    onSelectExercise={setActiveExercise}
                    onStart={startWorkout}
                  />
                  <MuscleCloud summaries={muscleSummary} />
                </div>
              )}
            </div>
          </div>

          <div className="hidden grid-cols-1 gap-8 lg:grid lg:grid-cols-[1.5fr_1fr]">
            <ExerciseBank exercises={exercises} onSelect={setActiveExercise} />
            <div className="flex flex-col gap-4">
              <RoutineBuilder
                items={items}
                exercisesById={exercisesById}
                onReorder={reorder}
                onUpdateItem={updateItem}
                onRemove={removeItem}
                onSelectExercise={setActiveExercise}
                onStart={startWorkout}
              />
              <MuscleCloud summaries={muscleSummary} />
            </div>
          </div>
        </>
      )}

      {activeExercise ? (
        <ExerciseDetail
          exercise={activeExercise}
          onClose={() => setActiveExercise(null)}
          onAdd={addToRoutine}
        />
      ) : null}

      {showGenerator ? (
        <WorkoutGenerator
          exercises={exercises}
          onAdd={applyGenerated}
          onClose={() => setShowGenerator(false)}
        />
      ) : null}
    </main>
  );
}