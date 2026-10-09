import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import {
  fetchAdherenceWeeks,
  type AdherenceWeek,
} from '@/lib/history';
import {
  fetchSessionLogs,
  listSessions,
  type SessionRecord,
} from '@/lib/sessions';
import { EXERCISES } from '@/data/exercises';
import {
  DAYS_OF_WEEK,
  classNames,
  dayOfWeekFromDate,
  formatDateLong,
  formatDuration,
  isRestDay,
  toIsoDate,
} from '@/lib/format';
import { MUSCLES } from '@/lib/muscles';
import { ExerciseMedia } from '@/components/ExerciseMedia';

interface SessionDetail {
  session: SessionRecord;
  exerciseLogs: { id: string; exercise_id: string; position: number; notes: string | null }[];
  setLogs: { id: string; exercise_log_id: string; set_number: number; weight_kg: number | null; reps: number | null; completed: boolean }[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function HistoryPage() {
  const { profile } = useProfile();
  const [sessionsList, setSessionsList] = useState<SessionRecord[]>([]);
  const [adherence, setAdherence] = useState<AdherenceWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Map<string, SessionDetail>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const sessionRefs = useRef<Map<string, HTMLLIElement>>(new Map());

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
          listSessions(profile, 60),
          fetchAdherenceWeeks(profile, 8),
        ]);
        if (cancelled) return;
        setSessionsList(sessions);
        setAdherence(weeks);
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
    if (!selectedDate) return;
    const session = sessionsList.find((s) => s.routine_date === selectedDate);
    if (!session) return;
    setExpandedSessionId(session.id);
    if (!sessionDetails.has(session.id)) {
      (async () => {
        const detail = await fetchSessionLogs(session.id);
        const next = new Map(sessionDetails);
        next.set(session.id, {
          session,
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
        setSessionDetails(next);
      })();
    }
    const el = sessionRefs.current.get(session.id);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [selectedDate, sessionsList, sessionDetails]);

  const onDayClick = (cell: { date: string; isCurrentMonth: boolean; hasSession: boolean; isToday: boolean; isRest: boolean }) => {
    if (!cell.isCurrentMonth || !cell.date) return;
    if (selectedDate === cell.date) {
      setSelectedDate(null);
      setExpandedSessionId(null);
      return;
    }
    setSelectedDate(cell.date);
  };

  const selectedDayHasSession = selectedDate
    ? sessionsList.some((s) => s.routine_date === selectedDate)
    : true;

  const toggleSession = async (s: SessionRecord) => {
    if (expandedSessionId === s.id) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(s.id);
    if (!sessionDetails.has(s.id)) {
      const detail = await fetchSessionLogs(s.id);
      const next = new Map(sessionDetails);
      next.set(s.id, {
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
      setSessionDetails(next);
    }
  };

  if (!profile) return null;

  const today = new Date();
  const sessionsThisMonth = sessionsList.filter((s) => {
    const d = new Date(s.routine_date + 'T00:00:00');
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }).length;

  // Build the calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startDayOfWeek = dayOfWeekFromDate(firstDay); // 0 = Mon
    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
    const cells: { date: string; day: number; isRest: boolean; isCurrentMonth: boolean; isToday: boolean; hasSession: boolean; sessionCompleted: boolean }[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ date: '', day: 0, isRest: false, isCurrentMonth: false, isToday: false, hasSession: false, sessionCompleted: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(calendarMonth.year, calendarMonth.month, d);
      const iso = toIsoDate(dateObj);
      const dow = dayOfWeekFromDate(dateObj);
      const session = sessionsList.find((s) => s.routine_date === iso);
      cells.push({
        date: iso,
        day: d,
        isRest: isRestDay(dow),
        isCurrentMonth: true,
        isToday: iso === toIsoDate(today),
        hasSession: !!session,
        sessionCompleted: session?.completed ?? false,
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: '', day: 0, isRest: false, isCurrentMonth: false, isToday: false, hasSession: false, sessionCompleted: false });
    }
    return cells;
  }, [calendarMonth, sessionsList, today]);

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        {/* Hero */}
        <section className="relative">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="t-eyebrow text-[#80827f]">Tu progreso</span>
              <h1 className="mt-3 t-display text-[#2c2e2a]">Historial.</h1>
              <p className="mt-3 max-w-[44ch] t-body-lg text-[#2c2e2a]">
                Mirá tus sesiones, pesos y repeticiones. Encontrá patrones en tu entrenamiento.
              </p>
            </div>
            <div className="hidden text-right md:block">
              <span className="t-eyebrow text-[#80827f]">Este mes</span>
              <p className="mt-1 t-display text-[#2c2e2a] leading-[0.9] tabular-nums">
                {sessionsThisMonth}
              </p>
              <p className="t-eyebrow text-[#80827f]">
                {sessionsThisMonth === 1 ? 'sesión' : 'sesiones'}
              </p>
            </div>
          </div>
          <div className="absolute right-0 top-0 hidden md:block">
            <Sparkle size={36} color="#ff705d" className="animate-float" />
          </div>
        </section>

        {error ? (
          <Card padding="md" className="mt-6 border-[#ff705d]">
            <p className="text-[14px] text-[#ff705d]">{error}</p>
          </Card>
        ) : null}

        {/* Calendar */}
        <section className="mt-8 md:mt-12">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const m = calendarMonth.month === 0 ? 11 : calendarMonth.month - 1;
                const y = calendarMonth.month === 0 ? calendarMonth.year - 1 : calendarMonth.year;
                setCalendarMonth({ year: y, month: m });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-[#e0dbce]"
              aria-label="Mes anterior"
            >
              <Icon.ChevronLeft size={16} />
            </button>
            <h2 className="t-heading-sm text-[#2c2e2a]">
              {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
            </h2>
            <button
              type="button"
              onClick={() => {
                const m = calendarMonth.month === 11 ? 0 : calendarMonth.month + 1;
                const y = calendarMonth.month === 11 ? calendarMonth.year + 1 : calendarMonth.year;
                setCalendarMonth({ year: y, month: m });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-[#e0dbce]"
              aria-label="Mes siguiente"
            >
              <Icon.ChevronRight size={16} />
            </button>
          </div>
          <div className="rounded-[50px] bg-white p-4 md:p-5">
            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d.id} className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80827f]">
                  {d.short.charAt(0)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarGrid.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <div key={idx} className="aspect-square" />;
                }
                const isSelected = selectedDate === cell.date;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onDayClick(cell)}
                    aria-label={`Ver día ${cell.day}`}
                    className={classNames(
                      'relative flex aspect-square items-center justify-center rounded-full text-[12px] font-medium tabular-nums transition-all',
                      'hover:scale-110 active:scale-95 cursor-pointer',
                      cell.isRest && !cell.hasSession
                        ? 'border-2 border-dashed border-[#2c2e2a]/10 bg-transparent text-[#80827f]'
                        : cell.sessionCompleted
                          ? 'bg-[#8ed462] text-[#2c2e2a]'
                          : cell.hasSession
                            ? 'bg-[#f5e211] text-[#2c2e2a]'
                            : 'bg-[#f5f1e4] text-[#2c2e2a]',
                      cell.isToday && !isSelected && 'ring-2 ring-[#2c2e2a] ring-offset-1 ring-offset-white',
                      isSelected && 'ring-[3px] ring-[#2c2e2a] ring-offset-2 ring-offset-white',
                    )}
                  >
                    {cell.day}
                    {cell.sessionCompleted ? (
                      <Icon.Check size={9} className="absolute bottom-0.5 right-0.5" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] tracking-[0.12em] uppercase text-[#80827f]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8ed462]" />
                Hecha
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f5e211]" />
                Pendiente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f5f1e4]" />
                Sin sesión
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-[#2c2e2a]/15" />
                Descanso
              </span>
            </div>
          </div>
        </section>

        {/* Sessions list */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="t-eyebrow text-[#80827f]">Sesiones</h2>
            {selectedDate ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setExpandedSessionId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2c2e2a] px-3 h-8 text-[12px] font-semibold text-[#f5f1e4] hover:bg-[#1f211d]"
              >
                Ver todas
                <Icon.Close size={12} />
              </button>
            ) : null}
          </div>

          {selectedDate && !selectedDayHasSession ? (
            <Card padding="md" className="mb-4 border-dashed">
              <p className="text-[14px] text-[#2c2e2a]">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="mt-1 text-[13px] text-[#80827f]">
                Ese día no tiene sesión registrada.
              </p>
            </Card>
          ) : null}

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
            <ul className="flex flex-col gap-3">
              {sessionsList.map((s) => {
                const dow = DAYS_OF_WEEK[s.day_of_week];
                const isExpanded = expandedSessionId === s.id;
                const detail = sessionDetails.get(s.id) ?? null;
                const dur = s.ended_at
                  ? Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
                  : 0;
                const completedSets = detail ? detail.setLogs.filter((set) => set.completed).length : 0;
                const totalSets = detail ? detail.setLogs.length : 0;
                const totalReps = detail
                  ? detail.setLogs.filter((set) => set.completed).reduce((acc, set) => acc + (set.reps ?? 0), 0)
                  : 0;
                return (
                  <li
                    key={s.id}
                    ref={(el) => {
                      if (el) sessionRefs.current.set(s.id, el);
                      else sessionRefs.current.delete(s.id);
                    }}
                  >
                    <div
                      className={classNames(
                        'overflow-hidden rounded-[32px] border-2 transition-colors',
                        isExpanded ? 'border-[#2c2e2a] bg-white' : 'border-[#2c2e2a]/10 bg-white hover:border-[#2c2e2a]/30',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSession(s)}
                        className="flex w-full items-center gap-4 p-4 text-left"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f5e211] text-[14px] font-semibold text-[#2c2e2a]">
                          {dow?.short ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[16px] font-semibold text-[#2c2e2a]">
                            {formatDateLong(s.routine_date)}
                          </p>
                          <p className="mt-0.5 t-eyebrow text-[#80827f]">
                            {dur > 0 ? formatDuration(dur) : 'En curso'} · {s.completed ? 'completa' : 'parcial'}
                          </p>
                        </div>
                        {s.completed ? (
                          <Tag tone="grass" size="sm">Hecha</Tag>
                        ) : (
                          <Tag tone="sandstone" size="sm">Parcial</Tag>
                        )}
                        <Icon.ChevronDown
                          size={16}
                          className={classNames(
                            'shrink-0 text-[#80827f] transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </button>

                      {isExpanded && detail ? (
                        <SessionExpandedDetail detail={detail} />
                      ) : null}

                      {isExpanded && detail ? (
                        <div className="flex flex-wrap items-center gap-2 border-t-2 border-[#2c2e2a]/5 bg-[#f5f1e4] px-4 py-3 text-[12px] text-[#2c2e2a]/80">
                          <span>
                            <span className="font-semibold text-[#2c2e2a]">{completedSets}</span>
                            <span className="text-[#80827f]">/{totalSets} sets</span>
                          </span>
                          <span className="text-[#80827f]">·</span>
                          <span>
                            <span className="font-semibold text-[#2c2e2a]">{totalReps}</span>
                            <span className="text-[#80827f]"> reps</span>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SessionExpandedDetail({ detail }: { detail: SessionDetail }) {
  const setsByLog = new Map<string, typeof detail.setLogs>();
  for (const s of detail.setLogs) {
    if (!setsByLog.has(s.exercise_log_id)) setsByLog.set(s.exercise_log_id, []);
    setsByLog.get(s.exercise_log_id)!.push(s);
  }
  const sortedLogs = [...detail.exerciseLogs].sort((a, b) => a.position - b.position);
  return (
    <div className="grid grid-cols-1 gap-3 border-t-2 border-[#2c2e2a]/5 bg-[#f5f1e4] p-4 sm:grid-cols-2">
      {sortedLogs.map((log) => {
        const ex = EXERCISES.find((e) => e.id === log.exercise_id);
        const sets = (setsByLog.get(log.id) ?? []).sort((a, b) => a.set_number - b.set_number);
        const completedSets = sets.filter((s) => s.completed).length;
        return (
          <div
            key={log.id}
            className="overflow-hidden rounded-[20px] border border-[#2c2e2a]/10 bg-white"
          >
            {ex ? (
              <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f1e4]">
                <ExerciseMedia
                  src={ex.gifPath}
                  alt={ex.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '0.15';
                  }}
                />
                <div className="absolute left-2 top-2">
                  <Tag tone="grass" size="sm">{MUSCLES[ex.primaryMuscle].label}</Tag>
                </div>
              </div>
            ) : null}
            <div className="p-3">
              <p className="truncate text-[13px] font-semibold text-[#2c2e2a]">
                {ex?.name ?? log.exercise_id}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {sets.map((s) => {
                  const w = s.weight_kg;
                  const r = s.reps;
                  return (
                    <div
                      key={s.id}
                      className={classNames(
                        'flex items-center justify-between gap-1 rounded-full border-2 px-2.5 py-1 text-[11px] tabular-nums',
                        s.completed
                          ? 'border-[#8ed462] bg-[#8ed462]/15 text-[#2c2e2a]'
                          : 'border-[#2c2e2a]/10 text-[#80827f]',
                      )}
                    >
                      <span className="font-semibold">#{s.set_number}</span>
                      <span>
                        {w != null ? `${w}kg` : '—'} × {r ?? '—'}
                      </span>
                      {s.completed ? <Icon.Check size={9} /> : null}
                    </div>
                  );
                })}
              </div>
              {completedSets === sets.length && sets.length > 0 ? (
                <p className="mt-2 t-eyebrow text-[#8ed462]">
                  {sets.length} sets completos
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
