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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2c2e2a]/40 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={exercise.name}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[50px] bg-[#f5f1e4] md:max-w-[860px] md:rounded-[50px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2c2e2a] hover:bg-[#e0dbce]"
        >
          <Icon.Close size={18} />
        </button>

        <div className="relative h-[260px] flex-shrink-0 overflow-hidden bg-white md:h-[340px]">
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
            <div className="absolute inset-x-3 bottom-4 flex justify-center gap-1.5">
              {allMedia.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  aria-label={`Ver ángulo ${idx + 1}`}
                  className={classNames(
                    'h-2 rounded-full transition-all',
                    idx === activeMediaIndex ? 'w-8 bg-[#2c2e2a]' : 'w-2 bg-[#2c2e2a]/30 hover:bg-[#2c2e2a]/50',
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Tag tone="grass" size="sm">{primary.label}</Tag>
              <Tag tone="sandstone" size="sm">{EQUIPMENT_LABEL[exercise.equipment]}</Tag>
              <Tag tone="sandstone" size="sm">{exercise.difficulty}</Tag>
            </div>
            <h2 className="t-heading text-[#2c2e2a]">{exercise.name}</h2>
            <p className="mt-3 max-w-[60ch] t-body-lg text-[#2c2e2a]">
              {exercise.description}
            </p>
          </div>

          {exercise.muscleImagePath ? (
            <section className="rounded-[50px] bg-white p-5 md:p-6">
              <span className="t-eyebrow text-[#80827f]">Músculos trabajados</span>
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
              <span className="t-eyebrow text-[#80827f]">Sinergia</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exercise.secondaryMuscles.map((m) => (
                  <Tag key={m} tone="sandstone" size="sm">{MUSCLES[m].label}</Tag>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <span className="t-eyebrow text-[#80827f]">Ejecución</span>
            <ol className="mt-3 flex flex-col gap-2">
              {exercise.instructions.map((step, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 rounded-[25px] bg-white p-4 t-body text-[#2c2e2a]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5e211] text-[13px] font-semibold text-[#2c2e2a]">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {exercise.tips.length > 0 ? (
            <section className="rounded-[50px] bg-[#f5e211] p-5 md:p-6">
              <span className="t-eyebrow text-[#2c2e2a]">Tips clave</span>
              <ul className="mt-3 flex flex-col gap-2.5">
                {exercise.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2.5 t-body text-[#2c2e2a]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2c2e2a]" />
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