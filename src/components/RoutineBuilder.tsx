'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Exercise, RoutineExercise } from '@/types';
import { MUSCLES } from '@/lib/muscles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { classNames, formatKg } from '@/lib/format';

interface RoutineBuilderProps {
  items: RoutineExercise[];
  exercisesById: Map<string, Exercise>;
  onReorder: (items: RoutineExercise[]) => void;
  onUpdateItem: (id: string, patch: Partial<RoutineExercise>) => void;
  onRemove: (id: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onStart: () => void;
  disabled?: boolean;
}

export function RoutineBuilder({
  items,
  exercisesById,
  onReorder,
  onUpdateItem,
  onRemove,
  onSelectExercise,
  onStart,
  disabled,
}: RoutineBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({
      ...it,
      position: idx,
    }));
    onReorder(next);
  };

  return (
    <div className="flex flex-col gap-4 rounded-large border border-fog bg-paper p-5 md:p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pebble">
            Tu rutina
          </p>
          <h2 className="text-[24px] font-black leading-[1] tracking-[-0.02em] text-forest-ink md:text-[32px]">
            {items.length} {items.length === 1 ? 'ejercicio' : 'ejercicios'}
          </h2>
        </div>
        {items.length > 0 ? (
          <Pill tone="lime">
            ~{items.reduce((acc, it) => acc + it.sets * (it.reps || 1), 0)} reps
          </Pill>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-pebble bg-fog/40 px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-lime-voltage text-forest-ink">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <p className="text-[16px] font-semibold text-forest-ink">Aún no hay ejercicios</p>
          <p className="mt-1 max-w-[32ch] text-[13px] text-pebble">
            Tocá cualquier ejercicio del banco para verlo y añadirlo a tu rutina.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  index={idx}
                  exercise={exercisesById.get(item.exerciseId)}
                  onUpdate={onUpdateItem}
                  onRemove={onRemove}
                  onSelect={onSelectExercise}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 border-t border-fog bg-paper px-5 py-4 md:-mx-6 md:-mb-6 md:px-6">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={disabled || items.length === 0}
          onClick={onStart}
          iconRight={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          }
        >
          Iniciar rutina
        </Button>
      </div>
    </div>
  );
}

interface SortableRowProps {
  item: RoutineExercise;
  index: number;
  exercise?: Exercise;
  onUpdate: (id: string, patch: Partial<RoutineExercise>) => void;
  onRemove: (id: string) => void;
  onSelect: (exercise: Exercise) => void;
}

function SortableRow({ item, index, exercise, onUpdate, onRemove, onSelect }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const [editingWeight, setEditingWeight] = useState(false);

  if (!exercise) return null;
  const primary = MUSCLES[exercise.primaryMuscle];

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={classNames(
        'group flex items-center gap-3 rounded-card border border-fog bg-paper p-3 transition-all',
        isDragging && 'shadow-xl border-lime-voltage',
      )}
    >
      <button
        type="button"
        aria-label="Reordenar"
        {...attributes}
        {...listeners}
        className="flex h-9 w-9 flex-shrink-0 cursor-grab items-center justify-center rounded-pill bg-fog text-pebble transition hover:bg-linen-mist active:cursor-grabbing"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="9" cy="6" r="1.2" fill="currentColor" />
          <circle cx="15" cy="6" r="1.2" fill="currentColor" />
          <circle cx="9" cy="12" r="1.2" fill="currentColor" />
          <circle cx="15" cy="12" r="1.2" fill="currentColor" />
          <circle cx="9" cy="18" r="1.2" fill="currentColor" />
          <circle cx="15" cy="18" r="1.2" fill="currentColor" />
        </svg>
      </button>

      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-pill bg-forest-ink text-[12px] font-black text-lime-voltage">
        {index + 1}
      </span>

      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-mask bg-fog transition hover:ring-2 hover:ring-lime-voltage"
      >
        <img
          src={exercise.gifPath}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
          }}
        />
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onSelect(exercise)}
          className="block w-full truncate text-left text-[14px] font-semibold text-forest-ink hover:underline"
        >
          {exercise.name}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-pebble">
          <span className="font-semibold uppercase tracking-wider text-forest-ink">{primary.label}</span>
          {exercise.secondaryMuscles.length > 0 ? (
            <span className="truncate">
              + {exercise.secondaryMuscles.slice(0, 2).map((m) => MUSCLES[m].label).join(', ')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NumberField
          value={item.sets}
          label="Sets"
          min={1}
          max={10}
          onChange={(v) => onUpdate(item.id, { sets: v })}
        />
        <NumberField
          value={item.reps}
          label="Reps"
          min={1}
          max={30}
          onChange={(v) => onUpdate(item.id, { reps: v })}
        />
        <button
          type="button"
          onClick={() => setEditingWeight((v) => !v)}
          className="hidden h-9 items-center gap-1 rounded-pill border border-fog bg-paper px-3 text-[12px] font-semibold text-charcoal transition hover:border-forest-ink md:inline-flex"
          aria-label="Editar peso"
        >
          {formatKg(item.weightKg)}
        </button>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Eliminar"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-pill text-pebble transition hover:bg-linen-mist hover:text-alarm-red"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M6 6l12 12M18 6l-12 12" />
        </svg>
      </button>

      {editingWeight ? (
        <div className="absolute right-4 top-full z-20 mt-2 rounded-card border border-fog bg-paper p-3 shadow-xl">
          <Input
            type="number"
            step="0.5"
            min={0}
            placeholder="0"
            value={item.weightKg ?? ''}
            onChange={(e) => {
              const next = e.target.value === '' ? null : Number(e.target.value);
              onUpdate(item.id, { weightKg: next });
            }}
            suffix="KG"
            className="w-32"
            autoFocus
            onBlur={() => setEditingWeight(false)}
          />
        </div>
      ) : null}
    </li>
  );
}

function NumberField({
  value,
  label,
  min,
  max,
  onChange,
}: {
  value: number;
  label: string;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="hidden items-center gap-1 rounded-pill border border-fog bg-paper px-1 md:flex">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-pill text-charcoal transition hover:bg-fog"
        aria-label={`Restar ${label}`}
      >
        −
      </button>
      <div className="flex h-8 min-w-12 flex-col items-center justify-center px-1">
        <span className="text-[12px] font-black text-forest-ink">{value}</span>
        <span className="text-[9px] uppercase tracking-wider text-pebble">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-pill text-charcoal transition hover:bg-fog"
        aria-label={`Sumar ${label}`}
      >
        +
      </button>
    </div>
  );
}