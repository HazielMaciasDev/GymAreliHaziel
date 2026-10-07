
import { useEffect } from 'react';
import type { Exercise } from '@/types';
import { MUSCLES } from '@/lib/muscles';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { ExerciseMedia } from '@/components/ExerciseMedia';

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

const EQUIPMENT_LABEL: Record<Exercise['equipment'], string> = {
  barra: 'Barra',
  mancuerna: 'Mancuerna',
  maquina: 'Máquina',
  polea: 'Polea',
  'peso-corporal': 'Peso corporal',
  kettlebell: 'Kettlebell',
  banda: 'Banda',
};

export function ExerciseDetail({ exercise, onClose, onAdd }: ExerciseDetailProps) {
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

  const primary = MUSCLES[exercise.primaryMuscle];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest-ink/40 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-large bg-paper text-charcoal shadow-xl md:max-w-[820px] md:rounded-large"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-pill bg-paper text-forest-ink shadow-lg transition hover:bg-linen-mist"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>

        <div className="relative h-[260px] flex-shrink-0 overflow-hidden bg-fog md:h-[320px]">
          <ExerciseMedia
            src={exercise.gifPath}
            alt={exercise.name}
            className="h-full w-full object-cover"
            loading="eager"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Pill tone="lime">{primary.label}</Pill>
              {exercise.secondaryMuscles.map((m) => (
                <Pill key={m} tone="mist">
                  {MUSCLES[m].label}
                </Pill>
              ))}
              <Pill tone="dark">{EQUIPMENT_LABEL[exercise.equipment]}</Pill>
              <Pill tone="forest">{exercise.difficulty.toUpperCase()}</Pill>
            </div>
            <h2
              id="exercise-detail-title"
              className="text-[32px] font-black leading-[1] tracking-[-0.02em] text-forest-ink md:text-[44px]"
            >
              {exercise.name}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.55] text-slate">
              {exercise.description}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-pebble">
              Ejecución
            </h3>
            <ol className="space-y-2">
              {exercise.instructions.map((step, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 rounded-card border border-fog bg-paper p-3 text-[14px] leading-[1.5] text-charcoal"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-pill bg-forest-ink text-[12px] font-black text-lime-voltage">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {exercise.tips.length > 0 ? (
            <div className="rounded-card border border-linen-mist bg-linen-mist/40 p-5">
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-forest-ink">
                Tips clave
              </h3>
              <ul className="space-y-2">
                {exercise.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-[14px] leading-[1.55] text-charcoal"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-pill bg-forest-ink" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-t border-fog bg-paper px-6 py-4 md:px-10 md:py-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              onAdd(exercise);
              onClose();
            }}
            iconLeft={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Añadir a mi rutina
          </Button>
        </div>
      </div>
    </div>
  );
}
