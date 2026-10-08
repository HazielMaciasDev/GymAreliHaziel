import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import { DAYS_OF_WEEK, classNames, dayOfWeekFromDate } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { EXERCISES } from '@/data/exercises';
import type { Exercise } from '@/types';
import type { WeeklyRoutineEntry } from '@/lib/weekly-routine';

interface WeekCalendarProps {
  entries: WeeklyRoutineEntry[];
  todayIndex: number;
  activeDay: number | null;
  onSelectDay: (day: number) => void;
  onRemoveEntry: (id: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export function WeekCalendar({
  entries,
  todayIndex,
  activeDay,
  onSelectDay,
  onRemoveEntry,
  onSelectExercise,
}: WeekCalendarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-fog md:gap-0">
        {DAYS_OF_WEEK.map((d) => {
          const dayEntries = entries
            .filter((e) => e.day_of_week === d.id)
            .sort((a, b) => a.position - b.position);
          const isToday = d.id === todayIndex;
          const isActive = activeDay === d.id;
          return (
            <DayHeader
              key={d.id}
              day={d}
              count={dayEntries.length}
              isToday={isToday}
              isActive={isActive}
              onSelect={() => onSelectDay(d.id)}
            />
          );
        })}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-2 md:grid-cols-7 md:gap-0 md:p-0">
        {DAYS_OF_WEEK.map((d) => {
          const dayEntries = entries
            .filter((e) => e.day_of_week === d.id)
            .sort((a, b) => a.position - b.position);
          return (
            <DayColumn
              key={d.id}
              dayId={d.id}
              entries={dayEntries}
              onRemove={onRemoveEntry}
              onSelectExercise={onSelectExercise}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayHeader({
  day,
  count,
  isToday,
  isActive,
  onSelect,
}: {
  day: { id: number; short: string; long: string };
  count: number;
  isToday: boolean;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={classNames(
        'flex flex-col items-start border-b-2 px-3 py-3 transition-colors md:border-b-2 md:border-r md:px-4 md:py-4',
        isActive
          ? 'border-forest-ink text-forest-ink'
          : isToday
            ? 'border-lime-voltage text-forest-ink'
            : 'border-transparent text-pebble hover:text-forest-ink',
      )}
    >
      <span className="text-[10px] font-medium tracking-[0.18em] uppercase">{day.short}</span>
      <span className="mt-1 text-[20px] font-semibold leading-none">{count}</span>
      <span className="mt-1 text-[10px] tracking-[0.08em] uppercase text-pebble">
        {count === 1 ? 'ejercicio' : 'ejercicios'}
      </span>
    </button>
  );
}

function DayColumn({
  dayId,
  entries,
  onRemove,
  onSelectExercise,
}: {
  dayId: number;
  entries: WeeklyRoutineEntry[];
  onRemove: (id: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayId}`,
    data: { type: 'day', dayOfWeek: dayId },
  });

  return (
    <div
      ref={setNodeRef}
      data-drag-over={isOver ? '' : undefined}
      className={classNames(
        'flex min-h-[140px] flex-col gap-1 border border-transparent p-2 transition-colors md:min-h-[420px] md:border-r md:border-fog md:p-3',
        isOver ? 'bg-linen-mist' : '',
      )}
    >
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-1 flex-col gap-1">
          {entries.map((entry) => (
            <DayEntry
              entry={entry}
              onRemove={onRemove}
              onSelectExercise={onSelectExercise}
            />
          ))}
          {entries.length === 0 ? (
            <li className="flex flex-1 items-center justify-center border border-dashed border-fog text-center text-[11px] tracking-[0.08em] uppercase text-pebble">
              Arrastrá acá
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </div>
  );
}

function DayEntry({
  entry,
  onRemove,
  onSelectExercise,
}: {
  entry: WeeklyRoutineEntry;
  onRemove: (id: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    data: { type: 'routine', entry },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const exercise = EXERCISES.find((e) => e.id === entry.exercise_id);

  return (
    <li ref={setNodeRef} style={style}>
      <div className="group flex items-start gap-2 border border-fog bg-paper p-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-pebble hover:text-forest-ink active:cursor-grabbing"
          aria-label="Reordenar"
        >
          <Icon.Drag size={14} />
        </button>
        <button
          type="button"
          onClick={() => exercise && onSelectExercise(exercise)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-[13px] font-medium text-forest-ink leading-[1.3]">
            {exercise?.name ?? entry.exercise_id}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.08em] uppercase text-pebble">
            {entry.default_sets} × {entry.default_reps}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          className="text-pebble opacity-0 transition-opacity hover:text-alarm-red group-hover:opacity-100"
          aria-label="Quitar"
        >
          <Icon.Trash size={13} />
        </button>
      </div>
    </li>
  );
}

export function todayDayIndex(): number {
  return dayOfWeekFromDate(new Date());
}

export function reorderInDay(
  entries: WeeklyRoutineEntry[],
  dayId: number,
  activeId: string,
  overId: string,
): WeeklyRoutineEntry[] {
  const dayEntries = entries
    .filter((e) => e.day_of_week === dayId)
    .sort((a, b) => a.position - b.position);
  const oldIndex = dayEntries.findIndex((e) => e.id === activeId);
  const newIndex = dayEntries.findIndex((e) => e.id === overId);
  if (oldIndex === -1 || newIndex === -1) return entries;
  const reordered = arrayMove(dayEntries, oldIndex, newIndex);
  const otherEntries = entries.filter((e) => e.day_of_week !== dayId);
  return [
    ...otherEntries,
    ...reordered.map((e, idx) => ({ ...e, position: idx })),
  ];
}

export type { ReactNode };