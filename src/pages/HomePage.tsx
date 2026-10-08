import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { fetchWeeklyRoutine } from '@/lib/weekly-routine';
import { getSessionByDate, listSessions } from '@/lib/sessions';
import {
  DAYS_OF_WEEK,
  classNames,
  dayOfWeekFromDate,
  formatDateLong,
  startOfWeek,
  toIsoDate,
} from '@/lib/format';
import { EXERCISES } from '@/data/exercises';
import type { Exercise, ProfileId } from '@/types';

function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function HomePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [todayEntries, setTodayEntries] = useState<{ exerciseId: string; sets: number; reps: number }[]>([]);
  const [weekIso, setWeekIso] = useState<string[]>([]);
  const [planned, setPlanned] = useState(0);
  const [doneIso, setDoneIso] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const routine = await fetchWeeklyRoutine(profile);
        const today = new Date();
        const todayDow = dayOfWeekFromDate(today);
        const todayList = routine
          .filter((r) => r.day_of_week === todayDow)
          .sort((a, b) => a.position - b.position)
          .map((r) => ({ exerciseId: r.exercise_id, sets: r.default_sets, reps: r.default_reps }));
        if (!cancelled) setTodayEntries(todayList);

        const ws = startOfWeek(today);
        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(ws);
          d.setDate(d.getDate() + i);
          weekDates.push(toIsoDate(d));
        }
        if (!cancelled) setWeekIso(weekDates);

        const plannedDays = new Set<number>();
        for (const r of routine) plannedDays.add(r.day_of_week);
        if (!cancelled) setPlanned(plannedDays.size);

        const sessions = await listSessions(profile, 60);
        const completed = new Set(sessions.filter((s) => s.completed).map((s) => s.routine_date));
        if (!cancelled) setDoneIso(completed);

        let s = 0;
        for (let i = 0; i < 60; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const iso = toIsoDate(d);
          if (completed.has(iso)) s += 1;
          else break;
        }
        if (!cancelled) setStreak(s);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, router]);

  if (!profile) return null;

  const todayDow = dayOfWeekFromDate(new Date());
  const todayMeta = DAYS_OF_WEEK[todayDow];
  const todayExercises = todayEntries
    .map((t) => ({ ...t, exercise: exerciseById(t.exerciseId) }))
    .filter((e): e is { exerciseId: string; sets: number; reps: number; exercise: Exercise } => Boolean(e.exercise));

  const weekDone = weekIso.filter((iso) => doneIso.has(iso)).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 md:mb-12">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
            {formatDateLong(toIsoDate(new Date()))}
          </p>
          <h1 className="mt-3 font-display text-[clamp(40px,6vw,72px)] leading-[0.95] text-forest-ink">
            {todayMeta.long.toUpperCase()}
          </h1>
        </header>

        <section className="grid gap-4 md:grid-cols-3 md:gap-6">
          <Card padding="lg">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Hoy</p>
            {loading ? (
              <p className="mt-4 text-[13px] text-pebble">Cargando…</p>
            ) : todayExercises.length === 0 ? (
              <>
                <p className="mt-4 text-[24px] font-semibold text-forest-ink">Día libre</p>
                <p className="mt-2 text-[13px] leading-[1.5] text-slate">
                  No planificaste ejercicios para hoy. Andá a Rutina para armar tu semana.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  className="mt-5"
                  onClick={() => router.push('/routine')}
                >
                  Planificar semana
                </Button>
              </>
            ) : (
              <>
                <p className="mt-4 text-[32px] font-semibold leading-[1] text-forest-ink">
                  {todayExercises.length}
                  <span className="ml-2 text-[14px] font-normal text-slate">
                    {todayExercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                  </span>
                </p>
                <ul className="mt-4 flex flex-col gap-1.5">
                  {todayExercises.slice(0, 3).map((entry) => (
                    <li key={entry.exercise.id} className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate text-forest-ink">{entry.exercise.name}</span>
                      <span className="shrink-0 text-pebble">
                        {entry.sets} × {entry.reps}
                      </span>
                    </li>
                  ))}
                  {todayExercises.length > 3 ? (
                    <li className="text-[12px] text-pebble">
                      + {todayExercises.length - 3} más
                    </li>
                  ) : null}
                </ul>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  className="mt-6"
                  iconRight={<Icon.Play size={16} />}
                  onClick={() => router.push('/routine/active')}
                >
                  Empezar rutina
                </Button>
              </>
            )}
          </Card>

          <Card padding="lg">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Racha</p>
            <p className="mt-4 text-[32px] font-semibold leading-[1] text-forest-ink">
              {streak}
              <span className="ml-2 text-[14px] font-normal text-slate">
                {streak === 1 ? 'día seguido' : 'días seguidos'}
              </span>
            </p>
            <p className="mt-3 text-[13px] leading-[1.5] text-slate">
              Días consecutivos con sesión completada.
            </p>
          </Card>

          <Card padding="lg">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Esta semana</p>
            <p className="mt-4 text-[32px] font-semibold leading-[1] text-forest-ink">
              {weekDone}<span className="text-[16px] font-normal text-pebble"> / {planned}</span>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {DAYS_OF_WEEK.map((d) => {
                const ws = startOfWeek(new Date());
                const dayDate = new Date(ws);
                dayDate.setDate(dayDate.getDate() + d.id);
                const iso = toIsoDate(dayDate);
                const isToday = d.id === todayDow;
                const isDone = doneIso.has(iso);
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className={classNames(
                      'w-8 text-[10px] font-medium tracking-[0.12em] uppercase',
                      isToday ? 'text-forest-ink' : 'text-pebble',
                    )}>
                      {d.short}
                    </span>
                    <span className="flex-1 h-1.5 bg-fog">
                      <span
                        className={classNames(
                          'block h-full transition-all',
                          isDone ? 'bg-forest-ink' : isToday ? 'bg-lime-voltage' : '',
                        )}
                        style={{ width: isDone ? '100%' : isToday ? '40%' : '0%' }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
          <NavTile label="Rutina" subtitle="Calendario semanal" path="/routine" />
          <NavTile
            label="Banco"
            subtitle={`${EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile)).length} ejercicios`}
            path="/exercises"
          />
          <NavTile label="Historial" subtitle="Sesiones + progreso" path="/history" />
        </section>
      </div>
    </AppShell>
  );
}

function NavTile({ label, subtitle, path }: { label: string; subtitle: string; path: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="group flex items-center justify-between border border-fog bg-paper p-5 text-left transition-colors hover:border-forest-ink"
    >
      <div>
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">{subtitle}</p>
        <p className="mt-2 text-[20px] font-semibold text-forest-ink">{label}</p>
      </div>
      <Tag tone="default" icon={<Icon.ChevronRight size={12} />}>Ir</Tag>
    </button>
  );
}