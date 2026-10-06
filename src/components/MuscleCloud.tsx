import type { MuscleSummary } from '@/types';
import { MuscleChip } from '@/components/MuscleChip';
import { MUSCLES, MUSCLE_LIST } from '@/lib/muscles';

interface MuscleCloudProps {
  summaries: MuscleSummary[];
}

export function MuscleCloud({ summaries }: MuscleCloudProps) {
  const max = Math.max(1, ...summaries.map((s) => s.count));
  const presentIds = new Set(summaries.map((s) => s.muscle));
  const ordered = [
    ...MUSCLE_LIST.filter((m) => presentIds.has(m.id)),
  ];

  return (
    <div className="rounded-large border border-fog bg-paper p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-forest-ink">Músculos trabajados</h3>
        <span className="text-[12px] uppercase tracking-wider text-pebble">
          {summaries.length} grupos
        </span>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {ordered.length === 0 ? (
          <p className="text-[14px] text-pebble">
            Añade ejercicios a tu rutina para ver los músculos trabajados.
          </p>
        ) : (
          ordered.map((meta) => {
            const summary = summaries.find((s) => s.muscle === meta.id);
            const count = summary?.count ?? 0;
            const ratio = count / max;
            const size = ratio > 0.66 ? 'lg' : ratio > 0.33 ? 'md' : 'sm';
            return (
              <MuscleChip
                key={meta.id}
                muscle={meta.id}
                size={size}
                count={count}
                active={summary?.isPrimary ?? false}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export function computeMuscleSummaries(
  exercises: { exercise: { primaryMuscle: import('@/types').MuscleGroup; secondaryMuscles: import('@/types').MuscleGroup[] } }[],
): MuscleSummary[] {
  const map = new Map<import('@/types').MuscleGroup, { count: number; isPrimary: boolean }>();
  for (const e of exercises) {
    const primary = e.exercise.primaryMuscle;
    const primaryEntry = map.get(primary) ?? { count: 0, isPrimary: false };
    primaryEntry.count += 1;
    primaryEntry.isPrimary = true;
    map.set(primary, primaryEntry);
    for (const sec of e.exercise.secondaryMuscles) {
      const entry = map.get(sec) ?? { count: 0, isPrimary: false };
      entry.count += 0.5;
      map.set(sec, entry);
    }
  }
  return Array.from(map.entries())
    .map(([muscle, info]) => ({ muscle, count: Math.round(info.count * 10) / 10, isPrimary: info.isPrimary }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

export { MUSCLES };