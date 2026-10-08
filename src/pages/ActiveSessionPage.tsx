import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import {
  addExerciseLog,
  fetchSessionLogs,
  finishSession,
  startSession,
  updateSetLog,
  updateExerciseNotes,
  getSessionByDate,
  type ExerciseLogRecord,
  type SetLogRecord,
  type SessionRecord,
} from '@/lib/sessions';
import { fetchWeeklyRoutine } from '@/lib/weekly-routine';
import { EXERCISES } from '@/data/exercises';
import { MUSCLES } from '@/lib/muscles';
import type { Exercise } from '@/types';
import { classNames, dayOfWeekFromDate, formatDuration, toIsoDate } from '@/lib/format';

interface PlannedExercise {
  exercise: Exercise;
  plannedSets: number;
  plannedReps: number;
}

export function ActiveSessionPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [planned, setPlanned] = useState<PlannedExercise[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogRecord[]>([]);
  const [setLogs, setSetLogs] = useState<SetLogRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const today = new Date();
        const todayDow = dayOfWeekFromDate(today);
        const dateIso = toIsoDate(today);

        const routine = await fetchWeeklyRoutine(profile);
        const dayExercises = routine
          .filter((r) => r.day_of_week === todayDow)
          .sort((a, b) => a.position - b.position);

        const plannedList: PlannedExercise[] = dayExercises
          .map((r) => {
            const ex = EXERCISES.find((e) => e.id === r.exercise_id);
            if (!ex) return null;
            return { exercise: ex, plannedSets: r.default_sets, plannedReps: r.default_reps };
          })
          .filter((p): p is PlannedExercise => p !== null);

        if (plannedList.length === 0) {
          if (!cancelled) {
            setError('No planificaste ejercicios hoy. Ve a Rutina primero.');
            setLoading(false);
          }
          return;
        }

        const existing = await getSessionByDate(profile, dateIso);
        const sess = existing ?? (await startSession(profile, dateIso, todayDow));
        if (!sess) return;
        if (!cancelled) setSession(sess);

        let logs = await fetchSessionLogs(sess.id);
        if (logs.exerciseLogs.length === 0) {
          for (let i = 0; i < plannedList.length; i++) {
            const p = plannedList[i];
            const { exerciseLog, setLogs: newSets } = await addExerciseLog(
              sess.id,
              p.exercise.id,
              i,
              p.plannedSets,
              p.plannedReps,
            );
            logs = {
              exerciseLogs: [...logs.exerciseLogs, exerciseLog],
              setLogs: [...logs.setLogs, ...newSets],
            };
          }
        }

        if (cancelled) return;
        setPlanned(plannedList);
        setExerciseLogs(logs.exerciseLogs);
        setSetLogs(logs.setLogs);

        const currentLog = logs.exerciseLogs[currentIndex];
        if (currentLog) setExerciseNotes(currentLog.notes ?? '');
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('No se pudo iniciar la sesión.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, router]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      const started = new Date(session.started_at).getTime();
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const currentPlanned = planned[currentIndex];
  const currentLog = exerciseLogs[currentIndex];
  const currentSets = useMemo(() => {
    if (!currentLog) return [];
    return setLogs
      .filter((s) => s.exercise_log_id === currentLog.id)
      .sort((a, b) => a.set_number - b.set_number);
  }, [currentLog, setLogs]);

  useEffect(() => {
    if (currentLog) setExerciseNotes(currentLog.notes ?? '');
  }, [currentLog]);

  const onChangeSet = async (setId: string, patch: Partial<SetLogRecord>) => {
    setSetLogs((prev) => prev.map((s) => (s.id === setId ? { ...s, ...patch } : s)));
    try {
      await updateSetLog(setId, patch);
    } catch (err) {
      console.error(err);
    }
  };

  const saveNotes = async (notes: string) => {
    if (!currentLog) return;
    setExerciseNotes(notes);
    setExerciseLogs((prev) =>
      prev.map((l) => (l.id === currentLog.id ? { ...l, notes } : l)),
    );
    try {
      await updateExerciseNotes(currentLog.id, notes);
    } catch (err) {
      console.error(err);
    }
  };

  const goNext = () => {
    if (currentIndex < planned.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const finish = async () => {
    if (!session) return;
    try {
      await finishSession(session.id, true);
    } catch (err) {
      console.error(err);
    }
    router.push('/history');
  };

  if (!profile) return null;

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="block h-3 w-3 animate-pulse rounded-full bg-[#2c2e2a]" />
          <p className="t-body text-[#80827f]">Cargando sesión…</p>
        </div>
      </AppShell>
    );
  }

  if (error && planned.length === 0) {
    return (
      <AppShell>
        <Card padding="lg" tone="white" className="mx-auto mt-12 max-w-md text-center">
          <p className="t-body-lg text-[#2c2e2a]">No hay ejercicios hoy</p>
          <p className="mt-2 t-body text-[#80827f]">{error}</p>
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
              Ir a Rutina
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  const totalExercises = planned.length;
  const done = currentIndex >= totalExercises;

  if (done) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="relative">
            <Illustration variant="medal" size={140} className="animate-pop" />
          </div>
          <span className="mt-8 t-eyebrow text-[#80827f]">Sesión completa</span>
          <h1 className="mt-3 t-display text-[#2c2e2a]">¡Hecho!</h1>
          <p className="mt-3 t-body-lg text-[#2c2e2a]/80">
            {totalExercises} {totalExercises === 1 ? 'ejercicio' : 'ejercicios'} · {formatDuration(elapsed)}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              variant="coral"
              size="lg"
              onClick={finish}
              dotColor="sunshine"
            >
              Terminar y ver historial
            </Button>
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="text-[14px] text-[#80827f] hover:text-[#2c2e2a]"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const completedSets = currentSets.filter((s) => s.completed).length;
  const completedAllSets = completedSets === currentSets.length;

  return (
    <AppShell>
      <div className="py-4 md:py-8">
        <header className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/routine')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white hover:bg-[#e0dbce]"
            aria-label="Volver"
          >
            <Icon.ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <span className="t-micro text-[#80827f]">Sesión</span>
            <p className="t-body text-[#2c2e2a] font-semibold tabular-nums">
              {currentIndex + 1} <span className="text-[#80827f]">/ {totalExercises}</span>
            </p>
          </div>
          <div className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#2c2e2a] px-4 text-[13px] font-medium text-white">
            <Icon.Timer size={14} />
            <span className="tabular-nums">{formatDuration(elapsed)}</span>
          </div>
        </header>

        {/* Progress bar */}
        <div className="mb-5 flex gap-1">
          {Array.from({ length: totalExercises }).map((_, i) => (
            <span
              key={i}
              className={classNames(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < currentIndex
                  ? 'bg-[#8ed462]'
                  : i === currentIndex
                    ? 'bg-[#2c2e2a]'
                    : 'bg-[#2c2e2a]/10',
              )}
            />
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_1.1fr] md:gap-6">
          <div className="order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[50px] bg-white">
              <ExerciseMedia
                src={currentPlanned.exercise.gifPath}
                alt={currentPlanned.exercise.name}
                className="h-full w-full object-cover"
                loading="eager"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '0.15';
                }}
              />
            </div>
          </div>

          <div className="order-2 flex flex-col gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag tone="grass" size="sm">
                  {MUSCLES[currentPlanned.exercise.primaryMuscle].label}
                </Tag>
                <Tag tone="sandstone" size="sm">
                  {currentPlanned.plannedSets} × {currentPlanned.plannedReps}
                </Tag>
              </div>
              <h2 className="mt-3 t-heading text-[#2c2e2a]">
                {currentPlanned.exercise.name}
              </h2>
              <p className="mt-2 t-body text-[#2c2e2a]/80">
                {currentPlanned.exercise.description}
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="t-eyebrow text-[#80827f]">
                  Sets · {completedSets} / {currentSets.length}
                </span>
                {completedAllSets ? (
                  <Sparkle size={20} color="#8ed462" />
                ) : null}
              </div>
              <ul className="flex flex-col gap-2">
                {currentSets.map((set, idx) => (
                  <SetRow
                    key={set.id}
                    index={idx + 1}
                    set={set}
                    onChange={(patch) => onChangeSet(set.id, patch)}
                  />
                ))}
              </ul>
            </div>

            <section>
              <span className="t-eyebrow text-[#80827f]">Notas del ejercicio</span>
              <textarea
                value={exerciseNotes}
                onChange={(e) => saveNotes(e.target.value)}
                onBlur={(e) => saveNotes(e.target.value)}
                placeholder="Cómo te sentiste, observaciones…"
                rows={2}
                className="mt-2 w-full rounded-[20px] border-2 border-[#2c2e2a] bg-white p-3 text-[14px] leading-[1.5] text-[#2c2e2a] outline-none placeholder:text-[#80827f] focus:bg-[#f5e211]/10"
              />
            </section>
          </div>
        </div>

        <div className="sticky bottom-20 mt-6 flex items-center justify-between gap-3 pt-4 md:bottom-0 md:bg-transparent md:pt-6">
          <Button
            variant="outline"
            size="md"
            onClick={goPrev}
            disabled={currentIndex === 0}
            iconLeft={<Icon.ChevronLeft size={14} />}
            dotColor="ink"
          >
            Anterior
          </Button>
          <Button
            variant="coral"
            size="md"
            onClick={goNext}
            disabled={!completedAllSets}
            dotColor="sunshine"
            iconRight={
              currentIndex === planned.length - 1 ? (
                <Icon.Check size={14} />
              ) : (
                <Icon.ChevronRight size={14} />
              )
            }
          >
            {currentIndex === planned.length - 1 ? 'Terminar' : 'Siguiente'}
          </Button>
        </div>

        {!completedAllSets ? (
          <p className="mt-3 text-center text-[12px] text-[#80827f]">
            Te faltan {currentSets.length - completedSets} sets para habilitar el siguiente.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

function SetRow({
  index,
  set,
  onChange,
}: {
  index: number;
  set: SetLogRecord;
  onChange: (patch: Partial<SetLogRecord>) => void;
}) {
  const [weight, setWeight] = useState<string>(set.weight_kg?.toString() ?? '');
  const [reps, setReps] = useState<string>(set.reps?.toString() ?? '');

  useEffect(() => {
    setWeight(set.weight_kg?.toString() ?? '');
    setReps(set.reps?.toString() ?? '');
  }, [set.weight_kg, set.reps]);

  const commit = () => {
    const w = weight === '' ? null : Number(weight);
    const r = reps === '' ? null : Number(reps);
    onChange({ weight_kg: w, reps: r });
  };

  return (
    <li
      className={classNames(
        'flex items-center gap-2 rounded-full border-2 bg-white p-2 transition-colors',
        set.completed ? 'border-[#8ed462] bg-[#8ed462]/10' : 'border-[#2c2e2a]/10',
      )}
    >
      <span
        className={classNames(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
          set.completed ? 'bg-[#8ed462] text-[#2c2e2a]' : 'bg-[#f5f1e4] text-[#2c2e2a]',
        )}
      >
        {set.completed ? <Icon.Check size={14} /> : index}
      </span>

      <div className="flex flex-1 items-center gap-1.5">
        <div className="flex-1">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={commit}
            placeholder="0"
            className="h-11 w-full rounded-full border-2 border-[#2c2e2a]/10 bg-white text-center text-[15px] tabular-nums outline-none focus:border-[#2c2e2a]"
            aria-label="Peso en kilos"
          />
          <p className="mt-0.5 text-center text-[9px] tracking-[0.12em] uppercase text-[#80827f]">
            KG
          </p>
        </div>

        <div className="flex-1">
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min={0}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={commit}
            placeholder="0"
            className="h-11 w-full rounded-full border-2 border-[#2c2e2a]/10 bg-white text-center text-[15px] tabular-nums outline-none focus:border-[#2c2e2a]"
            aria-label="Repeticiones"
          />
          <p className="mt-0.5 text-center text-[9px] tracking-[0.12em] uppercase text-[#80827f]">
            REPS
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange({ completed: !set.completed })}
        aria-label={set.completed ? 'Marcar pendiente' : 'Marcar hecho'}
        className={classNames(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          set.completed
            ? 'border-[#8ed462] bg-[#8ed462] text-[#2c2e2a]'
            : 'border-[#2c2e2a]/10 text-[#80827f] hover:border-[#2c2e2a] hover:text-[#2c2e2a]',
        )}
      >
        <Icon.Check size={16} />
      </button>
    </li>
  );
}