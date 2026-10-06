import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Exercise, ProfileId, Routine, RoutineExercise } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export interface DbRoutine {
  id: string;
  profile_id: ProfileId;
  name: string;
  created_at: string;
}

export interface DbRoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps: number;
  weight_kg: number | null;
  completed_sets: number;
}

export function rowToRoutine(row: DbRoutine): Routine {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function rowToRoutineExercise(row: DbRoutineExercise): RoutineExercise {
  return {
    id: row.id,
    routineId: row.routine_id,
    exerciseId: row.exercise_id,
    position: row.position,
    sets: row.sets,
    reps: row.reps,
    weightKg: row.weight_kg,
    completedSets: row.completed_sets,
  };
}

export function exerciseToRow(ex: Exercise) {
  return {
    id: ex.id,
    name: ex.name,
    description: ex.description,
    primary_muscle: ex.primaryMuscle,
    secondary_muscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    instructions: ex.instructions,
    tips: ex.tips,
    gif_path: ex.gifPath,
  };
}