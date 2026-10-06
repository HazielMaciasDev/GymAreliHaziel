export type ProfileId = 'haziel' | 'areli';

export type Difficulty = 'principiante' | 'intermedio' | 'avanzado';

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'core'
  | 'oblicuos'
  | 'cuadriceps'
  | 'femorales'
  | 'gluteos'
  | 'gemelos'
  | 'trapecio'
  | 'dorsales';

export type Equipment =
  | 'barra'
  | 'mancuerna'
  | 'maquina'
  | 'polea'
  | 'peso-corporal'
  | 'kettlebell'
  | 'banda';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  instructions: string[];
  tips: string[];
  gifPath: string;
}

export interface Routine {
  id: string;
  profileId: ProfileId;
  name: string;
  createdAt: string;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  position: number;
  sets: number;
  reps: number;
  weightKg: number | null;
  completedSets: number;
}

export interface MuscleSummary {
  muscle: MuscleGroup;
  count: number;
  isPrimary: boolean;
}