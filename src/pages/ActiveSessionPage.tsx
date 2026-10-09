import { useEffect, useMemo, useRef, useState } from 'react';
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
  fetchSessionLogs,
  finishSession,
  startSession,
  updateSetLog,
  getSessionByDate,
  type ExerciseLogRecord,
  type SetLogRecord,
  type SessionRecord,
} from '@/lib/sessions';
import { fetchWeeklyRoutine } from '@/lib/weekly-routine';
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
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogRecord[]>([]);
  const [setLogs, setSetLogs] = useState<SetLogRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundJustCompleted, setRoundJustCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const initRef = useRef(false);
  const sessionStartedAtRef = useRef<number>(Date.now());

  const today = useMemo(() => new Date(), []);
  const todayDow = useMemo(() => dayOfWeekFromDate(today), [today]);
  const isTodayRest = isRestDay(todayDow);

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

        const totalRounds = plannedList[0]?.plannedSets ?? 1;
        if (plannedList.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        let resumeRound = 0;
        for (let r = 0; r < totalRounds; r++) {
          const allDoneInRound = plannedList.every((_, exIdx) => {
            const log = logs.exerciseLogs[exIdx];
            if (!log) return false;
            const setForRound = logs.setLogs.find(
              (s) => s.exercise_log_id === log.id && s.set_number === r + 1,
            );
            return setForRound?.completed ?? false;
          });
          if (!allDoneInRound) {
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
          const firstPending = plannedList.findIndex((_, exIdx) => {
            const log = logs.exerciseLogs[exIdx];
            if (!log) return true;
            const setForRound = logs.setLogs.find(
              (s) => s.exercise_log_id === log.id && s.set_number === resumeRound + 1,
            );
            return !(setForRound?.completed ?? false);
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

  const currentPlanned = planned[currentIndex];
  const currentLog = exerciseLogs[currentIndex];
  const totalRounds = planned[0]?.plannedSets ?? 1;

  const currentRoundSet = useMemo(() => {
    if (!currentLog) return null;
    return setLogs.find(
      (s) => s.exercise_log_id === currentLog.id && s.set_number === currentRound + 1,
    ) ?? null;
  }, [currentLog, setLogs, currentRound]);

  const roundStatus = useMemo(() => {
    return exerciseLogs.map((log) => {
      const set = setLogs.find(
        (s) => s.exercise_log_id === log.id && s.set_number === currentRound + 1,
      );
      return {
        logId: log.id,
        exerciseId: log.exercise_id,
        completed: set?.completed ?? false,
        setId: set?.id ?? null,
      };
    });
  }, [exerciseLogs, setLogs, currentRound]);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      setTotalElapsed(Math.floor((Date.now() - sessionStartedAtRef.current) / 1000));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

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
                {Math.round((completedSets.length / (planned.length * totalRounds)) * 100)}
                <span className="text-[#2c2e2a]/60 text-[20px]">%</span>
              </p>
              <p className="mt-1 t-body-sm text-[#2c2e2a]/80">
                {completedSets.length} de {planned.length * totalRounds} sets
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
            onClick={() => router.push('/routine')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white hover:bg-[#e0dbce]"
            aria-label="Volver"
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
        <div className="mb-5 flex flex-wrap gap-1.5">
          {planned.map((p, i) => {
            const status = roundStatus[i];
            const isCurrent = i === currentIndex;
            return (
              <button
                key={p.exercise.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={classNames(
                  'flex items-center gap-2 rounded-full border-2 px-3 h-9 text-[12px] font-medium transition-colors',
                  status?.completed
                    ? 'border-[#8ed462] bg-[#8ed462]/15 text-[#2c2e2a]'
                    : isCurrent
                      ? 'border-[#2c2e2a] bg-[#2c2e2a] text-[#f5f1e4]'
                      : 'border-[#2c2e2a]/15 bg-white text-[#2c2e2a]',
                )}
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
                <span className="truncate max-w-[120px]">{p.exercise.name}</span>
              </button>
            );
          })}
        </div>

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
              setSetLogs((prev) =>
                prev.map((s) => (s.id === currentSet.id ? { ...s, ...patch } : s)),
              );
              updateSetLog(currentSet.id, patch).catch((err) => console.error(err));
            }}
            onMarkDone={() => {
              const targetSetId = currentSet?.id;
              if (targetSetId) {
                setSetLogs((prev) =>
                  prev.map((s) => (s.id === targetSetId ? { ...s, completed: true } : s)),
                );
                updateSetLog(targetSetId, { completed: true }).catch((err) =>
                  console.error(err),
                );
              }
              const isFinalRound = currentRound >= totalRounds - 1;
              const isFinalExercise = currentIndex >= planned.length - 1;
              // Defer state transitions to the next macrotask so React commits
              // the setLog update before we read `roundStatus` for the "Hecho" check.
              setTimeout(() => {
                if (isFinalExercise && isFinalRound) {
                  setCurrentIndex(planned.length);
                  return;
                }
                if (isFinalExercise) {
                  setRoundJustCompleted(true);
                  setTimeout(() => {
                    setRoundJustCompleted(false);
                    setCurrentRound(currentRound + 1);
                    setCurrentIndex(0);
                  }, 700);
                  return;
                }
                setCurrentIndex(currentIndex + 1);
              }, 0);
            }}
          />
        ) : null}
      </div>

      {showDetails && currentPlanned ? (
        <ExerciseDetailModal
          exercise={currentPlanned.exercise}
          onClose={() => setShowDetails(false)}
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
  const { exercise, plannedReps } = planned;
  const allMedia = useMemo(
    () => [exercise.gifPath, ...(exercise.extraMediaPaths ?? [])],
    [exercise],
  );
  const primary = MUSCLES[exercise.primaryMuscle];

  const [weight, setWeight] = useState<string>(currentSet?.weight_kg?.toString() ?? '');
  const [reps, setReps] = useState<string>(currentSet?.reps?.toString() ?? '');

  useEffect(() => {
    setWeight(currentSet?.weight_kg?.toString() ?? '');
    setReps(currentSet?.reps?.toString() ?? '');
  }, [currentSet?.id, exercise.id]);

  const commitField = (field: 'weight_kg' | 'reps', value: string) => {
    const num = value === '' ? null : Number(value);
    onCommit({ [field]: num } as Partial<SetLogRecord>);
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:gap-6">
      <div className="order-1">
        <VideoCarousel media={allMedia} alt={exercise.name} ratio="4/3" />

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
          </div>
          <h2 className="mt-3 t-heading text-[#2c2e2a]">{exercise.name}</h2>
        </div>

        <div>
          <span className="t-eyebrow text-[#80827f]">
            Peso y reps de la ronda {currentRound + 1}
          </span>
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
                placeholder="0"
                className="h-14 w-full rounded-full border-2 border-[#2c2e2a]/15 bg-white px-4 text-center text-[18px] font-medium tabular-nums text-[#2c2e2a] outline-none transition-colors focus:border-[#2c2e2a] disabled:opacity-50"
                aria-label="Peso en kilos"
                disabled={isCurrentSetDone}
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
                disabled={isCurrentSetDone}
              />
              <p className="mt-1 text-center text-[10px] tracking-[0.16em] uppercase text-[#80827f]">
                REPS
              </p>
            </div>
          </div>
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
