import { db } from '@/lib/supabase';
import type { ProfileId } from '@/types';

export interface AdherenceWeek {
  weekStart: string;
  planned: number;
  completed: number;
}

export interface ExerciseProgressPoint {
  date: string;
  maxWeightKg: number;
  totalVolume: number;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

export async function fetchAdherenceWeeks(profile: ProfileId, weeks = 8): Promise<AdherenceWeek[]> {
  const today = startOfWeek(new Date());
  const since = new Date(today);
  since.setDate(since.getDate() - 7 * (weeks - 1));

  const { data: routine, error: rErr } = await db()
    .from('weekly_routine')
    .select('day_of_week')
    .eq('profile_id', profile);
  if (rErr) throw rErr;
  const distinctDays = new Set<number>();
  for (const row of routine ?? []) {
    distinctDays.add(row.day_of_week as number);
  }

  const { data: sessions, error: sErr } = await db()
    .from('sessions')
    .select('routine_date, completed')
    .eq('profile_id', profile)
    .gte('routine_date', toIsoDate(since));
  if (sErr) throw sErr;

  const completedDates = new Set<string>();
  for (const s of sessions ?? []) {
    if (s.completed) completedDates.add(s.routine_date as string);
  }

  const result: AdherenceWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    const ws = new Date(since);
    ws.setDate(ws.getDate() + 7 * i);
    let planned = 0;
    let completed = 0;
    for (const dow of distinctDays) {
      const d = new Date(ws);
      d.setDate(d.getDate() + dow);
      const iso = toIsoDate(d);
      planned += 1;
      if (completedDates.has(iso)) completed += 1;
    }
    result.push({ weekStart: toIsoDate(ws), planned, completed });
  }
  return result;
}

export async function fetchExerciseProgress(
  profile: ProfileId,
  exerciseId: string,
): Promise<ExerciseProgressPoint[]> {
  const { data: logs, error } = await db()
    .from('exercise_logs')
    .select('id, sessions!inner(profile_id, routine_date)')
    .eq('exercise_id', exerciseId)
    .eq('sessions.profile_id', profile)
    .order('sessions.routine_date', { ascending: true });
  if (error) throw error;

  const logList = logs ?? [];
  if (logList.length === 0) return [];

  const ids = logList.map((l) => l.id as string);
  const { data: sets, error: sErr } = await db()
    .from('set_logs')
    .select('exercise_log_id, weight_kg, reps, completed')
    .in('exercise_log_id', ids)
    .eq('completed', true);
  if (sErr) throw sErr;

  const map = new Map<string, { date: string; maxWeight: number; volume: number }>();
  for (const log of logList) {
    const session = log.sessions as unknown as { routine_date: string };
    map.set(log.id as string, { date: session.routine_date, maxWeight: 0, volume: 0 });
  }
  for (const set of sets ?? []) {
    const entry = map.get(set.exercise_log_id as string);
    if (!entry) continue;
    const w = (set.weight_kg as number | null) ?? 0;
    const r = (set.reps as number | null) ?? 0;
    entry.maxWeight = Math.max(entry.maxWeight, w);
    entry.volume += w * r;
  }
  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({ date: p.date, maxWeightKg: p.maxWeight, totalVolume: p.volume }));
}