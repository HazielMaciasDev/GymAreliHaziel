import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ProfileId } from '@/types';
import { isProfileId, PROFILE_STORAGE_KEY } from '@/lib/profiles';

interface ProfileContextValue {
  profile: ProfileId | null;
  ready: boolean;
  setProfile: (id: ProfileId) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function readProfileFromStorage(): ProfileId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return isProfileId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileId | null>(() => readProfileFromStorage());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfileState(readProfileFromStorage());
    setReady(true);

    const handler = (event: StorageEvent) => {
      if (event.key === PROFILE_STORAGE_KEY) {
        setProfileState(readProfileFromStorage());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
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

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, ready, setProfile, clearProfile }),
    [profile, ready, setProfile, clearProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (ctx) return ctx;
  return {
    profile: readProfileFromStorage(),
    ready: false,
    setProfile: (id: ProfileId) => {
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, id);
      } catch {
        // ignore
      }
    },
    clearProfile: () => {
      try {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  };
}