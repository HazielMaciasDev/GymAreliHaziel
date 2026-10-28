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
  default_weight_kg?: number | null;
}

export interface EntryPlan {
  sets: number;
  reps: number;
  weightKg: number | null;
}

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;

/**
 * `weekly_routine.default_weight_kg` se agrega por migración. Si la columna
 * todavía no existe en la base, los writes con peso fallan: los reintentamos
 * sin el campo para que la app siga funcionando y el peso se empiece a
 * guardar solo en cuanto corra la migración.
 */
function isMissingWeightColumn(error: {
  code?: string;
  message?: string;
  details?: string;
} | null): boolean {
  if (!error) return false;
  const raw = `${error.message ?? ''} ${error.details ?? ''} ${error.code ?? ''}`.toLowerCase();
  if (!raw.includes('default_weight_kg')) return false;
  return (
    raw.includes('could not find') ||
    raw.includes('does not exist') ||
    raw.includes('unknown column') ||
    raw.includes('42703') ||
    raw.includes('pgrst204')
  );
}

function withoutWeight<T extends Record<string, unknown>>(patch: T): Omit<T, 'default_weight_kg'> {
  const { default_weight_kg: _ignored, ...rest } = patch as Record<string, unknown>;
  return rest as Omit<T, 'default_weight_kg'>;
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
  plan: EntryPlan = { sets: DEFAULT_SETS, reps: DEFAULT_REPS, weightKg: null },
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

  const row = {
    profile_id: profile,
    day_of_week: dayOfWeek,
    exercise_id: exerciseId,
    position: nextPosition,
    default_sets: plan.sets,
    default_reps: plan.reps,
    default_weight_kg: plan.weightKg,
  };

  let { data, error } = await db().from('weekly_routine').insert(row).select().single();
  if (error && isMissingWeightColumn(error)) {
    const retry = await db()
      .from('weekly_routine')
      .insert(withoutWeight(row))
      .select()
      .single();
    if (retry.error) throw retry.error;
    data = retry.data;
    error = null;
  }
  if (error) throw error;
  return data as WeeklyRoutineEntry;
}

export async function updateEntryPlan(id: string, plan: Partial<EntryPlan>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (plan.sets !== undefined) patch.default_sets = plan.sets;
  if (plan.reps !== undefined) patch.default_reps = plan.reps;
  if (plan.weightKg !== undefined) patch.default_weight_kg = plan.weightKg;

  const { error } = await db().from('weekly_routine').update(patch).eq('id', id);
  if (error && isMissingWeightColumn(error)) {
    const { error: retryErr } = await db()
      .from('weekly_routine')
      .update(withoutWeight(patch))
      .eq('id', id);
    if (retryErr) throw retryErr;
    return;
  }
  if (error) throw error;
}

/** Las series son iguales para todas las entradas del día: se escriben en todas. */
export async function updateDaySets(profile: ProfileId, dayOfWeek: number, sets: number): Promise<void> {
  const { error } = await db()
    .from('weekly_routine')
    .update({ default_sets: sets })
    .eq('profile_id', profile)
    .eq('day_of_week', dayOfWeek);
  if (error) throw error;
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

/** Series planificadas para un día (todas las entradas del día comparten el valor). */
export function daySets(entries: WeeklyRoutineEntry[], dayOfWeek: number): number {
  const dayEntries = entries.filter((e) => e.day_of_week === dayOfWeek);
  if (dayEntries.length === 0) return DEFAULT_SETS;
  return Math.max(...dayEntries.map((e) => e.default_sets));
}
