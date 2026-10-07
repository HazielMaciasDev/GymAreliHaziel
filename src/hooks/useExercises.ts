
import { useEffect, useState } from 'react';
import type { Exercise } from '@/types';
import { fetchExercisesFromSdk, getFallbackExercises } from '@/lib/sdk-exercises';

const STORAGE_KEY = 'gym.exercisesCache.v1';
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  exercises: Exercise[];
  ts: number;
}

function readCache(): CacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.exercises || !Array.isArray(parsed.exercises)) return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(exercises: Exercise[]) {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry = { exercises, ts: Date.now() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function getStoredExercises(): Exercise[] {
  const cached = readCache();
  if (cached) return cached.exercises;
  return getFallbackExercises();
}

export type ExerciseSource = 'sdk' | 'fallback' | 'loading';

export interface UseExercises {
  exercises: Exercise[];
  loading: boolean;
  source: ExerciseSource;
  error: string | null;
  reload: () => void;
}

export function useExercises(): UseExercises {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ExerciseSource>('loading');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = readCache();
      if (cached) {
        if (!cancelled) {
          setExercises(cached.exercises);
          setSource('sdk');
          setLoading(false);
        }
        return;
      }

      try {
        const fetched = await fetchExercisesFromSdk(60);
        if (cancelled) return;
        writeCache(fetched);
        setExercises(fetched);
        setSource('sdk');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const fallback = getFallbackExercises();
        setExercises(fallback);
        setSource('fallback');
        setError(err instanceof Error ? err.message : 'SDK no disponible');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    exercises,
    loading,
    source,
    error,
    reload: () => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      setLoading(true);
      setSource('loading');
      setError(null);
      setTick((n) => n + 1);
    },
  };
}
