import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import { ExerciseCardHome } from '@/components/ExerciseCardHome';
import { fetchWeeklyRoutine } from '@/lib/weekly-routine';
import { listSessions } from '@/lib/sessions';
import {
  DAYS_OF_WEEK,
  classNames,
  dayOfWeekFromDate,
  isRestDay,
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

        const ws = new Date(today);
        ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
        ws.setHours(0, 0, 0, 0);
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

  const today = new Date();
  const todayDow = dayOfWeekFromDate(today);
  const todayMeta = DAYS_OF_WEEK[todayDow];
  const todayExercises = todayEntries
    .map((t) => ({ ...t, exercise: exerciseById(t.exerciseId) }))
    .filter((e): e is { exerciseId: string; sets: number; reps: number; exercise: Exercise } => Boolean(e.exercise));

  const weekDone = weekIso.filter((iso) => doneIso.has(iso)).length;
  const todaysSessionDone = doneIso.has(toIsoDate(today));
  const exerciseCount = EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile as ProfileId)).length;
  const dayNumber = today.getDate();
  const totalReps = todayExercises.reduce((acc, e) => acc + e.sets * e.reps, 0);
  const isRest = isRestDay(todayDow);
  const greeting = isRest
    ? 'Recuperá el cuerpo.'
    : todayExercises.length === 0
      ? 'Descansa hoy.'
      : profile === 'areli'
        ? 'A por ello.'
        : 'Toca entrenar.';

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        {/* Hero — editorial-data */}
        <section className="relative">
          <h1 className="t-display text-[#2c2e2a]">
            {isRest ? 'descanso.' : `${todayMeta.long.toLowerCase()}.`}
          </h1>
          {!isRest ? (
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="t-heading text-[#2c2e2a] tabular-nums">
                {todayExercises.length}{' '}
                <span className="text-[#80827f] text-[20px] font-normal">
                  {todayExercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                </span>
              </span>
              <span className="text-[#80827f]">·</span>
              <span className="t-body text-[#2c2e2a] tabular-nums">
                {totalReps} reps
              </span>
              <span className="text-[#80827f]">·</span>
              <span className="t-body text-[#2c2e2a]">{greeting}</span>
            </div>
          ) : (
            <p className="mt-5 max-w-[44ch] t-body-lg text-[#2c2e2a]">
              {profile === 'areli'
                ? 'Caminata, hidratación, estiramientos. Mañana vuelve el circuito.'
                : 'Estiramientos, agua y descanso. El circuito vuelve mañana.'}
            </p>
          )}
          <div className="absolute right-2 top-1 hidden md:block">
            <span className="t-display text-[#8ed462]/30 leading-none tabular-nums">
              {dayNumber.toString().padStart(2, '0')}
            </span>
          </div>
        </section>

        {/* Today + Streak */}
        <section className="mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
          <Card padding="lg" className="relative overflow-hidden md:col-span-2">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="t-eyebrow text-[#80827f]">Hoy</span>
                {todaysSessionDone ? (
                  <Tag tone="grass" icon={<span className="h-1.5 w-1.5 rounded-full bg-[#2c2e2a]" />}>
                    Sesión hecha
                  </Tag>
                ) : null}
              </div>
              <span className="t-display text-[#2c2e2a] leading-none tabular-nums">
                {dayNumber.toString().padStart(2, '0')}
              </span>
            </div>

            {loading ? (
              <p className="mt-8 text-[16px] text-[#80827f]">Cargando…</p>
            ) : isRest ? (
              <div className="mt-6">
                <h2 className="t-heading text-[#2c2e2a]">Recuperá el cuerpo</h2>
                <p className="mt-2 max-w-[40ch] t-body text-[#2c2e2a]/80">
                  Caminata, hidratación y estiramientos. Mañana el circuito vuelve con todo.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Tag tone="sandstone" size="sm">Caminata</Tag>
                  <Tag tone="sandstone" size="sm">Hidratación</Tag>
                  <Tag tone="sandstone" size="sm">Estiramientos</Tag>
                </div>
              </div>
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
                    iconRight={<Icon.ChevronRight size={14} />}
                    dotColor="grass"
                  >
                    Planificar semana
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="t-body-lg text-[#2c2e2a]/80">
                  <span className="text-[#80827f]">Tienes </span>
                  <span className="t-subheading text-[#2c2e2a]">{todayExercises.length}</span>
                  <span className="text-[#80827f]"> en cola. Pasá el mouse sobre una tarjeta para ver el video.</span>
                </p>
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {todayExercises.map((entry, idx) => (
                    <li key={entry.exercise.id}>
                      <ExerciseCardHome
                        exercise={entry.exercise}
                        sets={entry.sets}
                        reps={entry.reps}
                        position={idx + 1}
                      />
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    variant="coral"
                    size="lg"
                    fullWidth
                    onClick={() => router.push('/routine/active')}
                    dotColor="sunshine"
                    iconRight={<Icon.Play size={14} />}
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
              <span className="t-display text-[#2c2e2a] leading-[0.85] tabular-nums">
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
              const ws = new Date(today);
              ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
              const dayDate = new Date(ws);
              dayDate.setDate(dayDate.getDate() + d.id);
              const iso = toIsoDate(dayDate);
              const isToday = d.id === todayDow;
              const isDone = doneIso.has(iso);
              const isRest = isRestDay(d.id);
              return (
                <div
                  key={d.id}
                  className={classNames(
                    'relative flex flex-col items-center gap-1 rounded-full py-3 transition-colors',
                    isRest
                      ? 'bg-white/60 text-[#80827f] border-2 border-dashed border-[#2c2e2a]/10'
                      : isDone
                        ? 'bg-[#8ed462] text-[#2c2e2a]'
                        : isToday
                          ? 'bg-[#2c2e2a] text-[#f5f1e4]'
                          : 'bg-white text-[#2c2e2a]',
                  )}
                >
                  <span className="t-micro">{d.short}</span>
                  <span className="text-[18px] font-semibold tabular-nums leading-none">
                    {isRest ? '–' : dayDate.getDate()}
                  </span>
                  {isToday ? (
                    <span className="absolute -bottom-1.5 h-1 w-6 rounded-full bg-[#f5e211]" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick links — letter stamp */}
        <section className="mt-10 grid grid-cols-1 gap-3 md:mt-14 md:grid-cols-3 md:gap-4">
          <NavTile
            letter="R"
            title="Rutina"
            description="Calendario semanal, agregar ejercicios"
            path="/routine"
            letterBg="bg-[#2ba0ff]"
            letterColor="text-[#f5f1e4]"
            letterShadow="text-[#2ba0ff]/15"
          />
          <NavTile
            letter="B"
            title="Banco"
            description={`${exerciseCount} ejercicios con técnica`}
            path="/exercises"
            letterBg="bg-[#f5e211]"
            letterColor="text-[#2c2e2a]"
            letterShadow="text-[#f5e211]/30"
          />
          <NavTile
            letter="H"
            title="Historial"
            description="Sesiones, adherencia y progreso"
            path="/history"
            letterBg="bg-[#ff705d]"
            letterColor="text-[#f5f1e4]"
            letterShadow="text-[#ff705d]/20"
          />
        </section>

        {/* Bottom yellow band — editorial tip */}
        <section className="mt-12 rounded-[50px] bg-[#f5e211] px-6 py-6 md:mt-20 md:px-10 md:py-8">
          <div className="flex items-start gap-5">
            <span className="t-display text-[#2c2e2a]/15 leading-[0.8] tabular-nums">
              {(today.getMonth() + 1).toString().padStart(2, '0')}
            </span>
            <div>
              <span className="t-eyebrow text-[#2c2e2a]/70">Tip del día</span>
              <p className="mt-2 t-body-lg text-[#2c2e2a] max-w-[60ch]">
                La consistencia gana a la intensidad. Mejor tres sesiones tranquilas que una heroica.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function NavTile({
  letter,
  title,
  description,
  path,
  letterBg,
  letterColor,
  letterShadow,
}: {
  letter: string;
  title: string;
  description: string;
  path: string;
  letterBg: string;
  letterColor: string;
  letterShadow: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="group relative flex items-center gap-4 overflow-hidden rounded-[50px] border-2 border-[#2c2e2a] bg-white p-4 text-left transition-transform hover:-translate-y-1 md:p-5"
    >
      <span
        aria-hidden
        className={classNames(
          'absolute -right-2 -top-3 select-none t-display leading-none',
          letterShadow,
        )}
      >
        {letter}
      </span>
      <span
        className={classNames(
          'flex h-16 w-16 shrink-0 items-center justify-center rounded-full md:h-20 md:w-20',
          letterBg,
          letterColor,
        )}
      >
        <span className="t-display leading-none">{letter}</span>
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="t-subheading text-[#2c2e2a]">{title}</p>
        <p className="mt-1 t-body-sm text-[#80827f]">{description}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#2c2e2a] transition-colors group-hover:bg-[#2c2e2a] group-hover:text-[#f5f1e4]">
        <Icon.ChevronRight size={14} />
      </span>
    </button>
  );
}
