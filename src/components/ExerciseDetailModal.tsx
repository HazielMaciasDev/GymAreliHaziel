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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={exercise.name}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[12px] bg-white text-black md:max-w-[860px] md:rounded-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-black/5"
        >
          <Icon.Close size={18} />
        </button>

        <div className="relative h-[240px] flex-shrink-0 overflow-hidden bg-black/[0.04] md:h-[340px]">
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
            <div className="absolute inset-x-3 bottom-3 flex justify-center gap-1.5">
              {allMedia.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  aria-label={`Ver ángulo ${idx + 1}`}
                  className={classNames(
                    'h-1.5 rounded-full transition-all',
                    idx === activeMediaIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90',
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 md:p-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Tag tone="marigold">{primary.label}</Tag>
              <Tag tone="muted">{EQUIPMENT_LABEL[exercise.equipment]}</Tag>
              <Tag tone="muted">{exercise.difficulty}</Tag>
            </div>
            <h2 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-black md:text-[40px]">
              {exercise.name}
            </h2>
            <p className="mt-3 max-w-[60ch] font-serif text-[18px] leading-[1.56] text-[#615d59]">
              {exercise.description}
            </p>
          </div>

          {exercise.muscleImagePath ? (
            <section className="rounded-[12px] border border-black/[0.08] p-5">
              <p className="text-eyebrow text-black/50">Músculos trabajados</p>
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
              <p className="text-eyebrow text-black/50">Sinergia</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exercise.secondaryMuscles.map((m) => (
                  <Tag key={m} tone="muted">{MUSCLES[m].label}</Tag>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <p className="text-eyebrow text-black/50">Ejecución</p>
            <ol className="mt-3 flex flex-col gap-2">
              {exercise.instructions.map((step, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 rounded-[12px] border border-black/[0.08] p-3.5 text-[15px] leading-[1.5] text-black"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6f3fe] text-[12px] font-semibold text-[#0075de]">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {exercise.tips.length > 0 ? (
            <section className="rounded-[12px] bg-[#fff7d6] p-5">
              <p className="text-eyebrow text-black">Tips clave</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {exercise.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2.5 text-[15px] leading-[1.5] text-black">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
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