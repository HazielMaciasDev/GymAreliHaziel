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
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { fetchWeeklyRoutine, addExerciseToDay, removeFromRoutine, moveExercise, type WeeklyRoutineEntry } from '@/lib/weekly-routine';
import { EXERCISES } from '@/data/exercises';
import type { Exercise, MuscleGroup } from '@/types';
import {
  DAYS_OF_WEEK,
  classNames,
  dayOfWeekFromDate,
} from '@/lib/format';
import { MUSCLES, MUSCLE_LIST } from '@/lib/muscles';

export function RoutinePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<WeeklyRoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingPalette, setDraggingPalette] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const loadEntries = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await fetchWeeklyRoutine(profile);
      setEntries(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la rutina.');
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

  const todayIndex = useMemo(() => dayOfWeekFromDate(new Date()), []);

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
      const exerciseId = activeData.exerciseId;
      if (!exerciseId || overData?.type !== 'day' || typeof overData.dayOfWeek !== 'number') return;
      const day = overData.dayOfWeek;
      if (takenByDay.get(day)?.has(exerciseId)) {
        setError('Ese ejercicio ya está en este día.');
        setTimeout(() => setError(null), 2400);
        return;
      }
      try {
        const created = await addExerciseToDay(profile, day, exerciseId, 3, 10);
        setEntries((prev) => [...prev, created]);
      } catch (err) {
        console.error(err);
        setError('No se pudo agregar el ejercicio.');
      }
      return;
    }

    if (activeData?.type === 'routine' && activeData.entry) {
      const entry = activeData.entry;
      let targetDay: number | undefined;
      let targetIndex: number | undefined;

      if (overData?.type === 'day' && typeof overData.dayOfWeek === 'number') {
        targetDay = overData.dayOfWeek;
        const dayEntries = entries.filter((e) => e.day_of_week === targetDay && e.id !== entry.id);
        targetIndex = dayEntries.length;
      } else if (over.id !== active.id) {
        const overEntry = entries.find((e) => e.id === over.id);
        if (!overEntry) return;
        targetDay = overEntry.day_of_week;
        const dayEntries = entries.filter((e) => e.day_of_week === targetDay && e.id !== entry.id);
        const overIndex = dayEntries.findIndex((e) => e.id === over.id);
        targetIndex = overIndex === -1 ? dayEntries.length : overIndex;
      }

      if (targetDay === undefined || targetIndex === undefined) return;

      setEntries((prev) => {
        const targetList = prev
          .filter((e) => e.day_of_week === targetDay && e.id !== entry.id)
          .sort((a, b) => a.position - b.position);
        if (targetDay === entry.day_of_week) {
          const oldList = prev
            .filter((e) => e.day_of_week === targetDay)
            .sort((a, b) => a.position - b.position);
          const oldIndex = oldList.findIndex((e) => e.id === entry.id);
          const newIndex = targetList.findIndex((e) => e.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return prev;
          const reordered = arrayMove(oldList, oldIndex, newIndex);
          const others = prev.filter((e) => e.day_of_week !== targetDay);
          return [...others, ...reordered.map((e, idx) => ({ ...e, position: idx }))];
        }
        const fromList = prev
          .filter((e) => e.day_of_week === entry.day_of_week && e.id !== entry.id)
          .sort((a, b) => a.position - b.position)
          .map((e, idx) => ({ ...e, position: idx }));
        const others = prev.filter(
          (e) => e.day_of_week !== entry.day_of_week && e.day_of_week !== targetDay,
        );
        const newTarget = [
          ...targetList.slice(0, targetIndex),
          { ...entry, day_of_week: targetDay!, position: -1 },
          ...targetList.slice(targetIndex),
        ].map((e, idx) => ({ ...e, position: idx }));
        return [...fromList, ...others, ...newTarget];
      });

      try {
        await moveExercise(entry.id, targetDay, targetIndex);
      } catch (err) {
        console.error(err);
        setError('No se pudo mover el ejercicio.');
        loadEntries();
      }
    }
  };

  const onRemoveEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await removeFromRoutine(id);
    } catch (err) {
      console.error(err);
      setError('No se pudo quitar el ejercicio.');
      loadEntries();
    }
  };

  const onAddFromPalette = async (day: number, exerciseId: string) => {
    if (!profile) return;
    if (takenByDay.get(day)?.has(exerciseId)) {
      setError('Ese ejercicio ya está en este día.');
      setTimeout(() => setError(null), 2400);
      return;
    }
    setPaletteOpen(null);
    try {
      const created = await addExerciseToDay(profile, day, exerciseId, 3, 10);
      setEntries((prev) => [...prev, created]);
    } catch (err) {
      console.error(err);
      setError('No se pudo agregar el ejercicio.');
    }
  };

  if (!profile) return null;

  const todayPlanned = entries
    .filter((e) => e.day_of_week === todayIndex)
    .sort((a, b) => a.position - b.position);
  const todayMeta = DAYS_OF_WEEK[todayIndex];
  const hasAnyToday = todayPlanned.length > 0;

  return (
    <AppShell>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="py-6 md:py-10">
          <section className="relative">
            <span className="t-eyebrow text-[#80827f]">Plantilla semanal</span>
            <h1 className="mt-3 t-display text-[#2c2e2a]">Tu rutina.</h1>
            <p className="mt-3 max-w-[44ch] t-body-lg text-[#2c2e2a]">
              Tocá un día para sumarle ejercicios. Arrastrá en desktop.
            </p>
            <div className="absolute -right-2 top-0 hidden md:block">
              <Sparkle size={32} color="#2ba0ff" className="animate-float" />
            </div>
          </section>

          <div className="mt-6 md:mt-8">
            {hasAnyToday ? (
              <Button
                variant="coral"
                size="lg"
                onClick={() => router.push('/routine/active')}
                iconRight={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M7 5v14l11-7z" />
                  </svg>
                }
                dotColor="sunshine"
              >
                Iniciar {todayMeta.long}
              </Button>
            ) : (
              <Button
                variant="dark"
                size="lg"
                onClick={() => setPaletteOpen(todayIndex)}
                iconRight={<Icon.Plus size={16} />}
                dotColor="grass"
              >
                Armar rutina de {todayMeta.long.toLowerCase()}
              </Button>
            )}
          </div>

          {error ? (
            <div className="mt-4 rounded-[20px] border-2 border-[#ff705d] bg-white px-4 py-3 text-[14px] text-[#ff705d]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <Card padding="lg" className="mt-6 text-center">
              <p className="text-[16px] text-[#80827f]">Cargando rutina…</p>
            </Card>
          ) : (
            <>
              {/* Mobile: stacked day cards */}
              <div className="mt-6 grid grid-cols-1 gap-3 md:hidden">
                {DAYS_OF_WEEK.map((d) => {
                  const dayEntries = entries
                    .filter((e) => e.day_of_week === d.id)
                    .sort((a, b) => a.position - b.position);
                  const isToday = d.id === todayIndex;
                  return (
                    <DayCardMobile
                      key={d.id}
                      day={d}
                      isToday={isToday}
                      entries={dayEntries}
                      onAdd={() => setPaletteOpen(d.id)}
                      onRemove={onRemoveEntry}
                      onSelectExercise={setSelectedExercise}
                    />
                  );
                })}
              </div>

              {/* Desktop: weekly grid + sidebar palette */}
              <div className="mt-6 hidden md:grid md:grid-cols-[320px_1fr] md:gap-5">
                <div className="md:h-[calc(100dvh-10rem)] md:sticky md:top-[6.5rem]">
                  <PalettePanel
                    exercises={profileExercises}
                    onPick={(exId) => onAddFromPalette(todayIndex, exId)}
                  />
                </div>
                <Card padding="lg" className="overflow-hidden">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="t-heading-sm text-[#2c2e2a]">Semana</h2>
                    <span className="t-eyebrow text-[#80827f]">Arrastrá entre días</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((d) => {
                      const dayEntries = entries
                        .filter((e) => e.day_of_week === d.id)
                        .sort((a, b) => a.position - b.position);
                      const isToday = d.id === todayIndex;
                      return (
                        <div key={d.id} className="flex flex-col gap-2">
                          <div
                            className={classNames(
                              'flex flex-col items-center justify-center rounded-full py-2.5',
                              isToday ? 'bg-[#2c2e2a] text-white' : 'bg-[#f5f1e4] text-[#2c2e2a]',
                            )}
                          >
                            <span className="t-micro">{d.short}</span>
                            <span className="mt-0.5 text-[14px] font-semibold">
                              {dayEntries.length}
                            </span>
                          </div>
                          <DesktopDayColumn
                            dayId={d.id}
                            isToday={isToday}
                            entries={dayEntries}
                            onRemove={onRemoveEntry}
                            onSelectExercise={setSelectedExercise}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>

        <DragOverlay>
          {draggingPalette ? (
            <div className="rounded-full border-2 border-[#2c2e2a] bg-white px-4 py-2.5 text-[14px] font-medium text-[#2c2e2a] shadow-lg">
              {draggingPalette.name}
            </div>
          ) : null}
        </DragOverlay>

        {selectedExercise ? (
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        ) : null}

        {paletteOpen !== null ? (
          <PaletteSheet
            dayId={paletteOpen}
            exercises={profileExercises}
            takenIds={takenByDay.get(paletteOpen) ?? new Set()}
            onPick={(exId) => onAddFromPalette(paletteOpen, exId)}
            onClose={() => setPaletteOpen(null)}
          />
        ) : null}
      </DndContext>
    </AppShell>
  );
}

function DayCardMobile({
  day,
  isToday,
  entries,
  onAdd,
  onRemove,
  onSelectExercise,
}: {
  day: { id: number; long: string; short: string };
  isToday: boolean;
  entries: WeeklyRoutineEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onSelectExercise: (ex: Exercise) => void;
}) {
  return (
    <div
      className={classNames(
        'rounded-[50px] border-2 bg-white p-5 transition-colors',
        isToday ? 'border-[#2c2e2a]' : 'border-[#2c2e2a]/10',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={classNames(
              'flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold',
              isToday ? 'bg-[#2c2e2a] text-white' : 'bg-[#f5f1e4] text-[#2c2e2a]',
            )}
          >
            {day.short.charAt(0)}
          </span>
          <div>
            <p className="text-[16px] font-semibold leading-tight text-[#2c2e2a]">{day.long}</p>
            <p className="t-eyebrow text-[#80827f]">
              {entries.length} {entries.length === 1 ? 'ejercicio' : 'ejercicios'}
            </p>
          </div>
        </div>
        {isToday ? <Tag tone="grass" size="sm">Hoy</Tag> : null}
      </div>

      {entries.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-[#2c2e2a]/15 py-4 text-[14px] text-[#80827f] hover:border-[#2c2e2a]/40 hover:text-[#2c2e2a]"
        >
          <Icon.Plus size={14} />
          Sumar ejercicio
        </button>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const ex = EXERCISES.find((e) => e.id === entry.exercise_id);
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-full bg-[#f5f1e4] px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[#2c2e2a]">
                  {entry.position + 1}
                </span>
                <button
                  type="button"
                  onClick={() => ex && onSelectExercise(ex)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[14px] font-medium text-[#2c2e2a]">
                    {ex?.name ?? entry.exercise_id}
                  </p>
                </button>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] tabular-nums text-[#2c2e2a]">
                  {entry.default_sets}×{entry.default_reps}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#80827f] hover:bg-[#ff705d]/10 hover:text-[#ff705d]"
                  aria-label="Quitar"
                >
                  <Icon.Trash size={14} />
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-[#2c2e2a]/15 py-2.5 text-[12px] text-[#80827f] hover:border-[#2c2e2a]/40 hover:text-[#2c2e2a]"
            >
              <Icon.Plus size={12} />
              Sumar otro
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

function DesktopDayColumn({
  dayId,
  isToday,
  entries,
  onRemove,
  onSelectExercise,
}: {
  dayId: number;
  isToday: boolean;
  entries: WeeklyRoutineEntry[];
  onRemove: (id: string) => void;
  onSelectExercise: (ex: Exercise) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayId}`,
    data: { type: 'day', dayOfWeek: dayId },
  });

  return (
    <div
      ref={setNodeRef}
      className={classNames(
        'flex min-h-[360px] flex-col gap-1.5 rounded-[25px] border-2 p-2 transition-colors',
        isOver
          ? 'border-[#8ed462] bg-[#8ed462]/10'
          : isToday
            ? 'border-[#2c2e2a]/15 bg-white'
            : 'border-dashed border-[#2c2e2a]/10 bg-white/50',
      )}
    >
      <ul className="flex flex-1 flex-col gap-1.5">
        {entries.map((entry) => {
          const ex = EXERCISES.find((e) => e.id === entry.exercise_id);
          return (
            <RoutineItem
              key={entry.id}
              entry={entry}
              exercise={ex}
              onRemove={onRemove}
              onSelectExercise={onSelectExercise}
            />
          );
        })}
        {entries.length === 0 ? (
          <li className="flex flex-1 items-center justify-center rounded-[20px] px-1 text-center text-[10px] uppercase tracking-[0.12em] text-[#80827f]">
            Arrastrá
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function RoutineItem({
  entry,
  exercise,
  onRemove,
  onSelectExercise,
}: {
  entry: WeeklyRoutineEntry;
  exercise: Exercise | undefined;
  onRemove: (id: string) => void;
  onSelectExercise: (ex: Exercise) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    data: { type: 'routine', entry },
    disabled: false,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-1.5 rounded-[15px] border border-[#2c2e2a]/10 bg-white p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-[#80827f] hover:text-[#2c2e2a] active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <Icon.Drag size={12} />
      </button>
      <button
        type="button"
        onClick={() => exercise && onSelectExercise(exercise)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-[12px] font-medium leading-[1.25] text-[#2c2e2a]">
          {exercise?.name ?? entry.exercise_id}
        </p>
        <p className="mt-0.5 text-[10px] text-[#80827f]">
          {entry.default_sets} × {entry.default_reps}
        </p>
      </button>
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        className="text-[#80827f] opacity-0 hover:text-[#ff705d] group-hover:opacity-100"
        aria-label="Quitar"
      >
        <Icon.Close size={12} />
      </button>
    </li>
  );
}

function PalettePanel({
  exercises,
  onPick,
}: {
  exercises: Exercise[];
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (muscleFilter && ex.primaryMuscle !== muscleFilter) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        MUSCLES[ex.primaryMuscle].label.toLowerCase().includes(q)
      );
    });
  }, [exercises, query, muscleFilter]);

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div>
        <span className="t-eyebrow text-[#80827f]">Catálogo</span>
        <p className="mt-1 t-body-sm text-[#2c2e2a]">
          Tocá un ejercicio para sumarlo al día de hoy.
        </p>
      </div>
      <div className="mt-3">
        <Input
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={
            <Icon.Search size={16} className="text-[#80827f]" />
          }
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setMuscleFilter(null)}
          className={classNames(
            'rounded-[10px] px-2.5 h-7 text-[11px] font-medium transition-colors',
            muscleFilter === null
              ? 'bg-[#2c2e2a] text-white'
              : 'bg-white text-[#2c2e2a] border border-[#2c2e2a]/10 hover:border-[#2c2e2a]/30',
          )}
        >
          Todos
        </button>
        {MUSCLE_LIST.slice(0, 6).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMuscleFilter(muscleFilter === m.id ? null : m.id)}
            className={classNames(
              'rounded-[10px] px-2.5 h-7 text-[11px] font-medium transition-colors',
              muscleFilter === m.id
                ? 'bg-[#2c2e2a] text-white'
                : 'bg-white text-[#2c2e2a] border border-[#2c2e2a]/10 hover:border-[#2c2e2a]/30',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        <ul className="flex flex-col gap-1">
          {filtered.map((ex) => {
            const primary = MUSCLES[ex.primaryMuscle];
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onPick(ex.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-full px-3 py-2 text-left transition-colors hover:bg-[#2c2e2a]/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#2c2e2a]">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-[#80827f]">{primary.label}</p>
                  </div>
                  <Icon.Plus size={14} className="text-[#80827f]" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function PaletteSheet({
  dayId,
  exercises,
  takenIds,
  onPick,
  onClose,
}: {
  dayId: number;
  exercises: Exercise[];
  takenIds: Set<string>;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const day = DAYS_OF_WEEK[dayId];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((ex) => !takenIds.has(ex.id))
      .filter((ex) => {
        if (!q) return true;
        return (
          ex.name.toLowerCase().includes(q) ||
          MUSCLES[ex.primaryMuscle].label.toLowerCase().includes(q)
        );
      });
  }, [exercises, takenIds, query]);

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
            <span className="t-eyebrow text-[#80827f]">Sumar a {day.long}</span>
            <p className="mt-1 t-heading-sm text-[#2c2e2a]">Elegí un ejercicio</p>
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
        <div className="border-b-2 border-[#2c2e2a]/10 p-4">
          <Input
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            pillSize="md"
            prefix={<Icon.Search size={16} className="text-[#80827f]" />}
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="t-body text-[#80827f]">
                {takenIds.size > 0
                  ? 'Todos los ejercicios de este catálogo ya están en este día.'
                  : 'Sin resultados.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {MUSCLE_LIST.map((m) => {
                const group = filtered.filter((ex) => ex.primaryMuscle === m.id);
                if (group.length === 0) return null;
                return (
                  <li key={m.id}>
                    <p className="px-3 pb-1.5 t-eyebrow text-[#80827f]">{m.label}</p>
                    <ul className="flex flex-col">
                      {group.map((ex) => (
                        <li key={ex.id}>
                          <button
                            type="button"
                            onClick={() => onPick(ex.id)}
                            className="flex w-full items-center gap-3 rounded-full bg-white px-3 py-3 text-left transition-colors hover:bg-[#2c2e2a] hover:text-white"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-medium">
                                {ex.name}
                              </p>
                              <p className="truncate text-[12px] opacity-60">
                                {ex.equipment} · {ex.difficulty}
                              </p>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8ed462] text-[#2c2e2a]">
                              <Icon.Plus size={14} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}