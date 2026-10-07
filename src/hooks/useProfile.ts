
import { useEffect, useState, useCallback } from 'react';
import type { ProfileId } from '@/types';
import { isProfileId, PROFILE_STORAGE_KEY } from '@/lib/profiles';

export function useProfile(): {
  profile: ProfileId | null;
  setProfile: (id: ProfileId) => void;
  clearProfile: () => void;
  ready: boolean;
} {
  const [profile, setProfileState] = useState<ProfileId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (isProfileId(raw)) setProfileState(raw);
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, []);

  const setProfile = useCallback((id: ProfileId) => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, id);
    } catch {
      // ignore
    }
    setProfileState(id);
  }, []);

  const clearProfile = useCallback(() => {
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // ignore
    }
    setProfileState(null);
  }, []);

  return { profile, setProfile, clearProfile, ready };
}
