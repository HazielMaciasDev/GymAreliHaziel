import { db } from '@/lib/supabase';
import type { ProfileId } from '@/types';

export interface SessionRecord {
  id: string;
  profile_id: ProfileId;
  routine_date: string;
  day_of_week: number;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  notes: string | null;
}

export interface ExerciseLogRecord {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
  notes: string | null;
}

export interface SetLogRecord {
  id: string;
  exercise_log_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  completed: boolean;
}

export async function getSessionByDate(profile: ProfileId, date: string): Promise<SessionRecord | null> {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .eq('profile_id', profile)
    .eq('routine_date', date)
    .maybeSingle();
  if (error) throw error;
  return (data as SessionRecord | null) ?? null;
}

export async function startSession(
  profile: ProfileId,
  date: string,
  dayOfWeek: number,
): Promise<SessionRecord> {
  const existing = await getSessionByDate(profile, date);
  if (existing) return existing;
  const { data, error } = await db()
    .from('sessions')
    .insert({
      profile_id: profile,
      routine_date: date,
      day_of_week: dayOfWeek,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SessionRecord;
}

export async function finishSession(id: string, completed = true): Promise<void> {
  const { error } = await db()
    .from('sessions')
    .update({ ended_at: new Date().toISOString(), completed })
    .eq('id', id);
  if (error) throw error;
}

export async function addExerciseLog(
  sessionId: string,
  exerciseId: string,
  position: number,
  plannedSets: number,
  plannedReps: number,
): Promise<{ exerciseLog: ExerciseLogRecord; setLogs: SetLogRecord[] }> {
  const { data: log, error: logErr } = await db()
    .from('exercise_logs')
    .insert({ session_id: sessionId, exercise_id: exerciseId, position })
    .select()
    .single();
  if (logErr) throw logErr;
  const setRows = Array.from({ length: plannedSets }, (_, i) => ({
    exercise_log_id: log.id,
    set_number: i + 1,
    reps: plannedReps,
    weight_kg: null,
    completed: false,
  }));
  const { data: sets, error: setErr } = await db()
    .from('set_logs')
    .insert(setRows)
    .select();
  if (setErr) throw setErr;
  return { exerciseLog: log as ExerciseLogRecord, setLogs: (sets ?? []) as SetLogRecord[] };
}

export async function fetchSessionLogs(sessionId: string): Promise<{
  exerciseLogs: ExerciseLogRecord[];
  setLogs: SetLogRecord[];
}> {
  const { data: logs, error } = await db()
    .from('exercise_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });
  if (error) throw error;
  const logList = (logs ?? []) as ExerciseLogRecord[];
  if (logList.length === 0) return { exerciseLogs: [], setLogs: [] };
  const ids = logList.map((l) => l.id);
  const { data: sets, error: sErr } = await db()
    .from('set_logs')
    .select('*')
    .in('exercise_log_id', ids)
    .order('set_number', { ascending: true });
  if (sErr) throw sErr;
  return { exerciseLogs: logList, setLogs: (sets ?? []) as SetLogRecord[] };
}

export async function updateSetLog(
  setId: string,
  patch: Partial<Pick<SetLogRecord, 'weight_kg' | 'reps' | 'completed'>>,
): Promise<void> {
  const { error } = await db().from('set_logs').update(patch).eq('id', setId);
  if (error) throw error;
}

export async function updateExerciseNotes(logId: string, notes: string): Promise<void> {
  const { error } = await db().from('exercise_logs').update({ notes }).eq('id', logId);
  if (error) throw error;
}

export async function listSessions(profile: ProfileId, limit = 50): Promise<SessionRecord[]> {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .eq('profile_id', profile)
    .order('routine_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SessionRecord[];
}