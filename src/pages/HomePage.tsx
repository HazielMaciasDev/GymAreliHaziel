import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Illustration, Sparkle } from '@/components/Illustration';
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
  const todaysSessionDone = doneIso.has(toIsoDate(new Date()));
  const exerciseCount = EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile as ProfileId)).length;

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        {/* Hero block */}
        <section className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="t-eyebrow text-[#80827f]">{formatDateLong(toIsoDate(new Date()))}</span>
            {todaysSessionDone ? (
              <Tag tone="grass" icon={<span className="h-1.5 w-1.5 rounded-full bg-[#2c2e2a]" />}>
                Sesión hecha
              </Tag>
            ) : null}
          </div>
          <h1 className="mt-4 t-display text-[#2c2e2a]">
            {todayMeta.long.toLowerCase()}.
          </h1>
          <p className="mt-4 max-w-[44ch] t-body-lg text-[#2c2e2a]">
            {profile === 'areli'
              ? 'Más fuerte que tus excusas. Hoy toca entrenar.'
              : 'El músculo crece cuando descansas. Pero hoy toca sesión.'}
          </p>
          <div className="absolute -right-2 -top-2 hidden md:block">
            <Illustration variant="leaves" size={80} className="animate-float" />
          </div>
        </section>

        {/* Today + Streak */}
        <section className="mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
          <Card padding="lg" className="md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="t-eyebrow text-[#80827f]">Hoy</span>
              <Illustration variant="dumbbell" size={48} />
            </div>
            {loading ? (
              <p className="mt-8 text-[16px] text-[#80827f]">Cargando…</p>
            ) : todayExercises.length === 0 ? (
              <div className="mt-6">
                <h2 className="t-heading text-[#2c2e2a]">Día libre</h2>
                <p className="mt-2 max-w-[36ch] t-body text-[#2c2e2a]/80">
                  No planificaste ejercicios para hoy. Ve a Rutina para armar tu semana.
                </p>
                <div className="mt-6">
                  <Button
                    variant="dark"
                    size="lg"
                    onClick={() => router.push('/routine')}
                    iconRight={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    }
                    dotColor="grass"
                  >
                    Planificar semana
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="t-body-lg text-[#2c2e2a]/80">
                  <span className="t-display text-[#2c2e2a] align-middle">{todayExercises.length}</span>{' '}
                  {todayExercises.length === 1 ? 'ejercicio' : 'ejercicios'} hoy
                </p>
                <ul className="mt-5 flex flex-col gap-2">
                  {todayExercises.slice(0, 3).map((entry) => (
                    <li
                      key={entry.exercise.id}
                      className="flex items-center justify-between gap-3 rounded-full bg-[#f5f1e4] px-4 py-2.5"
                    >
                      <span className="truncate text-[15px] font-medium text-[#2c2e2a]">
                        {entry.exercise.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[12px] font-medium tabular-nums text-[#2c2e2a]">
                        {entry.sets} × {entry.reps}
                      </span>
                    </li>
                  ))}
                  {todayExercises.length > 3 ? (
                    <li className="px-4 text-[13px] text-[#80827f]">+ {todayExercises.length - 3} más</li>
                  ) : null}
                </ul>
                <div className="mt-6">
                  <Button
                    variant="coral"
                    size="lg"
                    fullWidth
                    onClick={() => router.push('/routine/active')}
                    dotColor="sunshine"
                    iconRight={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M7 5v14l11-7z" />
                      </svg>
                    }
                  >
                    Empezar rutina
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card padding="lg" tone="grass" className="relative overflow-hidden">
            <span className="t-eyebrow text-[#2c2e2a]/70">Racha</span>
            <div className="mt-3 flex items-end gap-2">
              <span className="t-display text-[#2c2e2a] leading-[0.85]">
                {streak}
              </span>
              <span className="mb-2 t-body-lg text-[#2c2e2a]/80">
                {streak === 1 ? 'día' : 'días'}
              </span>
            </div>
            <p className="mt-3 t-body text-[#2c2e2a]/80">
              {streak === 0
                ? 'Hoy puedes empezar tu primera racha.'
                : 'Vas volando, no la dejes caer.'}
            </p>
            <div className="absolute -right-3 -top-2 opacity-90">
              <Sparkle size={36} color="#f5e211" />
            </div>
          </Card>
        </section>

        {/* Week pills */}
        <section className="mt-8 md:mt-12">
          <div className="mb-3 flex items-end justify-between">
            <span className="t-eyebrow text-[#80827f]">Esta semana</span>
            <span className="t-eyebrow text-[#2c2e2a]">
              {weekDone}<span className="text-[#80827f]">/{planned}</span>
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {DAYS_OF_WEEK.map((d) => {
              const ws = startOfWeek(new Date());
              const dayDate = new Date(ws);
              dayDate.setDate(dayDate.getDate() + d.id);
              const iso = toIsoDate(dayDate);
              const isToday = d.id === todayDow;
              const isDone = doneIso.has(iso);
              return (
                <div
                  key={d.id}
                  className={classNames(
                    'flex flex-col items-center gap-1 rounded-full py-3 transition-colors',
                    isDone
                      ? 'bg-[#8ed462] text-[#2c2e2a]'
                      : isToday
                        ? 'bg-[#2c2e2a] text-white'
                        : 'bg-white text-[#2c2e2a]',
                  )}
                >
                  <span className="t-micro">{d.short}</span>
                  <span className="text-[18px] font-semibold tabular-nums leading-none">
                    {dayDate.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick links */}
        <section className="mt-10 grid grid-cols-1 gap-3 md:mt-14 md:grid-cols-3 md:gap-4">
          <NavTile
            title="Rutina"
            description="Calendario semanal, agregar ejercicios"
            path="/routine"
            tone="sky"
            icon="plate"
          />
          <NavTile
            title="Banco"
            description={`${exerciseCount} ejercicios con técnica`}
            path="/exercises"
            tone="sunshine"
            icon="leaves"
          />
          <NavTile
            title="Historial"
            description="Sesiones, adherencia y progreso"
            path="/history"
            tone="coral"
            icon="cup"
          />
        </section>

        {/* Bottom yellow band */}
        <section className="mt-12 rounded-[50px] bg-[#f5e211] px-6 py-6 md:mt-20 md:px-10 md:py-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="t-eyebrow text-[#2c2e2a]/70">Tip del día</span>
              <p className="mt-2 t-body-lg text-[#2c2e2a] max-w-[60ch]">
                La consistencia gana a la intensidad. Mejor tres sesiones tranquilas que una heroica.
              </p>
            </div>
            <Illustration variant="sun" size={64} className="shrink-0" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function NavTile({
  title,
  description,
  path,
  tone,
  icon,
}: {
  title: string;
  description: string;
  path: string;
  tone: 'sky' | 'sunshine' | 'coral';
  icon: 'plate' | 'leaves' | 'cup' | 'kettle' | 'dumbbell' | 'medal' | 'shoe' | 'star' | 'wave' | 'arrow' | 'sun';
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="group flex items-center gap-4 rounded-[50px] border-2 border-[#2c2e2a] bg-white p-4 text-left transition-transform hover:-translate-y-1 md:p-5"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full md:h-20 md:w-20">
        <Illustration variant={icon} size={64} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="t-subheading text-[#2c2e2a]">{title}</p>
        <p className="mt-1 t-body-sm text-[#80827f]">{description}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#2c2e2a] transition-colors group-hover:bg-[#2c2e2a] group-hover:text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}