import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/Icon';
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
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    if (hasInitialized) return;
    setHasInitialized(true);

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
            setError('No planificaste ejercicios hoy. Andá a planificar primero.');
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
  }, [profile, router, hasInitialized]);

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
      setError('No se pudo guardar el set.');
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
        <div className="flex h-[60vh] items-center justify-center text-[14px] text-pebble">
          Cargando sesión…
        </div>
      </AppShell>
    );
  }

  if (error && planned.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-12 text-center">
          <p className="text-[14px] text-slate">{error}</p>
          <Button
            variant="primary"
            size="md"
            className="mt-6"
            onClick={() => router.push('/routine')}
          >
            Ir a Rutina
          </Button>
        </div>
      </AppShell>
    );
  }

  const completedSets = currentSets.filter((s) => s.completed).length;
  const totalExercises = planned.length;
  const done = currentIndex >= totalExercises;

  if (done) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Sesión completa</p>
          <h1 className="mt-3 font-display text-[clamp(56px,8vw,96px)] leading-[0.9] text-forest-ink">HECHO</h1>
          <p className="mt-4 text-[14px] text-slate">
            {totalExercises} ejercicios · {formatDuration(elapsed)}
          </p>
          <Button variant="primary" size="lg" className="mt-8" onClick={finish}>
            Terminar y ver historial
          </Button>
        </div>
      </AppShell>
    );
  }

  const completedAllSets = completedSets === currentSets.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6 md:py-10">
        <header className="mb-6 flex items-center justify-between border-b border-fog pb-4">
          <div>
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Ejercicio</p>
            <p className="mt-1 text-[24px] font-semibold leading-none text-forest-ink md:text-[28px]">
              {currentIndex + 1} <span className="text-pebble">/ {totalExercises}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 border border-fog px-3 py-2 text-[12px] text-forest-ink">
            <Icon.Timer size={14} />
            <span className="font-medium tabular-nums">{formatDuration(elapsed)}</span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden bg-fog">
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

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
                {currentPlanned.exercise.primaryMuscle.toUpperCase()}
              </p>
              <h2 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-forest-ink md:text-[32px]">
                {currentPlanned.exercise.name}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.5] text-slate">
                {currentPlanned.exercise.description}
              </p>
            </div>

            <div className="border-t border-fog pt-5">
              <div className="mb-3 flex items-end justify-between">
                <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
                  Sets · {completedSets} / {currentSets.length}
                </p>
                <p className="text-[10px] tracking-[0.08em] uppercase text-pebble">
                  Objetivo {currentPlanned.plannedSets} × {currentPlanned.plannedReps}
                </p>
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

            <section className="border-t border-fog">
              <p className="mt-5 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Notas del ejercicio</p>
              <textarea
                value={exerciseNotes}
                onChange={(e) => saveNotes(e.target.value)}
                onBlur={(e) => saveNotes(e.target.value)}
                placeholder="Cómo te sentiste, observaciones…"
                rows={3}
                className="mt-3 w-full border border-fog bg-paper p-3 text-[14px] leading-[1.5] text-forest-ink outline-none placeholder:text-pebble focus:border-forest-ink"
              />
            </section>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" size="md" onClick={goPrev} disabled={currentIndex === 0}>
            <Icon.ChevronLeft size={14} />
            Anterior
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={goNext}
            disabled={!completedAllSets}
            iconRight={<Icon.ChevronRight size={14} />}
          >
            {currentIndex === planned.length - 1 ? 'Terminar' : 'Siguiente'}
          </Button>
        </div>

        <p className="mt-4 text-center text-[12px] text-pebble">
          {completedAllSets
              ? 'Listo para continuar'
              : `Te faltan ${currentSets.length - completedSets} sets para habilitar el siguiente ejercicio`}
        </p>
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
        'flex items-center gap-2 border bg-paper p-2 transition-colors md:gap-3',
        set.completed ? 'border-forest-ink bg-linen-mist' : 'border-fog',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-forest-ink text-[12px] font-semibold text-paper">
        {index}
      </span>

      <div className="flex-1">
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          min={0}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={commit}
          placeholder="Peso"
          className="h-10 text-center"
          aria-label="Peso"
        />
        <p className="mt-0.5 text-center text-[9px] tracking-[0.12em] uppercase text-pebble">KG</p>
      </div>

      <div className="flex-1">
        <Input
          type="number"
          inputMode="numeric"
          step="1"
          min={0}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={commit}
          placeholder="Reps"
          className="h-10 text-center"
          aria-label="Repeticiones"
        />
        <p className="mt-0.5 text-center text-[9px] tracking-[0.12em] uppercase text-pebble">REPS</p>
      </div>

      <button
        type="button"
        onClick={() => onChange({ completed: !set.completed })}
        aria-label={set.completed ? 'Marcar pendiente' : 'Marcar hecho'}
        className={classNames(
          'flex h-10 w-10 shrink-0 items-center justify-center border transition-colors',
          set.completed
            ? 'border-forest-ink bg-forest-ink text-paper'
            : 'border-fog text-pebble hover:border-forest-ink hover:text-forest-ink',
        )}
      >
        <Icon.Check size={16} />
      </button>
    </li>
  );
}