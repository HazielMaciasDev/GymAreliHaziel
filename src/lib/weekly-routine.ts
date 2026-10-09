import { db } from '@/lib/supabase';
import type { ProfileId } from '@/types';

export interface WeeklyRoutineEntry {
  id: string;
  profile_id: ProfileId;
  day_of_week: number;
  exercise_id: string;
  position: number;
  default_sets: number;
  default_reps: number;
}

export async function fetchWeeklyRoutine(profile: ProfileId): Promise<WeeklyRoutineEntry[]> {
  const { data, error } = await db()
    .from('weekly_routine')
    .select('*')
    .eq('profile_id', profile)
    .order('day_of_week', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeeklyRoutineEntry[];
}

export async function addExerciseToDay(
  profile: ProfileId,
  dayOfWeek: number,
  exerciseId: string,
  defaultSets = 3,
  defaultReps = 10,
  position?: number,
): Promise<WeeklyRoutineEntry> {
  let nextPosition = position;
  if (nextPosition === undefined) {
    const { data: existing, error: readErr } = await db()
      .from('weekly_routine')
      .select('position')
      .eq('profile_id', profile)
      .eq('day_of_week', dayOfWeek)
      .order('position', { ascending: false })
      .limit(1);
    if (readErr) throw readErr;
    nextPosition = existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0;
  }

  const { data, error } = await db()
    .from('weekly_routine')
    .insert({
      profile_id: profile,
      day_of_week: dayOfWeek,
      exercise_id: exerciseId,
      position: nextPosition,
      default_sets: defaultSets,
      default_reps: defaultReps,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WeeklyRoutineEntry;
}

export async function removeFromRoutine(id: string): Promise<void> {
  const { error } = await db().from('weekly_routine').delete().eq('id', id);
  if (error) throw error;
}

export async function moveExercise(
  id: string,
  toDayOfWeek: number,
  toIndex: number,
): Promise<void> {
  const { data: row, error: readErr } = await db()
    .from('weekly_routine')
    .select('profile_id, day_of_week, position')
    .eq('id', id)
    .single();
  if (readErr) throw readErr;

  const fromDay = row.day_of_week as number;
  const profileId = row.profile_id as ProfileId;

  if (fromDay === toDayOfWeek) {
    const { data: siblings, error: sErr } = await db()
      .from('weekly_routine')
      .select('id, position')
      .eq('profile_id', profileId)
      .eq('day_of_week', toDayOfWeek)
      .order('position', { ascending: true });
    if (sErr) throw sErr;
    const filtered = (siblings ?? []).filter((s) => s.id !== id) as { id: string; position: number }[];
    filtered.splice(toIndex, 0, { id, position: -1 });
    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i].id === id) continue;
      const item = filtered[i];
      await db().from('weekly_routine').update({ position: i }).eq('id', item.id);
    }
    await db().from('weekly_routine').update({ position: toIndex, day_of_week: toDayOfWeek }).eq('id', id);
  } else {
    const { data: sourceSiblings, error: sErr } = await db()
      .from('weekly_routine')
      .select('id, position')
      .eq('profile_id', profileId)
      .eq('day_of_week', fromDay)
      .order('position', { ascending: true });
    if (sErr) throw sErr;
    const sourceFiltered = (sourceSiblings ?? [])
      .filter((s) => s.id !== id)
      .sort((a, b) => (a.position as number) - (b.position as number));
    for (let i = 0; i < sourceFiltered.length; i++) {
      const item = sourceFiltered[i];
      await db().from('weekly_routine').update({ position: i }).eq('id', item.id);
    }

    const { data: targetSiblings, error: tErr } = await db()
      .from('weekly_routine')
      .select('id, position')
      .eq('profile_id', profileId)
      .eq('day_of_week', toDayOfWeek)
      .order('position', { ascending: true });
    if (tErr) throw tErr;
    const targetList = (targetSiblings ?? []).sort((a, b) => (a.position as number) - (b.position as number));
    targetList.splice(toIndex, 0, { id, position: -1 });
    for (let i = 0; i < targetList.length; i++) {
      const item = targetList[i];
      await db().from('weekly_routine').update({ position: i }).eq('id', item.id);
    }
    await db().from('weekly_routine').update({ position: toIndex, day_of_week: toDayOfWeek }).eq('id', id);
  }
}

export async function clearDay(profile: ProfileId, dayOfWeek: number): Promise<void> {
  const { error } = await db()
    .from('weekly_routine')
    .delete()
    .eq('profile_id', profile)
    .eq('day_of_week', dayOfWeek);
  if (error) throw error;
}

export function entryHasExercise(entries: WeeklyRoutineEntry[], dayOfWeek: number, exerciseId: string): boolean {
  return entries.some((e) => e.day_of_week === dayOfWeek && e.exercise_id === exerciseId);
}