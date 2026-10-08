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
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 md:mb-10">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Sesiones pasadas</p>
          <h1 className="mt-2 font-display text-[clamp(40px,5vw,60px)] leading-[0.95] text-forest-ink">
            HISTORIAL
          </h1>
        </header>

        {error ? (
          <div className="border border-alarm-red bg-paper px-4 py-3 text-[13px] text-alarm-red">
            {error}
          </div>
        ) : null}

        <section className="mb-8">
          <h2 className="mb-4 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Adherencia semanal</h2>
          <Card padding="md">
            {loading ? (
              <p className="text-[13px] text-pebble">Cargando…</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
                {adherence.map((w) => {
                  const pct = w.planned > 0 ? (w.completed / w.planned) * 100 : 0;
                  return (
                    <div key={w.weekStart} className="border border-fog p-3">
                      <p className="text-[10px] tracking-[0.08em] uppercase text-pebble">
                        Sem {w.weekStart.slice(5)}
                      </p>
                      <p className="mt-2 text-[20px] font-semibold leading-none text-forest-ink">
                        {w.completed}
                        <span className="text-[12px] font-normal text-pebble"> / {w.planned}</span>
                      </p>
                      <span className="mt-3 block h-1 bg-fog">
                        <span
                          className={classNames(
                            'block h-full',
                            pct >= 100 ? 'bg-forest-ink' : pct > 0 ? 'bg-lime-voltage' : 'bg-fog',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <section>
            <h2 className="mb-4 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Sesiones</h2>
            {loading ? (
              <p className="text-[13px] text-pebble">Cargando…</p>
            ) : sessionsList.length === 0 ? (
              <Card padding="md">
                <p className="text-[14px] text-charcoal">Sin sesiones registradas</p>
                <p className="mt-1 text-[12px] text-pebble">Cuando termines una rutina, va a quedar acá.</p>
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
                          'flex w-full items-center justify-between gap-4 border p-3 text-left transition-colors',
                          active
                            ? 'border-forest-ink bg-linen-mist'
                            : 'border-fog bg-paper hover:border-forest-ink',
                        )}
                      >
                        <div>
                          <p className="text-[14px] font-semibold text-forest-ink">
                            {formatDateLong(s.routine_date)}
                          </p>
                          <p className="mt-1 text-[11px] tracking-[0.08em] uppercase text-pebble">
                            {dow} · {dur}
                          </p>
                        </div>
                        <Tag tone={s.completed ? 'invert' : 'muted'}>
                          {s.completed ? 'HECHA' : 'PENDIENTE'}
                        </Tag>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Detalle</h2>
            {selectedSession ? (
              <SessionDetailCard detail={selectedSession} />
            ) : (
              <Card padding="md">
                <p className="text-[14px] text-charcoal">Seleccioná una sesión para ver el detalle.</p>
              </Card>
            )}
          </section>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">Progreso por ejercicio</h2>
          <Card padding="md">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
              <p className="text-[13px] text-slate">Ejercicio:</p>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="h-10 border border-fog bg-paper px-3 text-[14px] text-forest-ink outline-none focus:border-forest-ink"
              >
                <option value="">Elegí uno</option>
                {profileExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            {selectedExerciseId ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
                    Peso máximo por fecha
                  </p>
                  <ProgressChart data={progress} metric="maxWeight" />
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
                    Volumen semanal
                  </p>
                  <ProgressChart data={progress} metric="volume" />
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-pebble">Seleccioná un ejercicio para ver su progreso.</p>
            )}
          </Card>
        </section>
      </div>
    </AppShell>
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
      <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
        {formatDateLong(detail.session.routine_date)}
      </p>
      <p className="mt-2 text-[18px] font-semibold text-forest-ink">
        {detail.session.completed ? 'Sesión completa' : 'Sesión parcial'}
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {detail.exerciseLogs
          .sort((a, b) => a.position - b.position)
          .map((log) => {
            const ex = EXERCISES.find((e) => e.id === log.exercise_id);
            const sets = (setsByLog.get(log.id) ?? []).sort((a, b) => a.set_number - b.set_number);
            const completedSets = sets.filter((s) => s.completed).length;
            return (
              <li key={log.id} className="border border-fog p-3">
                <p className="text-[14px] font-semibold text-forest-ink">{ex?.name ?? log.exercise_id}</p>
                <p className="mt-1 text-[11px] tracking-[0.08em] uppercase text-pebble">
                  {completedSets} / {sets.length} sets
                </p>
                <ul className="mt-3 flex flex-col gap-1">
                  {sets.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 text-[12px]">
                      <span className="w-6 text-pebble">#{s.set_number}</span>
                      <span className="flex-1 tabular-nums text-charcoal">
                        {s.weight_kg != null ? `${s.weight_kg} kg` : '— kg'} × {s.reps ?? '—'} reps
                      </span>
                      <span
                        className={classNames(
                          'inline-flex h-4 w-4 items-center justify-center',
                          s.completed ? 'bg-forest-ink text-paper' : 'bg-fog text-pebble',
                        )}
                      >
                        {s.completed ? <Icon.Check size={10} /> : null}
                      </span>
                    </li>
                  ))}
                </ul>
                {log.notes ? (
                  <p className="mt-3 border-t border-fog text-[12px] leading-[1.5] text-slate">
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