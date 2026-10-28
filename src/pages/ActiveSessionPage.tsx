import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import { VideoCarousel } from '@/components/VideoCarousel';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import {
  addExerciseLog,
  addSetLog,
  cancelSession,
  deleteSetLog,
  fetchSessionLogs,
  finishSession,
  reorderExerciseLogs,
  startSession,
  updateSetLog,
  getSessionByDate,
  type ExerciseLogRecord,
  type SetLogRecord,
  type SessionRecord,
} from '@/lib/sessions';
import {
  fetchWeeklyRoutine,
  updateEntryPlan,
  type EntryPlan,
  type WeeklyRoutineEntry,
} from '@/lib/weekly-routine';
import { EXERCISES } from '@/data/exercises';
import { MUSCLES } from '@/lib/muscles';
import type { Exercise } from '@/types';
import {
  classNames,
  dayOfWeekFromDate,
  formatDuration,
  isRestDay,
  toIsoDate,
} from '@/lib/format';

interface PlannedExercise {
  exercise: Exercise;
  plannedSets: number;
  plannedReps: number;
  plannedWeight: number | null;
}

const REST_COPY: Record<string, string> = {
  areli: 'Recupera el cuerpo: caminata, hidratación y un buen sueño.',
  haziel: 'Mantén el ritmo suave. Estiramientos, agua y descanso.',
};

export function ActiveSessionPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [planned, setPlanned] = useState<PlannedExercise[]>([]);
  const [routineRows, setRoutineRows] = useState<WeeklyRoutineEntry[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogRecord[]>([]);
  const [setLogs, setSetLogs] = useState<SetLogRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundJustCompleted, setRoundJustCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [exitSheetOpen, setExitSheetOpen] = useState(false);
  const [exiting, setExiting] = useState<null | 'save' | 'cancel' | 'restart'>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const initRef = useRef(false);
  const sessionStartedAtRef = useRef<number>(Date.now());

  const today = useMemo(() => new Date(), []);
  const todayDow = useMemo(() => dayOfWeekFromDate(today), [today]);
  const isTodayRest = isRestDay(todayDow);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    if (isTodayRest) {
      setLoading(false);
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const dateIso = toIsoDate(today);
        const routine = await fetchWeeklyRoutine(profile);
        const dayExercises = routine
          .filter((r) => r.day_of_week === todayDow)
          .sort((a, b) => a.position - b.position);

        const plannedList: PlannedExercise[] = dayExercises
          .map((r) => {
            const ex = EXERCISES.find((e) => e.id === r.exercise_id);
            if (!ex) return null;
            return {
              exercise: ex,
              plannedSets: r.default_sets,
              plannedReps: r.default_reps,
              plannedWeight: r.default_weight_kg ?? null,
            };
          })
          .filter((p): p is PlannedExercise => p !== null);

        if (!cancelled) setRoutineRows(dayExercises);

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
        if (!cancelled) {
          setSession(sess);
          sessionStartedAtRef.current = new Date(sess.started_at).getTime();
        }

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
              p.plannedWeight,
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

        const setsByLog = new Map<string, SetLogRecord[]>();
        for (const s of logs.setLogs) {
          const list = setsByLog.get(s.exercise_log_id) ?? [];
          list.push(s);
          setsByLog.set(s.exercise_log_id, list);
        }
        for (const list of setsByLog.values()) {
          list.sort((a, b) => a.set_number - b.set_number);
        }

        const totalRounds = Math.max(
          1,
          ...logs.exerciseLogs.map((l) => (setsByLog.get(l.id) ?? []).length),
        );

        let resumeRound = 0;
        for (let r = 0; r < totalRounds; r++) {
          const pending = logs.exerciseLogs.some((l) => {
            const set = (setsByLog.get(l.id) ?? []).find((s) => s.set_number === r + 1);
            return set ? !set.completed : false;
          });
          if (pending) {
            resumeRound = r;
            break;
          }
          resumeRound = r + 1;
        }
        if (cancelled) return;

        if (resumeRound >= totalRounds) {
          setCurrentRound(totalRounds - 1);
          setCurrentIndex(plannedList.length);
        } else {
          setCurrentRound(resumeRound);
          const firstPending = logs.exerciseLogs.findIndex((l) => {
            const set = (setsByLog.get(l.id) ?? []).find((s) => s.set_number === resumeRound + 1);
            return set ? !set.completed : false;
          });
          setCurrentIndex(firstPending === -1 ? 0 : firstPending);
        }
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
  }, [profile, router, today, todayDow, isTodayRest]);

  /* ---------------------------------------------------------------- */
  /* Sets por ejercicio                                                */
  /* ---------------------------------------------------------------- */

  const setsByLog = useMemo(() => {
    const map = new Map<string, SetLogRecord[]>();
    for (const s of setLogs) {
      const list = map.get(s.exercise_log_id) ?? [];
      list.push(s);
      map.set(s.exercise_log_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.set_number - b.set_number);
    return map;
  }, [setLogs]);

  const currentPlanned = planned[currentIndex];
  const currentLog = exerciseLogs[currentIndex];

  // Las rondas son el máximo de series entre ejercicios; los que ya
  // terminaron sus series se saltan solos.
  const totalRounds = useMemo(() => {
    if (exerciseLogs.length === 0) return 1;
    return Math.max(
      1,
      ...exerciseLogs.map((l) => (setsByLog.get(l.id) ?? []).length),
    );
  }, [exerciseLogs, setsByLog]);

  const currentRoundSet = useMemo(() => {
    if (!currentLog) return null;
    return (
      setsByLog
        .get(currentLog.id)
        ?.find((s) => s.set_number === currentRound + 1) ?? null
    );
  }, [currentLog, setsByLog, currentRound]);

  const roundStatus = useMemo(() => {
    return exerciseLogs.map((log) => {
      const sets = setsByLog.get(log.id) ?? [];
      const set = sets.find((s) => s.set_number === currentRound + 1);
      const exhausted = sets.length > 0 && sets.length <= currentRound;
      return {
        logId: log.id,
        exerciseId: log.exercise_id,
        completed: exhausted ? true : (set?.completed ?? false),
        skipped: exhausted,
        setId: set?.id ?? null,
      };
    });
  }, [exerciseLogs, setsByLog, currentRound]);

  /** Primer ejercicio (desde `from`) con una serie pendiente en la ronda dada. */
  const nextPendingIndex = useCallback(
    (from: number, round: number): number => {
      for (let i = from; i < exerciseLogs.length; i++) {
        const sets = setsByLog.get(exerciseLogs[i].id) ?? [];
        const set = sets.find((s) => s.set_number === round + 1);
        if (set && !set.completed) return i;
      }
      return -1;
    },
    [exerciseLogs, setsByLog],
  );

  const hasPendingInRound = useCallback(
    (round: number): boolean => nextPendingIndex(0, round) !== -1,
    [nextPendingIndex],
  );

  // Si el ejercicio actual ya no tiene series para esta ronda (porque tiene
  // menos series que los demás), saltamos al siguiente que sí tenga.
  useEffect(() => {
    if (loading || currentIndex >= planned.length) return;
    const log = exerciseLogs[currentIndex];
    if (!log) return;
    const sets = setsByLog.get(log.id) ?? [];
    const set = sets.find((s) => s.set_number === currentRound + 1);
    if (set) return;
    const next = nextPendingIndex(currentIndex + 1, currentRound);
    if (next !== -1) setCurrentIndex(next);
  }, [
    loading,
    currentIndex,
    currentRound,
    exerciseLogs,
    setsByLog,
    nextPendingIndex,
    planned.length,
  ]);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      setTotalElapsed(Math.floor((Date.now() - sessionStartedAtRef.current) / 1000));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const handleExit = async (action: 'save' | 'cancel' | 'restart') => {
    if (!session) return;
    setExiting(action);
    try {
      if (action === 'save') {
        await finishSession(session.id, false);
        setExitSheetOpen(false);
        router.push('/routine');
        return;
      }
      if (action === 'cancel') {
        await cancelSession(session.id);
        setExitSheetOpen(false);
        router.push('/routine');
        return;
      }
      if (action === 'restart') {
        await cancelSession(session.id);
        setExitSheetOpen(false);
        router.push('/routine/active');
        return;
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo completar la acción.');
    } finally {
      setExiting(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Edición en vivo                                                   */
  /* ---------------------------------------------------------------- */

  const commitSet = (setId: string, patch: Partial<SetLogRecord>) => {
    setSetLogs((prev) => prev.map((s) => (s.id === setId ? { ...s, ...patch } : s)));
    updateSetLog(setId, patch).catch((err) => console.error(err));
  };

  const markDone = () => {
    const targetSetId = currentRoundSet?.id;
    if (targetSetId) {
      commitSet(targetSetId, { completed: true });
    }
    // Defer state transitions to the next macrotask so React commits
    // the setLog update before we read `roundStatus` for the "Hecho" check.
    setTimeout(() => {
      let nextInRound = nextPendingIndex(currentIndex + 1, currentRound);
      if (nextInRound === -1) {
        // volver al principio de la ronda por si el ejercicio se marcó fuera de orden
        const wrapped = nextPendingIndex(0, currentRound);
        nextInRound = wrapped === currentIndex ? -1 : wrapped;
      }
      if (nextInRound !== -1) {
        setCurrentIndex(nextInRound);
        return;
      }
      const nextRound = currentRound + 1;
      if (nextRound < totalRounds && hasPendingInRound(nextRound)) {
        setRoundJustCompleted(true);
        setTimeout(() => {
          setRoundJustCompleted(false);
          setCurrentRound(nextRound);
          setCurrentIndex(Math.max(0, nextPendingIndex(0, nextRound)));
        }, 700);
        return;
      }
      setCurrentIndex(planned.length);
    }, 0);
  };

  /** Agrega una serie (ronda) a todos los ejercicios del día. */
  const addRound = async () => {
    if (exerciseLogs.length === 0) return;
    const created: SetLogRecord[] = [];
    try {
      for (const log of exerciseLogs) {
        const sets = setsByLog.get(log.id) ?? [];
        const last = sets[sets.length - 1];
        const nextNumber = last ? last.set_number + 1 : 1;
        const newSet = await addSetLog(
          log.id,
          nextNumber,
          last?.reps ?? null,
          last?.weight_kg ?? null,
        );
        created.push(newSet);
      }
      setSetLogs((prev) => [...prev, ...created]);
      showNotice('Serie agregada a toda la rutina.');
    } catch (err) {
      console.error(err);
      setError('No se pudo agregar la serie.');
    }
  };

  /** Quita la última serie (ronda) de todos los ejercicios del día. */
  const removeRound = async () => {
    if (exerciseLogs.length === 0) return;
    const lastNumbers = exerciseLogs.map((log) => {
      const sets = setsByLog.get(log.id) ?? [];
      const last = sets[sets.length - 1];
      return { log, last };
    });
    const anyCompleted = lastNumbers.some((x) => x.last?.completed);
    if (anyCompleted && !window.confirm('Hay series completadas. ¿Quitás la última ronda igual?')) {
      return;
    }
    const toDelete = lastNumbers.filter((x) => x.last);
    try {
      for (const item of toDelete) {
        await deleteSetLog(item.last!.id);
      }
      const removedIds = new Set(toDelete.map((x) => x.last!.id));
      setSetLogs((prev) => prev.filter((s) => !removedIds.has(s.id)));
      showNotice('Serie quitada de la rutina.');
    } catch (err) {
      console.error(err);
      setError('No se pudo quitar la serie.');
    }
  };

  /** Cambia el orden de los ejercicios a mitad de sesión. */
  const moveExercise = async (from: number, to: number) => {
    if (
      from === to ||
      to < 0 ||
      to >= planned.length ||
      from < 0 ||
      from >= planned.length
    ) {
      return;
    }
    const nextPlanned = [...planned];
    const [moved] = nextPlanned.splice(from, 1);
    nextPlanned.splice(to, 0, moved);
    const nextLogs = [...exerciseLogs];
    const [movedLog] = nextLogs.splice(from, 1);
    nextLogs.splice(to, 0, movedLog);

    const activeId = currentLog?.id;
    setPlanned(nextPlanned);
    setExerciseLogs(nextLogs);
    setCurrentIndex(nextLogs.findIndex((l) => l.id === activeId));

    try {
      await reorderExerciseLogs(nextLogs.map((l) => l.id));
      showNotice('Orden actualizado.');
    } catch (err) {
      console.error(err);
      setError('No se pudo cambiar el orden.');
    }
  };

  /** Guarda lo que se hizo hoy de vuelta en la plantilla de la semana. */
  const saveToTemplate = async () => {
    if (!profile) return;
    let saved = 0;
    try {
      for (let i = 0; i < exerciseLogs.length; i++) {
        const log = exerciseLogs[i];
        const entry = planned[i];
        if (!entry) continue;
        const sets = setsByLog.get(log.id) ?? [];
        const first = sets[0];
        const row = routineRows.find(
          (r) => r.exercise_id === log.exercise_id && r.day_of_week === todayDow,
        );
        if (!row) continue;
        const plan: EntryPlan = {
          sets: sets.length,
          reps: first?.reps ?? entry.plannedReps,
          weightKg: first?.weight_kg ?? entry.plannedWeight,
        };
        await updateEntryPlan(row.id, plan);
        saved += 1;
      }
      setRoutineRows((prev) =>
        prev.map((row) => {
          const idx = exerciseLogs.findIndex((l) => l.exercise_id === row.exercise_id);
          if (idx === -1) return row;
          const sets = setsByLog.get(exerciseLogs[idx].id) ?? [];
          const first = sets[0];
          return {
            ...row,
            default_sets: sets.length,
            default_reps: first?.reps ?? row.default_reps,
            default_weight_kg: first?.weight_kg ?? row.default_weight_kg ?? null,
          };
        }),
      );
      showNotice(`Rutina guardada (${saved} ${saved === 1 ? 'ejercicio' : 'ejercicios'}).`);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la rutina.');
    }
  };

  if (!profile) return null;

  if (isTodayRest) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="relative">
            <Illustration variant="medal" size={140} className="animate-pop" />
          </div>
          <span className="mt-8 t-eyebrow text-[#80827f]">Día de descanso</span>
          <h1 className="mt-3 t-display text-[#2c2e2a]">Descanso.</h1>
          <p className="mt-3 max-w-[40ch] t-body-lg text-[#2c2e2a]/80">
            {REST_COPY[profile] ?? 'Recupera el cuerpo. Mañana vuelve el circuito.'}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              variant="coral"
              size="lg"
              onClick={() => router.push('/routine')}
              dotColor="sunshine"
            >
              Ver la semana
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
              iconRight={<Icon.ChevronRight size={14} />}
              dotColor="grass"
            >
              Ir a Rutina
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  const allRoundsDone = roundStatus.every((s) => s.completed) && currentRound >= totalRounds - 1;

  if (allRoundsDone && currentIndex >= planned.length) {
    // Compute session stats
    const completedSets = setLogs.filter((s) => s.completed);
    const totalReps = completedSets.reduce((acc, s) => acc + (s.reps ?? 0), 0);
    const topSet = completedSets.reduce<{ weight: number; exercise: string | null; reps: number }>(
      (best, s) => ((s.weight_kg ?? 0) > best.weight
        ? { weight: s.weight_kg ?? 0, exercise: s.exercise_log_id, reps: s.reps ?? 0 }
        : best),
      { weight: 0, exercise: null, reps: 0 },
    );
    const topExerciseName = topSet.exercise
      ? EXERCISES.find((e) => e.id === exerciseLogs.find((l) => l.id === topSet.exercise)?.exercise_id)?.name ?? null
      : null;

    // Per-exercise best set for the summary list
    const exerciseSummary = planned.map((p) => {
      const log = exerciseLogs.find((l) => l.exercise_id === p.exercise.id);
      const sets = log ? setLogs.filter((s) => s.exercise_log_id === log.id && s.completed) : [];
      const maxWeight = Math.max(0, ...sets.map((s) => s.weight_kg ?? 0));
      const totalRepsForEx = sets.reduce((acc, s) => acc + (s.reps ?? 0), 0);
      return { exercise: p.exercise, maxWeight, totalReps: totalRepsForEx, setCount: sets.length };
    });

    const totalPlannedSets = exerciseLogs.reduce(
      (acc, l) => acc + (setsByLog.get(l.id) ?? []).length,
      0,
    );

    return (
      <AppShell>
        <div className="py-6 md:py-10">
          <section className="relative text-center">
            <div className="relative inline-block">
              <Illustration variant="medal" size={120} className="animate-pop" />
            </div>
            <span className="mt-5 t-eyebrow text-[#80827f]">Sesión completa</span>
            <h1 className="mt-2 t-display text-[#2c2e2a]">¡Hecho!</h1>
            <p className="mt-2 t-body-lg text-[#2c2e2a]/80">
              {totalRounds} {totalRounds === 1 ? 'ronda' : 'rondas'} · {planned.length} ejercicios
            </p>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-3 md:gap-4">
            <Card padding="md" tone="white">
              <span className="t-eyebrow text-[#80827f]">Tiempo</span>
              <p className="mt-2 t-display text-[#2c2e2a] tabular-nums leading-[0.9]">
                {formatDuration(totalElapsed).split(':')[0]}
                <span className="text-[#80827f] text-[20px]"> min</span>
              </p>
              <p className="mt-1 t-body-sm tabular-nums text-[#80827f]">
                {formatDuration(totalElapsed)}
              </p>
            </Card>
            <Card padding="md" tone="white">
              <span className="t-eyebrow text-[#80827f]">Reps totales</span>
              <p className="mt-2 t-display text-[#2c2e2a] tabular-nums leading-[0.9]">
                {totalReps}
              </p>
              <p className="mt-1 t-body-sm text-[#80827f]">
                en {completedSets.length} sets
              </p>
            </Card>
            <Card padding="md" tone="white">
              <span className="t-eyebrow text-[#80827f]">Top peso</span>
              <p className="mt-2 t-display text-[#2c2e2a] tabular-nums leading-[0.9]">
                {topSet.weight > 0 ? topSet.weight : '—'}
                {topSet.weight > 0 ? <span className="text-[#80827f] text-[20px]"> kg</span> : null}
              </p>
              <p className="mt-1 t-body-sm text-[#80827f] truncate">
                {topExerciseName ? `${topExerciseName} · ${topSet.reps} reps` : 'sin peso registrado'}
              </p>
            </Card>
            <Card padding="md" tone="grass">
              <span className="t-eyebrow text-[#2c2e2a]/70">Completitud</span>
              <p className="mt-2 t-display text-[#2c2e2a] tabular-nums leading-[0.9]">
                {totalPlannedSets > 0
                  ? Math.round((completedSets.length / totalPlannedSets) * 100)
                  : 0}
                <span className="text-[#2c2e2a]/60 text-[20px]">%</span>
              </p>
              <p className="mt-1 t-body-sm text-[#2c2e2a]/80">
                {completedSets.length} de {totalPlannedSets} sets
              </p>
            </Card>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 t-eyebrow text-[#80827f]">Tu sesión</h2>
            <ul className="flex flex-col gap-2">
              {exerciseSummary.map((s, idx) => (
                <li
                  key={s.exercise.id}
                  className="flex items-center gap-3 overflow-hidden rounded-[24px] border border-[#2c2e2a]/10 bg-white p-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f1e4] text-[13px] font-semibold text-[#2c2e2a]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#2c2e2a]">
                      {s.exercise.name}
                    </p>
                    <p className="t-eyebrow text-[#80827f]">
                      {s.setCount} {s.setCount === 1 ? 'set' : 'sets'} · {s.totalReps} reps
                    </p>
                  </div>
                  {s.maxWeight > 0 ? (
                    <span className="shrink-0 rounded-full bg-[#2c2e2a] px-3 py-1.5 text-[13px] font-semibold tabular-nums text-[#f5f1e4]">
                      {s.maxWeight} kg
                    </span>
                  ) : (
                    <span className="shrink-0 t-body-sm text-[#80827f]">—</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-8 flex flex-col items-stretch gap-3">
            <Button
              variant="coral"
              size="lg"
              fullWidth
              onClick={async () => {
                if (!session) return;
                try {
                  await finishSession(session.id, true);
                } catch (err) {
                  console.error(err);
                }
                router.push('/history');
              }}
              dotColor="sunshine"
            >
              Ver historial completo
            </Button>
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => router.push('/home')}
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const currentSet = currentRoundSet;
  const isCurrentSetDone = currentSet?.completed ?? false;
  const isLastExerciseInRound = currentIndex >= planned.length - 1;
  const isLastRound = currentRound >= totalRounds - 1;

  return (
    <AppShell>
      <div className="py-4 md:py-8">
        <header className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExitSheetOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white hover:bg-[#e0dbce]"
            aria-label="Salir de la sesión"
          >
            <Icon.ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <span className="t-micro text-[#80827f]">Ronda</span>
            <p className="t-body text-[#2c2e2a] font-semibold tabular-nums">
              {currentRound + 1} <span className="text-[#80827f]">/ {totalRounds}</span>
            </p>
          </div>
          <div className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#2c2e2a] px-4 text-[13px] font-medium text-[#f5f1e4]">
            <Icon.Timer size={14} />
            <span className="tabular-nums">{formatDuration(totalElapsed)}</span>
          </div>
        </header>

        {/* Round progress pills */}
        <div className="mb-4 flex gap-1">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <span
              key={i}
              className={classNames(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < currentRound
                  ? 'bg-[#8ed462]'
                  : i === currentRound
                    ? 'bg-[#2c2e2a]'
                    : 'bg-[#2c2e2a]/10',
              )}
            />
          ))}
        </div>

        {/* Exercise pills (within the round) */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {planned.map((p, i) => {
            const status = roundStatus[i];
            const isCurrent = i === currentIndex;
            return (
              <div
                key={p.exercise.id}
                className={classNames(
                  'flex items-center gap-1 rounded-full border-2 px-2 h-11 transition-colors',
                  status?.completed
                    ? 'border-[#8ed462] bg-[#8ed462]/15 text-[#2c2e2a]'
                    : isCurrent
                      ? 'border-[#2c2e2a] bg-[#2c2e2a] text-[#f5f1e4]'
                      : 'border-[#2c2e2a]/15 bg-white text-[#2c2e2a]',
                )}
              >
                <button
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className="flex items-center gap-2 px-1 text-[12px] font-medium"
                >
                  <span
                    className={classNames(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                      status?.completed
                        ? 'bg-[#8ed462] text-[#2c2e2a]'
                        : isCurrent
                          ? 'bg-[#f5e211] text-[#2c2e2a]'
                          : 'bg-[#f5f1e4] text-[#2c2e2a]',
                    )}
                  >
                    {status?.completed ? <Icon.Check size={11} /> : i + 1}
                  </span>
                  <span className="max-w-[110px] truncate">{p.exercise.name}</span>
                </button>
                <span className="flex items-center">
                  <button
                    type="button"
                    onClick={() => moveExercise(i, i - 1)}
                    disabled={i === 0}
                    className="flex h-7 w-6 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
                    aria-label={`Subir ${p.exercise.name}`}
                  >
                    <Icon.ChevronUp size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExercise(i, i + 1)}
                    disabled={i === planned.length - 1}
                    className="flex h-7 w-6 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
                    aria-label={`Bajar ${p.exercise.name}`}
                  >
                    <Icon.ChevronDown size={11} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {/* Controles de la ronda */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white p-0.5">
            <button
              type="button"
              onClick={removeRound}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#2c2e2a] transition-colors hover:bg-[#f5f1e4]"
              aria-label="Quitar una serie"
            >
              <Icon.Minus size={13} />
            </button>
            <span className="min-w-[62px] text-center text-[12px] font-semibold tabular-nums text-[#2c2e2a]">
              {totalRounds} series
            </span>
            <button
              type="button"
              onClick={addRound}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#2c2e2a] transition-colors hover:bg-[#f5f1e4]"
              aria-label="Agregar una serie"
            >
              <Icon.Plus size={13} />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={saveToTemplate}
            iconLeft={<Icon.Save size={13} />}
            dotColor="ink"
          >
            Guardar en la rutina
          </Button>
        </div>

        {notice ? (
          <div className="mb-4 rounded-[20px] border-2 border-[#8ed462] bg-white px-4 py-3 text-[14px] text-[#2c2e2a]">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-[20px] border-2 border-[#ff705d] bg-white px-4 py-3 text-[14px] text-[#ff705d]">
            {error}
          </div>
        ) : null}

        {roundJustCompleted ? (
          <Card padding="lg" tone="grass" className="mb-5 animate-pop text-center">
            <Sparkle size={28} color="#2c2e2a" className="mx-auto" />
            <p className="mt-3 t-heading text-[#2c2e2a]">
              ¡Ronda {currentRound + 1} completa!
            </p>
            {!isLastRound ? (
              <p className="mt-1 t-body text-[#2c2e2a]/80">
                Ahora vamos a la ronda {currentRound + 2}.
              </p>
            ) : null}
          </Card>
        ) : null}

        {currentPlanned ? (
          <ActiveExercisePanel
            planned={currentPlanned}
            currentRound={currentRound}
            totalRounds={totalRounds}
            currentSet={currentSet}
            isCurrentSetDone={isCurrentSetDone}
            currentIndex={currentIndex}
            plannedCount={planned.length}
            onOpenDetails={() => setShowDetails(true)}
            onCommit={(patch) => {
              if (!currentSet) return;
              commitSet(currentSet.id, patch);
            }}
            onMarkDone={markDone}
          />
        ) : null}
      </div>

      {showDetails && currentPlanned ? (
        <ExerciseDetailModal
          exercise={currentPlanned.exercise}
          onClose={() => setShowDetails(false)}
        />
      ) : null}

      {exitSheetOpen && session ? (
        <ExitSheet
          onClose={() => !exiting && setExitSheetOpen(false)}
          onPick={handleExit}
          exiting={exiting}
          hasAnyProgress={setLogs.some((s) => s.completed)}
        />
      ) : null}
    </AppShell>
  );
}

interface ActiveExercisePanelProps {
  planned: PlannedExercise;
  currentRound: number;
  totalRounds: number;
  currentSet: SetLogRecord | null;
  isCurrentSetDone: boolean;
  currentIndex: number;
  plannedCount: number;
  onOpenDetails: () => void;
  onCommit: (patch: Partial<SetLogRecord>) => void;
  onMarkDone: () => void;
}

function ActiveExercisePanel({
  planned,
  currentRound,
  totalRounds,
  currentSet,
  isCurrentSetDone,
  currentIndex,
  plannedCount,
  onOpenDetails,
  onCommit,
  onMarkDone,
}: ActiveExercisePanelProps) {
  const { exercise, plannedReps, plannedWeight } = planned;
  const allMedia = useMemo(
    () => [exercise.gifPath, ...(exercise.extraMediaPaths ?? [])],
    [exercise],
  );
  const primary = MUSCLES[exercise.primaryMuscle];

  const [weight, setWeight] = useState<string>(currentSet?.weight_kg?.toString() ?? '');
  const [reps, setReps] = useState<string>(currentSet?.reps?.toString() ?? '');
  const [scrollY, setScrollY] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setWeight(currentSet?.weight_kg?.toString() ?? '');
    setReps(currentSet?.reps?.toString() ?? '');
    setEditing(false);
  }, [currentSet?.id, exercise.id]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const commitField = (field: 'weight_kg' | 'reps', value: string) => {
    const num = value === '' ? null : Number(value);
    onCommit({ [field]: num } as Partial<SetLogRecord>);
  };

  const videoScale = Math.max(0.55, 1 - scrollY / 800);
  const videoShrunk = scrollY > 200;
  const locked = isCurrentSetDone && !editing;
  const hasWeight = weight.trim() !== '';

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:gap-6">
      <div className="order-1">
        <div
          className="md:relative md:top-auto sticky top-2 z-10 origin-top transition-transform duration-300 ease-out"
          style={{ transform: videoShrunk ? `scale(${videoScale})` : 'scale(1)' }}
        >
          <VideoCarousel media={allMedia} alt={exercise.name} ratio="4/3" />
        </div>

        <div className="mt-4 rounded-[32px] bg-white p-4">
          <div className="flex items-start gap-3">
            {exercise.muscleImagePath ? (
              <img
                src={exercise.muscleImagePath}
                alt={`Músculos trabajados en ${exercise.name}`}
                className="h-14 w-14 shrink-0 rounded-full bg-[#f5f1e4] object-contain"
                loading="lazy"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f5e211] text-[12px] font-semibold text-[#2c2e2a]">
                {primary.label.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <span className="t-eyebrow text-[#80827f]">Tips</span>
              <ul className="mt-1.5 flex flex-col gap-1">
                {exercise.tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="text-[13px] leading-[1.4] text-[#2c2e2a]/85">
                    · {tip}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onOpenDetails}
              dotColor="ink"
            >
              Detalles
            </Button>
          </div>
        </div>
      </div>

      <div className="order-2 flex flex-col gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag tone="grass" size="sm">{primary.label}</Tag>
            <Tag tone="sandstone" size="sm">Ronda {currentRound + 1}/{totalRounds}</Tag>
            <Tag tone="sandstone" size="sm">{plannedReps} reps</Tag>
            {plannedWeight ? (
              <Tag tone="sandstone" size="sm">{plannedWeight} kg</Tag>
            ) : null}
          </div>
          <h2 className="mt-3 t-heading text-[#2c2e2a]">{exercise.name}</h2>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="t-eyebrow text-[#80827f]">
              Peso y reps de la ronda {currentRound + 1}
            </span>
            {isCurrentSetDone ? (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="t-eyebrow text-[#2c2e2a] underline underline-offset-4 hover:text-[#80827f]"
              >
                {editing ? 'Listo' : 'Editar'}
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  commitField('weight_kg', e.target.value);
                }}
                placeholder={plannedWeight ? String(plannedWeight) : '0'}
                className="h-14 w-full rounded-full border-2 border-[#2c2e2a]/15 bg-white px-4 text-center text-[18px] font-medium tabular-nums text-[#2c2e2a] outline-none transition-colors focus:border-[#2c2e2a] disabled:opacity-50"
                aria-label="Peso en kilos"
                disabled={locked}
              />
              <p className="mt-1 text-center text-[10px] tracking-[0.16em] uppercase text-[#80827f]">
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
                onChange={(e) => {
                  setReps(e.target.value);
                  commitField('reps', e.target.value);
                }}
                placeholder={String(plannedReps)}
                className="h-14 w-full rounded-full border-2 border-[#2c2e2a]/15 bg-white px-4 text-center text-[18px] font-medium tabular-nums text-[#2c2e2a] outline-none transition-colors focus:border-[#2c2e2a] disabled:opacity-50"
                aria-label="Repeticiones"
                disabled={locked}
              />
              <p className="mt-1 text-center text-[10px] tracking-[0.16em] uppercase text-[#80827f]">
                REPS
              </p>
            </div>
          </div>
          {isCurrentSetDone && !hasWeight ? (
            <p className="mt-2 text-center text-[12px] text-[#80827f]">
              Esta serie quedó sin peso registrado.
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant={isCurrentSetDone ? 'dark' : 'coral'}
          size="lg"
          fullWidth
          onClick={onMarkDone}
          disabled={isCurrentSetDone}
          dotColor={isCurrentSetDone ? 'grass' : 'sunshine'}
          iconRight={isCurrentSetDone ? undefined : <Icon.Check size={14} />}
        >
          {isCurrentSetDone
            ? 'Listo en esta ronda'
            : currentRound >= totalRounds - 1 && currentIndex >= plannedCount - 1
              ? 'Terminar sesión'
              : 'Marcar listo'}
        </Button>

        <div className="text-center text-[12px] text-[#80827f]">
          Ronda {currentRound + 1} de {totalRounds} · Ejercicio {currentIndex + 1} de {plannedCount}
        </div>
      </div>
    </div>
  );
}

function ExitSheet({
  onClose,
  onPick,
  exiting,
  hasAnyProgress,
}: {
  onClose: () => void;
  onPick: (action: 'save' | 'cancel' | 'restart') => void;
  exiting: null | 'save' | 'cancel' | 'restart';
  hasAnyProgress: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2c2e2a]/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-[50px] bg-[#f5f1e4] animate-[fade-up_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="block h-1.5 w-12 rounded-full bg-[#2c2e2a]/15" />
        </div>
        <div className="px-5 pt-2 pb-5">
          <span className="t-eyebrow text-[#80827f]">Salir de la sesión</span>
          <h2 className="mt-1 t-heading-sm text-[#2c2e2a]">¿Qué querés hacer?</h2>
        </div>

        <ul className="flex flex-col gap-2.5 px-5 pb-5">
          <li>
            <button
              type="button"
              disabled={exiting !== null}
              onClick={() => onPick('save')}
              className="group flex w-full items-center gap-4 overflow-hidden rounded-[24px] border-2 border-[#2c2e2a]/10 bg-white p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#8ed462] text-[#2c2e2a]">
                <Icon.Save size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#2c2e2a]">Salir y guardar parcial</p>
                <p className="mt-0.5 t-eyebrow text-[#80827f]">
                  Queda como parcial en el historial
                </p>
              </div>
              {exiting === 'save' ? (
                <span className="block h-2 w-2 animate-pulse rounded-full bg-[#8ed462]" />
              ) : (
                <Icon.ChevronRight size={14} className="text-[#80827f]" />
              )}
            </button>
          </li>

          <li>
            <button
              type="button"
              disabled={exiting !== null}
              onClick={() => onPick('cancel')}
              className="group flex w-full items-center gap-4 overflow-hidden rounded-[24px] border-2 border-[#2c2e2a]/10 bg-white p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ff705d] text-white">
                <Icon.Trash size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#2c2e2a]">Cancelar y descartar todo</p>
                <p className="mt-0.5 t-eyebrow text-[#80827f]">
                  Borra la sesión y los sets que marcaste
                </p>
              </div>
              {exiting === 'cancel' ? (
                <span className="block h-2 w-2 animate-pulse rounded-full bg-[#ff705d]" />
              ) : (
                <Icon.ChevronRight size={14} className="text-[#80827f]" />
              )}
            </button>
          </li>

          <li>
            <button
              type="button"
              disabled={exiting !== null}
              onClick={() => onPick('restart')}
              className="group flex w-full items-center gap-4 overflow-hidden rounded-[24px] border-2 border-[#2c2e2a]/10 bg-white p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5e211] text-[#2c2e2a]">
                <Icon.Swap size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#2c2e2a]">Reiniciar desde cero</p>
                <p className="mt-0.5 t-eyebrow text-[#80827f]">
                  Borra todo y empieza la rutina de nuevo
                </p>
              </div>
              {exiting === 'restart' ? (
                <span className="block h-2 w-2 animate-pulse rounded-full bg-[#f5e211]" />
              ) : (
                <Icon.ChevronRight size={14} className="text-[#80827f]" />
              )}
            </button>
          </li>
        </ul>

        <div className="px-5 pb-8 pt-2">
          <Button variant="ghost" size="md" fullWidth onClick={onClose} disabled={exiting !== null}>
            Seguir entrenando
          </Button>
        </div>
      </div>
    </div>
  );
}
