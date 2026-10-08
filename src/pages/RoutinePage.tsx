import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExercisePalette } from '@/components/ExercisePalette';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { WeekCalendar, reorderInDay } from '@/components/WeekCalendar';
import { Icon } from '@/components/Icon';
import {
  addExerciseToDay,
  entryHasExercise,
  fetchWeeklyRoutine,
  moveExercise,
  removeFromRoutine,
} from '@/lib/weekly-routine';
import { EXERCISES } from '@/data/exercises';
import type { Exercise } from '@/types';
import { classNames } from '@/lib/format';
import type { WeeklyRoutineEntry } from '@/lib/weekly-routine';

export function RoutinePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<WeeklyRoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [draggingPalette, setDraggingPalette] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadEntries = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await fetchWeeklyRoutine(profile);
      setEntries(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la rutina. Revisá la conexión con Supabase.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    loadEntries();
  }, [profile, router, loadEntries]);

  const profileExercises = useMemo(() => {
    if (!profile) return [];
    return EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile));
  }, [profile]);

  const takenByDay = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const e of entries) {
      if (!map.has(e.day_of_week)) map.set(e.day_of_week, new Set());
      map.get(e.day_of_week)!.add(e.exercise_id);
    }
    return map;
  }, [entries]);

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { type?: string; exerciseId?: string } | undefined;
    if (data?.type === 'palette' && data.exerciseId) {
      const ex = EXERCISES.find((e) => e.id === data.exerciseId);
      if (ex) setDraggingPalette(ex);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setDraggingPalette(null);
    const { active, over } = event;
    if (!over || !profile) return;

    const activeData = active.data.current as { type?: string; exerciseId?: string; entry?: WeeklyRoutineEntry } | undefined;
    const overData = over.data.current as { type?: string; dayOfWeek?: number } | undefined;

    if (activeData?.type === 'palette') {
      if (overData?.type === 'day' && typeof overData.dayOfWeek === 'number') {
        const exerciseId = activeData.exerciseId;
        if (!exerciseId) return;
        const day = overData.dayOfWeek;
        if (entryHasExercise(entries, day, exerciseId)) {
          setError('Ese ejercicio ya está en este día.');
          setTimeout(() => setError(null), 2400);
          return;
        }
        try {
          const created = await addExerciseToDay(profile, day, exerciseId, 3, 10);
          setEntries((prev) => {
            const dayEntries = prev
              .filter((e) => e.day_of_week === day)
              .sort((a, b) => a.position - b.position);
            const newPos = dayEntries.length;
            const others = prev.filter((e) => e.day_of_week !== day);
            return [...others, ...dayEntries, { ...created, position: newPos }];
          });
        } catch (err) {
          console.error(err);
          setError('No se pudo agregar el ejercicio.');
        }
      }
      return;
    }

    if (activeData?.type === 'routine' && activeData.entry) {
      const entry = activeData.entry;
      let targetDay: number | undefined;
      let targetIndex: number | undefined;

      if (overData?.type === 'day' && typeof overData.dayOfWeek === 'number') {
        targetDay = overData.dayOfWeek;
        const dayEntries = entries
          .filter((e) => e.day_of_week === targetDay && e.id !== entry.id)
          .sort((a, b) => a.position - b.position);
        targetIndex = dayEntries.length;
      } else if (over.id !== active.id) {
        const overEntry = entries.find((e) => e.id === over.id);
        if (!overEntry) return;
        targetDay = overEntry.day_of_week;
        const dayEntries = entries
          .filter((e) => e.day_of_week === targetDay && e.id !== entry.id)
          .sort((a, b) => a.position - b.position);
        const overIndex = dayEntries.findIndex((e) => e.id === over.id);
        targetIndex = overIndex === -1 ? dayEntries.length : overIndex;
      }

      if (targetDay === undefined || targetIndex === undefined) return;

      const previousDayEntries = entries
        .filter((e) => e.day_of_week === targetDay && e.id !== entry.id)
        .sort((a, b) => a.position - b.position);
      const optimistic = (() => {
        if (targetDay === entry.day_of_week) {
          const dayEntries = entries
            .filter((e) => e.day_of_week === targetDay)
            .sort((a, b) => a.position - b.position);
          const oldIndex = dayEntries.findIndex((e) => e.id === entry.id);
          const newIndex = previousDayEntries.findIndex((e) => e.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return entries;
          const reordered = arrayMove(dayEntries, oldIndex, newIndex);
          const others = entries.filter((e) => e.day_of_week !== targetDay);
          return [...others, ...reordered.map((e, idx) => ({ ...e, position: idx }))];
        }
        const others = entries.filter((e) => e.day_of_week !== entry.day_of_week);
        const fromDayReindexed = others
          .filter((e) => e.day_of_week === entry.day_of_week)
          .sort((a, b) => a.position - b.position)
          .map((e, idx) => ({ ...e, position: idx }));
        const targetDayEntries = [
          ...previousDayEntries.slice(0, targetIndex),
          { ...entry, day_of_week: targetDay, position: -1 },
          ...previousDayEntries.slice(targetIndex),
        ];
        return [
          ...fromDayReindexed,
          ...targetDayEntries.map((e, idx) => ({ ...e, position: idx })),
        ];
      })();
      setEntries(optimistic);

      try {
        await moveExercise(entry.id, targetDay, targetIndex);
      } catch (err) {
        console.error(err);
        setError('No se pudo mover el ejercicio. Reintentá.');
        loadEntries();
      }
    }
  };

  const onRemoveEntry = async (id: string) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (!target) return prev;
      const others = prev.filter((e) => e.day_of_week !== target.day_of_week);
      const sameDay = prev
        .filter((e) => e.day_of_week === target.day_of_week && e.id !== id)
        .sort((a, b) => a.position - b.position);
      return [...others, ...sameDay.map((e, idx) => ({ ...e, position: idx }))];
    });
    try {
      await removeFromRoutine(id);
    } catch (err) {
      console.error(err);
      setError('No se pudo quitar el ejercicio.');
      loadEntries();
    }
  };

  const todayIndex = useMemo(() => {
    const js = new Date().getDay();
    return (js + 6) % 7;
  }, []);

  if (!profile) return null;

  return (
    <AppShell>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-6 md:grid-cols-[300px_1fr] md:gap-5 md:py-8">
          <div className="hidden md:block md:h-[calc(100dvh-10rem)] md:sticky md:top-[6.5rem]">
            <ExercisePalette
              exercises={profileExercises}
              takenExerciseIds={takenByDay.get(activeDay ?? todayIndex) ?? new Set()}
            />
          </div>

          <div className="flex flex-col gap-4">
            <header className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Plantilla semanal</p>
                <h1 className="mt-2 font-display text-[clamp(40px,5vw,60px)] leading-[0.95] text-forest-ink">
                  RUTINA
                </h1>
              </div>
              <Button
                variant="primary"
                size="md"
                iconRight={<Icon.Play size={14} />}
                onClick={() => router.push('/routine/active')}
              >
                Iniciar hoy
              </Button>
            </header>

            {error ? (
              <div className="border border-alarm-red bg-paper px-4 py-3 text-[13px] text-alarm-red">{error}</div>
            ) : null}

            <Card padding="none" className="overflow-hidden">
              {loading ? (
                <div className="flex h-64 items-center justify-center text-[13px] text-pebble">Cargando rutina…</div>
              ) : (
                <WeekCalendar
                  entries={entries}
                  todayIndex={todayIndex}
                  activeDay={activeDay}
                  onSelectDay={setActiveDay}
                  onRemoveEntry={onRemoveEntry}
                  onSelectExercise={setSelectedExercise}
                />
              )}
            </Card>

            <details className="md:hidden border border-fog">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-[13px] font-medium text-forest-ink">
                Catálogo
                <Icon.ChevronDown size={16} />
              </summary>
              <div className="h-[480px] border-t border-fog">
                <ExercisePalette
                  exercises={profileExercises}
                  takenExerciseIds={takenByDay.get(activeDay ?? todayIndex) ?? new Set()}
                />
              </div>
            </details>
          </div>
        </div>

        <DragOverlay>
          {draggingPalette ? (
            <div className={classNames(
              'flex items-center justify-between gap-3 border border-forest-ink bg-paper px-3 py-2.5 text-[13px] shadow-lg',
            )}>
              <span className="font-medium text-forest-ink">{draggingPalette.name}</span>
              <span className="text-pebble">
                <Icon.Drag size={14} />
              </span>
            </div>
          ) : null}
        </DragOverlay>

        {selectedExercise ? (
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        ) : null}
      </DndContext>
    </AppShell>
  );
}