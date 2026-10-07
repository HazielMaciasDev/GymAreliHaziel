import type { Exercise as SdkExercise } from '@workoutx/sdk';
import type { Exercise, MuscleGroup, Equipment, Difficulty } from '@/types';
import { FALLBACK_EXERCISES } from '@/data/fallback';
import { getWorkoutX } from './workoutx';

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: 'pecho',
  pectorals: 'pecho',
  pecs: 'pecho',
  back: 'espalda',
  lats: 'dorsales',
  'latissimus dorsi': 'dorsales',
  traps: 'trapecio',
  trapezius: 'trapecio',
  shoulders: 'hombros',
  delts: 'hombros',
  'deltoids': 'hombros',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'antebrazos',
  abs: 'core',
  'abdominals': 'core',
  core: 'core',
  obliques: 'oblicuos',
  quads: 'cuadriceps',
  quadriceps: 'cuadriceps',
  hamstrings: 'femorales',
  glutes: 'gluteos',
  calves: 'gemelos',
  'adductors': 'femorales',
  'abductors': 'gluteos',
  neck: 'trapecio',
};

const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: 'barra',
  dumbbell: 'mancuerna',
  cable: 'polea',
  machine: 'maquina',
  'body weight': 'peso-corporal',
  bodyweight: 'peso-corporal',
  kettlebells: 'kettlebell',
  kettlebell: 'kettlebell',
  band: 'banda',
  bands: 'banda',
  'ez curl bar': 'barra',
  rope: 'polea',
  weighted: 'mancuerna',
  'stability ball': 'peso-corporal',
  'medicine ball': 'mancuerna',
  'olympic barbell': 'barra',
};

const DIFFICULTY_BY_TARGET: Record<string, Difficulty> = {
  cuello: 'principiante',
};

function mapMuscle(value: string | undefined | null): MuscleGroup | null {
  if (!value) return null;
  const key = value.toLowerCase().trim();
  return MUSCLE_MAP[key] ?? null;
}

function mapEquipment(value: string | undefined | null): Equipment {
  if (!value) return 'peso-corporal';
  const key = value.toLowerCase().trim();
  return EQUIPMENT_MAP[key] ?? 'peso-corporal';
}

function inferDifficulty(sdk: SdkExercise): Difficulty {
  const target = (sdk.target ?? '').toLowerCase();
  if (DIFFICULTY_BY_TARGET[target]) return DIFFICULTY_BY_TARGET[target];
  if (sdk.equipment === 'body weight' || sdk.equipment === 'band') return 'principiante';
  if (sdk.equipment === 'barbell' || sdk.equipment === 'dumbbell') return 'intermedio';
  if (sdk.equipment === 'cable' || sdk.equipment === 'machine') return 'principiante';
  return 'intermedio';
}

export function adaptSdkExercise(sdk: SdkExercise): Exercise | null {
  const primary = mapMuscle(sdk.target) ?? mapMuscle(sdk.bodyPart);
  if (!primary) return null;

  const secondary = (sdk.secondaryMuscles ?? [])
    .map(mapMuscle)
    .filter((m): m is MuscleGroup => Boolean(m) && m !== primary);

  const wx = getWorkoutX();
  const gifPath = sdk.id ? wx.gifUrl(`${sdk.id}.gif`) : '';

  return {
    id: sdk.id,
    name: sdk.name,
    description: `${sdk.bodyPart ?? ''}${sdk.equipment ? ` · ${sdk.equipment}` : ''}`.trim(),
    primaryMuscle: primary,
    secondaryMuscles: Array.from(new Set(secondary)),
    equipment: mapEquipment(sdk.equipment),
    difficulty: inferDifficulty(sdk),
    instructions: (sdk.instructions ?? []).slice(0, 6),
    tips: [],
    gifPath,
  };
}

export async function fetchExercisesFromSdk(limit = 60): Promise<Exercise[]> {
  const wx = getWorkoutX();
  const page = await wx.exercises.list({ limit });
  const mapped = page.data.map(adaptSdkExercise).filter((e): e is Exercise => Boolean(e));
  if (mapped.length === 0) {
    throw new Error('WorkoutX returned 0 mappable exercises');
  }
  return mapped;
}

export function getFallbackExercises(): Exercise[] {
  return FALLBACK_EXERCISES;
}