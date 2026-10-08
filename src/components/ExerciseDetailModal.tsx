import { useEffect, useState } from 'react';
import type { Exercise } from '@/types';
import { MUSCLES } from '@/lib/muscles';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { Icon } from '@/components/Icon';
import { Tag } from '@/components/ui/Tag';
import { classNames } from '@/lib/format';

const EQUIPMENT_LABEL: Record<Exercise['equipment'], string> = {
  barra: 'Barra',
  mancuerna: 'Mancuerna',
  maquina: 'Máquina',
  polea: 'Polea',
  'peso-corporal': 'Peso corporal',
  kettlebell: 'Kettlebell',
  banda: 'Banda',
};

const DIFFICULTY_LABEL: Record<Exercise['difficulty'], string> = {
  principiante: 'PRINCIPIANTE',
  intermedio: 'INTERMEDIO',
  avanzado: 'AVANZADO',
};

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  const allMedia = [exercise.gifPath, ...(exercise.extraMediaPaths ?? [])];
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = allMedia[activeMediaIndex];
  const primary = MUSCLES[exercise.primaryMuscle];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-obsidian/40 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-paper text-charcoal md:max-w-[820px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center bg-paper text-forest-ink hover:bg-fog transition-colors"
        >
          <Icon.Close size={16} />
        </button>

        <div className="relative h-[260px] flex-shrink-0 overflow-hidden bg-fog md:h-[320px]">
          <ExerciseMedia
            src={activeMedia}
            alt={exercise.name}
            className="h-full w-full object-cover"
            loading="eager"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
          {allMedia.length > 1 ? (
            <div className="absolute inset-x-3 bottom-3 flex justify-center gap-2">
              {allMedia.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  aria-label={`Ver ángulo ${idx + 1}`}
                  className={classNames(
                    'h-1.5 transition-all',
                    idx === activeMediaIndex ? 'w-6 bg-forest-ink' : 'w-1.5 bg-paper/70 hover:bg-paper',
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Tag tone="invert">{primary.label}</Tag>
              <Tag tone="default">{EQUIPMENT_LABEL[exercise.equipment]}</Tag>
              <Tag tone="muted">{DIFFICULTY_LABEL[exercise.difficulty]}</Tag>
            </div>
            <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-forest-ink md:text-[40px]">
              {exercise.name}
            </h2>
            <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-slate md:text-[15px]">
              {exercise.description}
            </p>
          </div>

          {exercise.muscleImagePath ? (
            <section className="border border-fog p-5">
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Músculos trabajados</p>
              <img
                src={exercise.muscleImagePath}
                alt={`Músculos trabajados en ${exercise.name}`}
                className="mt-3 mx-auto h-auto max-h-[260px] w-full max-w-[420px] object-contain"
                loading="lazy"
              />
            </section>
          ) : null}

          {exercise.secondaryMuscles.length > 0 ? (
            <section>
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Sinergia</p>
              <p className="mt-2 text-[14px] text-forest-ink">
                {exercise.secondaryMuscles.map((m) => MUSCLES[m].label).join(' · ')}
              </p>
            </section>
          ) : null}

          <section>
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Ejecución</p>
            <ol className="mt-3 flex flex-col gap-2">
              {exercise.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-3 border border-fog p-3 text-[14px] leading-[1.5] text-charcoal">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-forest-ink text-[12px] font-semibold text-paper">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {exercise.tips.length > 0 ? (
            <section className="bg-linen-mist p-5">
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-forest-ink">Tips clave</p>
              <ul className="mt-3 flex flex-col gap-2">
                {exercise.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-[14px] leading-[1.55] text-charcoal">
                    <span className="mt-2 h-1 w-1 shrink-0 bg-forest-ink" />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}