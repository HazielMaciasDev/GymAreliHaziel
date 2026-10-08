import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Illustration, Sparkle } from '@/components/Illustration';
import { ProgressChart } from '@/components/ProgressChart';
import {
  fetchAdherenceWeeks,
  fetchExerciseProgress,
  type AdherenceWeek,
} from '@/lib/history';
import {
  fetchSessionLogs,
  listSessions,
  type SessionRecord,
} from '@/lib/sessions';
import { EXERCISES } from '@/data/exercises';
import { DAYS_OF_WEEK, classNames, formatDateLong, formatMinutes } from '@/lib/format';

interface SessionDetail {
  session: SessionRecord;
  exerciseLogs: { id: string; exercise_id: string; position: number; notes: string | null }[];
  setLogs: { id: string; exercise_log_id: string; set_number: number; weight_kg: number | null; reps: number | null; completed: boolean }[];
}

export function HistoryPage() {
  const { profile } = useProfile();
  const [sessionsList, setSessionsList] = useState<SessionRecord[]>([]);
  const [adherence, setAdherence] = useState<AdherenceWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [progress, setProgress] = useState<import('@/lib/history').ExerciseProgressPoint[]>([]);
  const [chartMetric, setChartMetric] = useState<'maxWeight' | 'volume'>('maxWeight');

  const profileExercises = useMemo(
    () => (profile ? EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile)) : []),
    [profile],
  );

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [sessions, weeks] = await Promise.all([
          listSessions(profile, 30),
          fetchAdherenceWeeks(profile, 8),
        ]);
        if (cancelled) return;
        setSessionsList(sessions);
        setAdherence(weeks);

        if (sessions.length > 0) {
          const last = sessions[0];
          const detail = await fetchSessionLogs(last.id);
          if (cancelled) return;
          setSelectedSession({
            session: last,
            exerciseLogs: detail.exerciseLogs.map((l) => ({
              id: l.id,
              exercise_id: l.exercise_id,
              position: l.position,
              notes: l.notes,
            })),
            setLogs: detail.setLogs.map((s) => ({
              id: s.id,
              exercise_log_id: s.exercise_log_id,
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              completed: s.completed,
            })),
          });
        }
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el historial.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!profile || !selectedExerciseId) {
      setProgress([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await fetchExerciseProgress(profile, selectedExerciseId);
      if (!cancelled) setProgress(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, selectedExerciseId]);

  const openSession = async (s: SessionRecord) => {
    const detail = await fetchSessionLogs(s.id);
    setSelectedSession({
      session: s,
      exerciseLogs: detail.exerciseLogs.map((l) => ({
        id: l.id,
        exercise_id: l.exercise_id,
        position: l.position,
        notes: l.notes,
      })),
      setLogs: detail.setLogs.map((set) => ({
        id: set.id,
        exercise_log_id: set.exercise_log_id,
        set_number: set.set_number,
        weight_kg: set.weight_kg,
        reps: set.reps,
        completed: set.completed,
      })),
    });
  };

  if (!profile) return null;

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <section className="relative">
          <span className="t-eyebrow text-[#80827f]">Sesiones pasadas</span>
          <h1 className="mt-3 t-display text-[#2c2e2a]">Historial.</h1>
          <p className="mt-3 max-w-[44ch] t-body-lg text-[#2c2e2a]">
            Mirá tu adherencia, revisitá sesiones y seguí el progreso de cada ejercicio.
          </p>
          <div className="absolute right-0 top-0 hidden md:block">
            <Illustration variant="cup" size={80} className="animate-float" />
          </div>
        </section>

        {error ? (
          <Card padding="md" className="mt-6 border-[#ff705d]">
            <p className="text-[14px] text-[#ff705d]">{error}</p>
          </Card>
        ) : null}

        {/* Adherence */}
        <section className="mt-8 md:mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="t-eyebrow text-[#80827f]">Adherencia</h2>
            <span className="t-eyebrow text-[#2c2e2a]">8 semanas</span>
          </div>
          {loading ? (
            <Card padding="md">
              <p className="text-[14px] text-[#80827f]">Cargando…</p>
            </Card>
          ) : (
            <Card padding="md">
              <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
                {adherence.map((w) => {
                  const pct = w.planned > 0 ? (w.completed / w.planned) * 100 : 0;
                  return (
                    <div key={w.weekStart} className="flex flex-col items-start">
                      <span className="t-micro text-[#80827f]">
                        Sem {w.weekStart.slice(5)}
                      </span>
                      <p className="mt-1.5 text-[20px] font-semibold leading-none text-[#2c2e2a]">
                        {w.completed}
                        <span className="text-[11px] font-normal text-[#80827f]"> /{w.planned}</span>
                      </p>
                      <span className="mt-2 h-1.5 w-full rounded-full bg-[#2c2e2a]/8">
                        <span
                          className={classNames(
                            'block h-full rounded-full transition-all',
                            pct >= 100 ? 'bg-[#8ed462]' : pct > 0 ? 'bg-[#f5e211]' : 'bg-transparent',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_1.2fr] md:gap-6">
          <section>
            <h2 className="mb-3 t-eyebrow text-[#80827f]">Sesiones</h2>
            {loading ? (
              <Card padding="md">
                <p className="text-[14px] text-[#80827f]">Cargando…</p>
              </Card>
            ) : sessionsList.length === 0 ? (
              <Card padding="lg">
                <p className="t-body-lg font-semibold text-[#2c2e2a]">Sin sesiones registradas</p>
                <p className="mt-1 t-body text-[#80827f]">
                  Cuando termines una rutina, va a quedar acá.
                </p>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {sessionsList.map((s) => {
                  const dow = DAYS_OF_WEEK[s.day_of_week]?.short ?? '';
                  const dur = s.ended_at
                    ? formatMinutes(Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000))
                    : '—';
                  const active = selectedSession?.session.id === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => openSession(s)}
                        className={classNames(
                          'flex w-full items-center justify-between gap-3 rounded-full border-2 p-3 text-left transition-colors',
                          active
                            ? 'border-[#2c2e2a] bg-[#2c2e2a] text-white'
                            : 'border-[#2c2e2a]/10 bg-white text-[#2c2e2a] hover:border-[#2c2e2a]/30',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold">
                            {formatDateLong(s.routine_date)}
                          </p>
                          <p className={classNames('mt-0.5 text-[12px]', active ? 'text-white/70' : 'text-[#80827f]')}>
                            {dow} · {dur}
                          </p>
                        </div>
                        {s.completed ? (
                          <Tag tone={active ? 'sunshine' : 'grass'} size="sm">Hecha</Tag>
                        ) : (
                          <Tag tone="sandstone" size="sm">Pendiente</Tag>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 t-eyebrow text-[#80827f]">Detalle</h2>
            {selectedSession ? (
              <SessionDetailCard detail={selectedSession} />
            ) : (
              <Card padding="lg">
                <p className="t-body text-[#80827f]">
                  Seleccioná una sesión para ver el detalle.
                </p>
              </Card>
            )}
          </section>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 t-eyebrow text-[#80827f]">Progreso por ejercicio</h2>
          <Card padding="md">
            <div className="mb-5 flex flex-col gap-3">
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="h-12 w-full rounded-full border-2 border-[#2c2e2a] bg-white px-4 text-[15px] text-[#2c2e2a] outline-none focus:bg-[#f5e211]/10 md:max-w-xs"
              >
                <option value="">Elegí un ejercicio</option>
                {profileExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              {selectedExerciseId ? (
                <div className="flex gap-1.5">
                  <ChartTab
                    active={chartMetric === 'maxWeight'}
                    onClick={() => setChartMetric('maxWeight')}
                    label="Peso máximo"
                  />
                  <ChartTab
                    active={chartMetric === 'volume'}
                    onClick={() => setChartMetric('volume')}
                    label="Volumen"
                  />
                </div>
              ) : null}
            </div>
            {selectedExerciseId ? (
              <ProgressChart data={progress} metric={chartMetric} />
            ) : (
              <p className="t-body text-[#80827f]">
                Seleccioná un ejercicio para ver su progreso.
              </p>
            )}
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function ChartTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'rounded-full px-4 h-10 text-[13px] font-medium transition-colors',
        active ? 'bg-[#2c2e2a] text-white' : 'bg-white text-[#2c2e2a] border-2 border-[#2c2e2a]/10 hover:border-[#2c2e2a]/30',
      )}
    >
      {label}
    </button>
  );
}

function SessionDetailCard({ detail }: { detail: SessionDetail }) {
  const setsByLog = new Map<string, typeof detail.setLogs>();
  for (const s of detail.setLogs) {
    if (!setsByLog.has(s.exercise_log_id)) setsByLog.set(s.exercise_log_id, []);
    setsByLog.get(s.exercise_log_id)!.push(s);
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="t-eyebrow text-[#80827f]">{formatDateLong(detail.session.routine_date)}</span>
          <p className="mt-1.5 t-subheading text-[#2c2e2a]">
            {detail.session.completed ? 'Sesión completa' : 'Sesión parcial'}
          </p>
        </div>
        {detail.session.completed ? (
          <Tag tone="grass">Hecha</Tag>
        ) : (
          <Tag tone="sandstone">Pendiente</Tag>
        )}
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {detail.exerciseLogs
          .sort((a, b) => a.position - b.position)
          .map((log) => {
            const ex = EXERCISES.find((e) => e.id === log.exercise_id);
            const sets = (setsByLog.get(log.id) ?? []).sort((a, b) => a.set_number - b.set_number);
            const completedSets = sets.filter((s) => s.completed).length;
            return (
              <li key={log.id} className="rounded-[25px] bg-[#f5f1e4] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="t-body font-semibold text-[#2c2e2a]">{ex?.name ?? log.exercise_id}</p>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] tabular-nums text-[#2c2e2a]">
                    {completedSets}/{sets.length}
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {sets.map((s) => (
                    <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                      <span
                        className={classNames(
                          'flex h-6 w-6 items-center justify-center rounded-full',
                          s.completed ? 'bg-[#8ed462] text-[#2c2e2a]' : 'bg-white text-[#80827f]',
                        )}
                      >
                        {s.completed ? (
                          <IconCheck size={11} />
                        ) : (
                          <span className="text-[10px]">#{s.set_number}</span>
                        )}
                      </span>
                      <span className="flex-1 tabular-nums text-[#2c2e2a]">
                        {s.weight_kg != null ? `${s.weight_kg}` : '—'} kg ×{' '}
                        {s.reps ?? '—'} reps
                      </span>
                    </li>
                  ))}
                </ul>
                {log.notes ? (
                  <p className="mt-3 rounded-2xl bg-white p-3 text-[13px] leading-[1.5] text-[#2c2e2a]/80">
                    {log.notes}
                  </p>
                ) : null}
              </li>
            );
          })}
      </ul>
    </Card>
  );
}

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}