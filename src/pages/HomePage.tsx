import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { fetchWeeklyRoutine } from '@/lib/weekly-routine';
import { listSessions } from '@/lib/sessions';
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
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    setProfileName(profile === 'areli' ? 'Areli' : 'Haziel');
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
  const todaysSessionDone = doneIso.has(toIsoDate(new Date()));

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <header className="mb-8 md:mb-12">
          <p className="text-eyebrow text-black/50">
            {formatDateLong(toIsoDate(new Date()))}
          </p>
          <h1 className="mt-3 text-display-sm text-black md:text-display">
            {todayMeta.long}.
          </h1>
          <p className="mt-4 max-w-[44ch] font-serif text-[18px] leading-[1.56] text-[#615d59]">
            {profileName === 'Areli'
              ? 'Más fuerte que tus excusas. Vamos por la semana.'
              : 'El día que descanses, tu músculo crece. Hacé la sesión.'}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 md:gap-5">
          <Card padding="md" className="md:col-span-2 md:row-span-1">
            <div className="flex items-start justify-between">
              <p className="text-eyebrow text-black/50">Hoy</p>
              {todaysSessionDone ? <Tag tone="sky-tint">Hecha</Tag> : null}
            </div>
            {loading ? (
              <p className="mt-6 text-[14px] text-black/50">Cargando…</p>
            ) : todayExercises.length === 0 ? (
              <div className="mt-6">
                <p className="text-[24px] font-semibold leading-[1.1] text-black">Día libre</p>
                <p className="mt-2 text-[14px] leading-[1.5] text-[#615d59]">
                  No planificaste ejercicios para hoy. Andá a Rutina para armar tu semana.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-6"
                  onClick={() => router.push('/routine')}
                  iconRight={<Icon.ChevronRight size={14} />}
                >
                  Planificar semana
                </Button>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-[14px] text-[#615d59]">
                  <span className="text-[40px] font-semibold leading-[0.95] tracking-[-0.02em] text-black">
                    {todayExercises.length}
                  </span>{' '}
                  {todayExercises.length === 1 ? 'ejercicio' : 'ejercicios'} programados
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {todayExercises.slice(0, 3).map((entry) => (
                    <li
                      key={entry.exercise.id}
                      className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-2.5 last:border-b-0"
                    >
                      <span className="truncate text-[15px] font-medium text-black">
                        {entry.exercise.name}
                      </span>
                      <span className="shrink-0 text-[12px] tabular-nums text-black/50">
                        {entry.sets} × {entry.reps}
                      </span>
                    </li>
                  ))}
                  {todayExercises.length > 3 ? (
                    <li className="text-[12px] text-black/50">
                      + {todayExercises.length - 3} más
                    </li>
                  ) : null}
                </ul>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mt-6"
                  iconRight={<Icon.ChevronRight size={14} />}
                  onClick={() => router.push('/routine/active')}
                >
                  Empezar rutina
                </Button>
              </div>
            )}
          </Card>

          <div className="grid gap-4 md:gap-5">
            <Card padding="md" accent="marigold">
              <p className="text-eyebrow text-black/60">Racha</p>
              <p className="mt-3 text-[44px] font-semibold leading-[0.95] tracking-[-0.02em] text-black">
                {streak}
              </p>
              <p className="mt-2 text-[14px] text-black/70">
                {streak === 0
                  ? 'Empezá hoy tu racha.'
                  : streak === 1
                    ? 'día seguido. Vamos.'
                    : 'días seguidos.'}
              </p>
            </Card>

            <Card padding="md">
              <p className="text-eyebrow text-black/50">Esta semana</p>
              <p className="mt-3 text-[28px] font-semibold leading-[0.95] tracking-[-0.02em] text-black">
                {weekDone}
                <span className="text-[16px] font-normal text-black/40"> / {planned}</span>
              </p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const ws = startOfWeek(new Date());
                  const dayDate = new Date(ws);
                  dayDate.setDate(dayDate.getDate() + d.id);
                  const iso = toIsoDate(dayDate);
                  const isToday = d.id === todayDow;
                  const isDone = doneIso.has(iso);
                  return (
                    <li key={d.id} className="flex items-center gap-2.5 text-[11px]">
                      <span
                        className={classNames(
                          'w-8 font-medium tracking-[0.12em] uppercase',
                          isToday ? 'text-[#0075de]' : 'text-black/50',
                        )}
                      >
                        {d.short}
                      </span>
                      <span className="h-1.5 flex-1 rounded-full bg-black/[0.06]">
                        <span
                          className={classNames(
                            'block h-full rounded-full transition-all',
                            isDone ? 'bg-[#0075de]' : isToday ? 'bg-[#0075de]/30' : 'bg-transparent',
                          )}
                          style={{ width: isDone ? '100%' : isToday ? '40%' : '0%' }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </section>

        <section className="mt-10">
          <p className="text-eyebrow text-black/50">Andá a</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
            <NavTile
              label="Rutina"
              description="Calendario semanal y arrastre de ejercicios"
              path="/routine"
              icon="Calendar"
            />
            <NavTile
              label="Banco"
              description={`${EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile as ProfileId)).length} ejercicios con video y técnica`}
              path="/exercises"
              icon="Library"
            />
            <NavTile
              label="Historial"
              description="Sesiones pasadas, adherencia y progreso"
              path="/history"
              icon="History"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function NavTile({
  label,
  description,
  path,
  icon,
}: {
  label: string;
  description: string;
  path: string;
  icon: keyof typeof Icon;
}) {
  const router = useRouter();
  const IconComp = Icon[icon];
  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="group flex h-full flex-col items-start justify-between gap-6 rounded-[12px] border border-black/[0.08] bg-white p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:border-black/20 md:p-6"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f3fe] text-[#0075de]">
        <IconComp size={18} />
      </span>
      <div className="w-full">
        <p className="text-[18px] font-semibold leading-[1.1] text-black">{label}</p>
        <p className="mt-1 text-[13px] leading-[1.45] text-[#615d59]">{description}</p>
      </div>
    </button>
  );
}