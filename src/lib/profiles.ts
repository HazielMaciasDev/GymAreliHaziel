import type { ProfileId } from '@/types';

export interface ProfileMeta {
  id: ProfileId;
  name: string;
  initials: string;
  tagline: string;
}

export const PROFILES: Record<ProfileId, ProfileMeta> = {
  haziel: {
    id: 'haziel',
    name: 'Haziel',
    initials: 'H',
    tagline: 'El día que descanses, tu músculo crece.',
  },
  areli: {
    id: 'areli',
    name: 'Areli',
    initials: 'A',
    tagline: 'Más fuerte que tus excusas.',
  },
};

export const PROFILE_LIST: ProfileMeta[] = [PROFILES.haziel, PROFILES.areli];

export function isProfileId(value: unknown): value is ProfileId {
  return value === 'haziel' || value === 'areli';
}

export const PROFILE_STORAGE_KEY = 'gym.profile';
