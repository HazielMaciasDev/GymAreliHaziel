'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EXERCISES_SEED } from '@/data/exercises.seed';
import { MUSCLES } from '@/lib/muscles';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { classNames, formatKg } from '@/lib/format';
import { withBasePath } from '@/lib/paths';
import type { Exercise, ProfileId } from '@/types';

interface SessionItem {
  exerciseId: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  completedSets: number;
}

interface ActiveSession {
  profileId: ProfileId;
  routineName: string;
  items: SessionItem[];
  startedAt: number;
  currentIndex: number;
}

function loadSession(): ActiveSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem('gym.activeSession');
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  } catch {
    return null;
  }
}

function saveSession(s: ActiveSession) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('gym.activeSession', JSON.stringify(s));
}

function clearSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem('gym.activeSession');
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace('/workouts');
      return;
    }
    setSession(s);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const exercisesById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const e of EXERCISES_SEED) map.set(e.id, e);
    return map;
  }, []);

  if (!session) return null;

  const items = session.items;
  const currentItem = items[session.currentIndex];
  const exercise = currentItem ? exercisesById.get(currentItem.exerciseId) : undefined;

  const updateSession = (next: ActiveSession) => {
    setSession(next);
    saveSession(next);
  };

  const incrementSet = () => {
    if (!currentItem) return;
    const next = { ...currentItem, completedSets: Math.min(currentItem.sets, currentItem.completedSets + 1) };
    const newItems = [...items];
    newItems[session.currentIndex] = next;
    updateSession({ ...session, items: newItems });
  };

  const goNext = () => {
    if (session.currentIndex >= items.length - 1) {
      const final = { ...session, currentIndex: items.length };
      updateSession(final);
      return;
    }
    updateSession({ ...session, currentIndex: session.currentIndex + 1 });
  };

  const goPrev = () => {
    if (session.currentIndex <= 0) return;
    updateSession({ ...session, currentIndex: session.currentIndex - 1 });
  };

  const handleExit = () => {
    if (window.confirm('¿Salir de la rutina? Se perderá el progreso de esta sesión.')) {
      clearSession();
      router.push('/workouts');
    }
  };

  const finished = session.currentIndex >= items.length;

  if (finished) {
    const completedSets = items.reduce((acc, it) => acc + it.completedSets, 0);
    const totalSets = items.reduce((acc, it) => acc + it.sets, 0);
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center bg-forest-ink px-6 py-12 text-paper">
        <div className="absolute left-4 top-4 flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-lime-voltage">
          <span className="h-1.5 w-1.5 rounded-pill bg-lime-voltage" />
          Rutina completada
        </div>
        <div className="text-center">
          <h1 className="text-display text-lime-voltage md:text-[140px]">¡HECHO!</h1>
          <p className="mt-4 text-[18px] text-paper md:text-[22px]">
            {session.routineName}
          </p>
          <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4">
            <Stat label="Tiempo" value={`${Math.floor(elapsed / 60)} min`} />
            <Stat label="Series" value={`${completedSets}/${totalSets}`} />
            <Stat label="Ejercicios" value={`${items.length}`} />
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                clearSession();
                router.push('/workouts');
              }}
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!exercise) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-paper">
        <p className="text-[16px] text-pebble">Cargando ejercicio…</p>
      </main>
    );
  }

  const primary = MUSCLES[exercise.primaryMuscle];
  const allCompleted = currentItem.completedSets >= currentItem.sets;

  return (
    <main className="relative flex min-h-dvh flex-col bg-forest-ink">
      <header className="flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <button
          type="button"
          onClick={handleExit}
          className="flex h-10 items-center gap-2 rounded-pill bg-paper/10 px-4 text-[12px] font-semibold uppercase tracking-wider text-paper transition hover:bg-paper/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
          Salir
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-paper/60">Ejercicio</span>
          <span className="text-[18px] font-black text-lime-voltage md:text-[22px]">
            {session.currentIndex + 1} <span className="text-paper/60">/ {items.length}</span>
          </span>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-pill bg-paper/10 px-4 text-[12px] font-semibold uppercase tracking-wider text-paper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
        </div>
      </header>

      <div className="flex flex-1 flex-col items-stretch px-5 pb-5 md:px-10 md:pb-10">
        <div className="relative mx-auto flex w-full max-w-[900px] flex-1 overflow-hidden rounded-large bg-paper text-charcoal shadow-xl">
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 px-5 py-3 md:px-8">
            <Pill tone="lime">{primary.label}</Pill>
            {exercise.secondaryMuscles.slice(0, 1).map((m) => (
              <Pill key={m} tone="mist">
                {MUSCLES[m].label}
              </Pill>
            ))}
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-fog">
            <img
              src={withBasePath(exercise.gifPath)}
              alt={exercise.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.15';
              }}
            />
          </div>
          <div className="flex flex-col gap-4 p-5 md:p-8">
            <h2 className="text-[28px] font-black leading-[1] tracking-[-0.02em] text-forest-ink md:text-[40px]">
              {exercise.name}
            </h2>
            <p className="text-[14px] leading-[1.55] text-slate md:text-[15px]">
              {exercise.description}
            </p>
            <div className="my-2 flex flex-wrap items-center gap-2 border-y border-fog py-3">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-pebble">Objetivo</span>
              <span className="text-[18px] font-black text-forest-ink">
                {currentItem.sets} × {currentItem.reps}
              </span>
              {currentItem.weightKg !== null ? (
                <Pill tone="dark">{formatKg(currentItem.weightKg)}</Pill>
              ) : null}
            </div>
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-pebble">
                Sets completados
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: currentItem.sets }).map((_, idx) => {
                  const done = idx < currentItem.completedSets;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const next = { ...currentItem, completedSets: idx + 1 };
                        const newItems = [...items];
                        newItems[session.currentIndex] = next;
                        updateSession({ ...session, items: newItems });
                      }}
                      className={classNames(
                        'flex h-12 w-12 items-center justify-center rounded-pill border-2 text-[14px] font-black transition',
                        done
                          ? 'border-lime-voltage bg-lime-voltage text-forest-ink'
                          : 'border-fog bg-paper text-pebble hover:border-forest-ink',
                      )}
                    >
                      {done ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <Button
                variant={allCompleted ? 'outline' : 'primary'}
                size="lg"
                fullWidth
                onClick={() => {
                  if (!allCompleted) {
                    incrementSet();
                    if (currentItem.completedSets + 1 >= currentItem.sets) {
                      window.setTimeout(() => goNext(), 250);
                    }
                  } else {
                    goNext();
                  }
                }}
                iconRight={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                }
              >
                {allCompleted ? 'Siguiente ejercicio' : `Listo · Set ${currentItem.completedSets + 1}/${currentItem.sets}`}
              </Button>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={goPrev}
                  disabled={session.currentIndex === 0}
                >
                  ← Anterior
                </Button>
                <Button variant="ghost" size="md" onClick={goNext}>
                  Saltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-paper/5 p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper/60">{label}</p>
      <p className="mt-2 text-[24px] font-black text-lime-voltage">{value}</p>
    </div>
  );
}