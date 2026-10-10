import { db } from '@/lib/supabase';
import type { ProfileId } from '@/types';

export interface BodyMetric {
  id: string;
  profile_id: ProfileId;
  measured_on: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface ProfileMeta {
  profile_id: ProfileId;
  height_cm: number | null;
  updated_at: string;
}

export async function listBodyMetrics(profile: ProfileId): Promise<BodyMetric[]> {
  const { data, error } = await db()
    .from('body_metrics')
    .select('*')
    .eq('profile_id', profile)
    .order('measured_on', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BodyMetric[];
}

export async function upsertBodyMetric(
  profile: ProfileId,
  measuredOn: string,
  weightKg: number,
  notes: string | null = null,
): Promise<BodyMetric> {
  const { data, error } = await db()
    .from('body_metrics')
    .upsert(
      { profile_id: profile, measured_on: measuredOn, weight_kg: weightKg, notes },
      { onConflict: 'profile_id,measured_on' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as BodyMetric;
}

export async function deleteBodyMetric(id: string): Promise<void> {
  const { error } = await db().from('body_metrics').delete().eq('id', id);
  if (error) throw error;
}

export async function getProfileMeta(profile: ProfileId): Promise<ProfileMeta | null> {
  const { data, error } = await db()
    .from('profile_meta')
    .select('*')
    .eq('profile_id', profile)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileMeta | null) ?? null;
}

export async function setProfileHeight(
  profile: ProfileId,
  heightCm: number | null,
): Promise<void> {
  const { error } = await db()
    .from('profile_meta')
    .upsert(
      {
        profile_id: profile,
        height_cm: heightCm,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' },
    );
  if (error) throw error;
}

export interface SessionVolumePoint {
  date: string;
  totalVolume: number;
  completedSets: number;
}

export async function fetchSessionVolume(profile: ProfileId, limit = 30): Promise<SessionVolumePoint[]> {
  const { data: sessions, error: sErr } = await db()
    .from('sessions')
    .select('id, routine_date')
    .eq('profile_id', profile)
    .order('routine_date', { ascending: true })
    .limit(limit);
  if (sErr) throw sErr;
  const sessionList = (sessions ?? []) as { id: string; routine_date: string }[];
  if (sessionList.length === 0) return [];

  const sessionIds = sessionList.map((s) => s.id);
  const { data: logs, error: lErr } = await db()
    .from('exercise_logs')
    .select('id, session_id')
    .in('session_id', sessionIds);
  if (lErr) throw lErr;
  const logList = (logs ?? []) as { id: string; session_id: string }[];
  if (logList.length === 0) return [];

  const logIds = logList.map((l) => l.id);
  const { data: sets, error: stErr } = await db()
    .from('set_logs')
    .select('exercise_log_id, weight_kg, reps, completed')
    .in('exercise_log_id', logIds)
    .eq('completed', true);
  if (stErr) throw stErr;

  const logToSession = new Map<string, string>();
  for (const l of logList) logToSession.set(l.id, l.session_id);

  const sessionMeta = new Map<string, { date: string; volume: number; completedSets: number }>();
  for (const s of sessionList) {
    sessionMeta.set(s.id, { date: s.routine_date, volume: 0, completedSets: 0 });
  }
  for (const set of sets ?? []) {
    const sessId = logToSession.get(set.exercise_log_id as string);
    if (!sessId) continue;
    const entry = sessionMeta.get(sessId);
    if (!entry) continue;
    const w = (set.weight_kg as number | null) ?? 0;
    const r = (set.reps as number | null) ?? 0;
    entry.volume += w * r;
    entry.completedSets += 1;
  }
  return Array.from(sessionMeta.values())
    .filter((p) => p.completedSets > 0)
    .map((p) => ({ date: p.date, totalVolume: p.volume, completedSets: p.completedSets }));
}

export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number;
  achievedOn: string;
  reps: number;
}

export async function fetchPersonalRecords(profile: ProfileId): Promise<PersonalRecord[]> {
  const { data: logs, error: lErr } = await db()
    .from('exercise_logs')
    .select('id, exercise_id, sessions!inner(profile_id, routine_date)')
    .eq('sessions.profile_id', profile);
  if (lErr) throw lErr;
  const logList = ((logs ?? []) as unknown as {
    id: string;
    exercise_id: string;
    sessions: { routine_date: string } | { routine_date: string }[];
  }[]).map((l) => ({
    id: l.id,
    exercise_id: l.exercise_id,
    date: Array.isArray(l.sessions) ? l.sessions[0]?.routine_date : l.sessions.routine_date,
  })) as { id: string; exercise_id: string; date: string }[];
  if (logList.length === 0) return [];

  const logIds = logList.map((l) => l.id);
  const { data: sets, error: sErr } = await db()
    .from('set_logs')
    .select('exercise_log_id, weight_kg, reps, completed')
    .in('exercise_log_id', logIds)
    .eq('completed', true)
    .gt('weight_kg', 0);
  if (sErr) throw sErr;

  const logMeta = new Map<string, { exerciseId: string; date: string }>();
  for (const l of logList) {
    logMeta.set(l.id, { exerciseId: l.exercise_id, date: l.date });
  }

  const records = new Map<string, PersonalRecord>();
  for (const set of sets ?? []) {
    const meta = logMeta.get(set.exercise_log_id as string);
    if (!meta) continue;
    const w = (set.weight_kg as number | null) ?? 0;
    const r = (set.reps as number | null) ?? 0;
    if (w <= 0) continue;
    const existing = records.get(meta.exerciseId);
    if (!existing || w > existing.maxWeight) {
      records.set(meta.exerciseId, {
        exerciseId: meta.exerciseId,
        maxWeight: w,
        achievedOn: meta.date,
        reps: r,
      });
    } else if (w === existing.maxWeight && meta.date > existing.achievedOn) {
      existing.achievedOn = meta.date;
      existing.reps = r;
    }
  }
  return Array.from(records.values()).sort((a, b) => b.maxWeight - a.maxWeight);
}
