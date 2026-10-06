import type { MuscleGroup, ProfileId } from '@/types';
import type { ProfileMeta } from '@/lib/profiles';

export interface MuscleMeta {
  id: MuscleGroup;
  label: string;
  surface: 'lime-voltage' | 'linen-mist' | 'spruce' | 'forest-ink';
  icon: string;
}

export const MUSCLES: Record<MuscleGroup, MuscleMeta> = {
  pecho: { id: 'pecho', label: 'Pecho', surface: 'lime-voltage', icon: 'M3 12c2-3 5-4 8-4s6 1 8 4M9 16v3M15 16v3' },
  espalda: { id: 'espalda', label: 'Espalda', surface: 'spruce', icon: 'M4 8c3-2 5-2 8-2s5 0 8 2M6 12c2-1 4-1 6-1s4 0 6 1M8 16c1-1 2-1 4-1s3 0 4 1' },
  dorsales: { id: 'dorsales', label: 'Dorsales', surface: 'spruce', icon: 'M3 14c3-3 6-4 9-4s6 1 9 4M7 10c1-1 3-2 5-2s4 1 5 2' },
  trapecio: { id: 'trapecio', label: 'Trapecio', surface: 'spruce', icon: 'M12 3v6M6 7l4 4M18 7l-4 4M10 11h4' },
  hombros: { id: 'hombros', label: 'Hombros', surface: 'linen-mist', icon: 'M4 12c2-2 4-3 8-3s6 1 8 3M6 12c1 1 2 2 6 2s5-1 6-2M10 9c1 0 2 1 2 2s-1 2-2 2M14 9c-1 0-2 1-2 2s1 2 2 2' },
  biceps: { id: 'biceps', label: 'Bíceps', surface: 'linen-mist', icon: 'M6 6c0 4 0 8 2 10M18 18c2-2 2-4 2-6M6 4c-2 0-3 1-3 3v3c0 2 1 3 3 3M18 6c2 0 3 1 3 3' },
  triceps: { id: 'triceps', label: 'Tríceps', surface: 'linen-mist', icon: 'M8 6v10c0 2-1 3-3 3M16 6v10c0 2 1 3 3 3M8 4h8' },
  antebrazos: { id: 'antebrazos', label: 'Antebrazos', surface: 'linen-mist', icon: 'M6 4v12c0 2 1 3 3 3M18 4v12c0 2-1 3-3 3' },
  core: { id: 'core', label: 'Core', surface: 'spruce', icon: 'M9 4h6v3H9zM6 8h12v8H6zM9 18h6' },
  oblicuos: { id: 'oblicuos', label: 'Oblicuos', surface: 'spruce', icon: 'M5 12c3-2 5-2 7-2s4 0 7 2M5 12c3 1 4 2 7 2s4-1 7-2' },
  cuadriceps: { id: 'cuadriceps', label: 'Cuádriceps', surface: 'lime-voltage', icon: 'M9 4v8c0 4 1 7 3 8M15 4v8c0 4-1 7-3 8' },
  femorales: { id: 'femorales', label: 'Femorales', surface: 'lime-voltage', icon: 'M9 4c-2 4-3 8-3 8s1 4 3 8M15 4c2 4 3 8 3 8s-1 4-3 8' },
  gluteos: { id: 'gluteos', label: 'Glúteos', surface: 'lime-voltage', icon: 'M5 14c2-3 5-4 7-4s5 1 7 4M7 18c1-1 3-2 5-2s4 1 5 2' },
  gemelos: { id: 'gemelos', label: 'Gemelos', surface: 'lime-voltage', icon: 'M10 4v12c0 2 1 3 3 4M14 4v12c0 2-1 3-3 4' },
};

export const MUSCLE_LIST: MuscleMeta[] = Object.values(MUSCLES);

export function muscleById(id: MuscleGroup): MuscleMeta {
  return MUSCLES[id];
}

export function getMuscleSurfaceClasses(surface: MuscleMeta['surface']): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (surface) {
    case 'lime-voltage':
      return { bg: 'bg-lime-voltage', fg: 'text-forest-ink', border: 'border-lime-voltage' };
    case 'linen-mist':
      return { bg: 'bg-linen-mist', fg: 'text-forest-ink', border: 'border-linen-mist' };
    case 'spruce':
      return { bg: 'bg-spruce', fg: 'text-paper', border: 'border-spruce' };
    case 'forest-ink':
      return { bg: 'bg-forest-ink', fg: 'text-lime-voltage', border: 'border-forest-ink' };
  }
}

export interface ProfileMuscleBag {
  profile: ProfileMeta;
  profileId: ProfileId;
  muscleCount: number;
}

export function pickPrimaryColorForProfile(profileId: ProfileId): string {
  return profileId === 'haziel' ? '#9fe870' : '#054d28';
}