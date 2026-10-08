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
          <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-eyebrow text-black/50">Plantilla semanal</p>
              <h1 className="mt-2 text-display-sm text-black md:text-display">Rutina.</h1>
            </div>
            <Button
              variant="primary"
              size="md"
              iconRight={<Icon.Play size={14} />}
              onClick={() => router.push('/routine/active')}
            >
              {hasAnyToday ? `Iniciar ${todayMeta.long}` : 'Iniciar hoy'}
            </Button>
          </header>

          {error ? (
            <div className="mb-4 rounded-[12px] border border-[#f64932] bg-white px-4 py-3 text-[14px] text-[#f64932]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <Card padding="lg" className="text-center">
              <p className="text-[14px] text-black/50">Cargando rutina…</p>
            </Card>
          ) : (
            <>
              {/* Mobile: stacked day cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
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
              <div className="hidden md:grid md:grid-cols-[300px_1fr] md:gap-5">
                <div className="md:h-[calc(100dvh-10rem)] md:sticky md:top-[6.5rem]">
                  <PalettePanel
                    exercises={profileExercises}
                    onPick={(exId) => onAddFromPalette(todayIndex, exId)}
                  />
                </div>
                <Card padding="none" className="overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-black/[0.08]">
                    {DAYS_OF_WEEK.map((d) => {
                      const dayEntries = entries.filter((e) => e.day_of_week === d.id);
                      const isToday = d.id === todayIndex;
                      return (
                        <div
                          key={d.id}
                          className={classNames(
                            'border-r border-black/[0.06] px-3 py-3 last:border-r-0',
                            isToday ? 'bg-[#e6f3fe]' : '',
                          )}
                        >
                          <p
                            className={classNames(
                              'text-[10px] font-medium tracking-[0.12em] uppercase',
                              isToday ? 'text-[#0075de]' : 'text-black/50',
                            )}
                          >
                            {d.short}
                          </p>
                          <p className="mt-1 text-[18px] font-semibold leading-none text-black">
                            {dayEntries.length}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7">
                    {DAYS_OF_WEEK.map((d) => {
                      const dayEntries = entries
                        .filter((e) => e.day_of_week === d.id)
                        .sort((a, b) => a.position - b.position);
                      return (
                        <DesktopDayColumn
                          key={d.id}
                          dayId={d.id}
                          isToday={d.id === todayIndex}
                          entries={dayEntries}
                          onRemove={onRemoveEntry}
                          onSelectExercise={setSelectedExercise}
                        />
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
            <div className="flex items-center gap-2 rounded-[8px] border border-black bg-white px-3 py-2 text-[14px] shadow-lg">
              <span className="font-medium text-black">{draggingPalette.name}</span>
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
        'rounded-[12px] border border-black/[0.08] bg-white p-4',
        isToday ? 'ring-1 ring-[#0075de]/20' : '',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-black">{day.long}</p>
          {isToday ? <Tag tone="sky-tint">Hoy</Tag> : null}
        </div>
        <span className="text-[12px] text-black/50">
          {entries.length} {entries.length === 1 ? 'ej.' : 'ej.'}
        </span>
      </div>

      {entries.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-black/15 py-3 text-[13px] text-black/50 hover:border-black/40 hover:text-black"
        >
          <Icon.Plus size={14} />
          Agregar ejercicio
        </button>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((entry) => {
            const ex = EXERCISES.find((e) => e.id === entry.exercise_id);
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-[8px] border border-black/[0.06] px-2.5 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-[12px] font-medium text-black/60">
                  {entry.position + 1}
                </span>
                <button
                  type="button"
                  onClick={() => ex && onSelectExercise(ex)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[14px] font-medium text-black">
                    {ex?.name ?? entry.exercise_id}
                  </p>
                  <p className="text-[11px] text-black/50">
                    {entry.default_sets} × {entry.default_reps}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-black/40 hover:bg-black/[0.04] hover:text-[#f64932]"
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
              className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-black/15 py-2 text-[12px] text-black/50 hover:border-black/40 hover:text-black"
            >
              <Icon.Plus size={12} />
              Agregar otro
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
        'flex min-h-[420px] flex-col gap-1 border-r border-black/[0.06] p-2 last:border-r-0',
        isOver ? 'bg-[#e6f3fe]' : '',
        isToday ? 'bg-[#e6f3fe]/40' : '',
      )}
    >
      <ul className="flex flex-1 flex-col gap-1">
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
          <li className="flex flex-1 items-center justify-center rounded-md border border-dashed border-black/10 px-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40">
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
      className="group flex items-start gap-1.5 rounded-md border border-black/[0.06] bg-white p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-black/30 hover:text-black active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <Icon.Drag size={12} />
      </button>
      <button
        type="button"
        onClick={() => exercise && onSelectExercise(exercise)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-[12.5px] font-medium leading-[1.25] text-black">
          {exercise?.name ?? entry.exercise_id}
        </p>
        <p className="mt-0.5 text-[10px] text-black/50">
          {entry.default_sets} × {entry.default_reps}
        </p>
      </button>
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        className="text-black/30 opacity-0 hover:text-[#f64932] group-hover:opacity-100"
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
    <Card padding="none" className="flex h-full flex-col">
      <div className="border-b border-black/[0.08] p-4">
        <p className="text-eyebrow text-black/50">Catálogo</p>
        <p className="mt-1 text-[14px] text-[#615d59]">
          Tocá un ejercicio para sumarlo a hoy.
        </p>
        <div className="mt-3">
          <Input
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<Icon.Search size={14} className="text-black/50" />}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {filtered.map((ex) => {
            const primary = MUSCLES[ex.primaryMuscle];
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onPick(ex.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-black">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-black/50">{primary.label}</p>
                  </div>
                  <Icon.Plus size={14} className="text-black/40" />
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[12px] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/[0.08] p-4">
          <div>
            <p className="text-eyebrow text-black/50">Agregar a {day.long}</p>
            <p className="mt-1 text-[16px] font-semibold text-black">Elegí un ejercicio</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
          >
            <Icon.Close size={18} />
          </button>
        </div>
        <div className="border-b border-black/[0.08] p-4">
          <Input
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<Icon.Search size={14} className="text-black/50" />}
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-black/50">
              {takenIds.size > 0
                ? 'Todos los ejercicios de este catálogo ya están en este día.'
                : 'Sin resultados.'}
            </p>
          ) : (
            <ul className="flex flex-col">
              {MUSCLE_LIST.map((m) => {
                const group = filtered.filter(
                  (ex) => ex.primaryMuscle === m.id,
                );
                if (group.length === 0) return null;
                return (
                  <li key={m.id} className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] uppercase text-black/50">
                      {m.label}
                    </p>
                    <ul>
                      {group.map((ex) => (
                        <li key={ex.id}>
                          <button
                            type="button"
                            onClick={() => onPick(ex.id)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-black/[0.04]"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-medium text-black">
                                {ex.name}
                              </p>
                              <p className="truncate text-[12px] text-black/50">
                                {ex.equipment} · {ex.difficulty}
                              </p>
                            </div>
                            <Icon.Plus size={16} className="text-black/40" />
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