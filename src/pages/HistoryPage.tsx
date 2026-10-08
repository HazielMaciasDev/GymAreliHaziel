import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
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
        <header className="mb-8 md:mb-10">
          <p className="text-eyebrow text-black/50">Sesiones pasadas</p>
          <h1 className="mt-2 text-display-sm text-black md:text-display">Historial.</h1>
        </header>

        {error ? (
          <Card padding="md" className="mb-6 border-[#f64932]">
            <p className="text-[14px] text-[#f64932]">{error}</p>
          </Card>
        ) : null}

        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-eyebrow text-black/50">Adherencia</h2>
            <p className="text-[12px] text-black/50">Últimas 8 semanas</p>
          </div>
          {loading ? (
            <Card padding="md">
              <p className="text-[14px] text-black/50">Cargando…</p>
            </Card>
          ) : (
            <Card padding="md">
              <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
                {adherence.map((w) => {
                  const pct = w.planned > 0 ? (w.completed / w.planned) * 100 : 0;
                  return (
                    <div key={w.weekStart} className="flex flex-col items-start">
                      <p className="text-[10px] tracking-[0.08em] uppercase text-black/50">
                        Sem {w.weekStart.slice(5)}
                      </p>
                      <p className="mt-1.5 text-[20px] font-semibold leading-none text-black">
                        {w.completed}
                        <span className="text-[11px] font-normal text-black/40"> /{w.planned}</span>
                      </p>
                      <span className="mt-2 h-1 w-full rounded-full bg-black/[0.06]">
                        <span
                          className={classNames(
                            'block h-full rounded-full transition-all',
                            pct >= 100 ? 'bg-[#0075de]' : pct > 0 ? 'bg-[#ffb110]' : 'bg-black/[0.06]',
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

        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <section>
            <h2 className="mb-3 text-eyebrow text-black/50">Sesiones</h2>
            {loading ? (
              <Card padding="md">
                <p className="text-[14px] text-black/50">Cargando…</p>
              </Card>
            ) : sessionsList.length === 0 ? (
              <Card padding="lg">
                <p className="text-[16px] font-semibold text-black">Sin sesiones registradas</p>
                <p className="mt-1 text-[14px] text-[#615d59]">
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
                          'flex w-full items-center justify-between gap-3 rounded-[12px] border p-3.5 text-left transition-colors',
                          active
                            ? 'border-[#0075de] bg-[#e6f3fe]'
                            : 'border-black/[0.08] bg-white hover:border-black/20',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-black">
                            {formatDateLong(s.routine_date)}
                          </p>
                          <p className="mt-0.5 text-[12px] text-black/50">
                            {dow} · {dur}
                          </p>
                        </div>
                        <Tag tone={s.completed ? 'sky-tint' : 'muted'}>
                          {s.completed ? 'Hecha' : 'Pendiente'}
                        </Tag>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-eyebrow text-black/50">Detalle</h2>
            {selectedSession ? (
              <SessionDetailCard detail={selectedSession} />
            ) : (
              <Card padding="lg">
                <p className="text-[14px] text-[#615d59]">
                  Seleccioná una sesión para ver el detalle.
                </p>
              </Card>
            )}
          </section>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-eyebrow text-black/50">Progreso por ejercicio</h2>
          <Card padding="md">
            <div className="mb-5 flex flex-col gap-3">
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="h-11 w-full rounded-[8px] border border-black/10 bg-white px-3 text-[15px] text-black outline-none focus:border-black/40 md:max-w-xs"
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
              <p className="text-[14px] text-[#615d59]">
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
        'rounded-full px-3.5 h-9 text-[13px] font-medium transition-colors',
        active ? 'bg-black text-white' : 'bg-white text-black/70 border border-black/10 hover:border-black/30',
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-eyebrow text-black/50">{formatDateLong(detail.session.routine_date)}</p>
          <p className="mt-1.5 text-[18px] font-semibold leading-[1.1] text-black">
            {detail.session.completed ? 'Sesión completa' : 'Sesión parcial'}
          </p>
        </div>
        {detail.session.completed ? <Tag tone="sky-tint">Hecha</Tag> : <Tag tone="muted">Pendiente</Tag>}
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {detail.exerciseLogs
          .sort((a, b) => a.position - b.position)
          .map((log) => {
            const ex = EXERCISES.find((e) => e.id === log.exercise_id);
            const sets = (setsByLog.get(log.id) ?? []).sort((a, b) => a.set_number - b.set_number);
            const completedSets = sets.filter((s) => s.completed).length;
            return (
              <li key={log.id} className="rounded-[12px] border border-black/[0.08] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold text-black">{ex?.name ?? log.exercise_id}</p>
                  <span className="text-[12px] tabular-nums text-black/50">
                    {completedSets}/{sets.length}
                  </span>
                </div>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {sets.map((s) => (
                    <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                      <span
                        className={classNames(
                          'flex h-5 w-5 items-center justify-center rounded-full',
                          s.completed ? 'bg-[#0075de] text-white' : 'bg-black/[0.06] text-black/40',
                        )}
                      >
                        {s.completed ? <Icon.Check size={11} /> : null}
                      </span>
                      <span className="w-6 text-[12px] text-black/50">#{s.set_number}</span>
                      <span className="flex-1 tabular-nums text-black">
                        {s.weight_kg != null ? `${s.weight_kg}` : '—'} kg ×{' '}
                        {s.reps ?? '—'} reps
                      </span>
                    </li>
                  ))}
                </ul>
                {log.notes ? (
                  <p className="mt-3 border-t border-black/[0.06] pt-3 text-[13px] leading-[1.5] text-[#615d59]">
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