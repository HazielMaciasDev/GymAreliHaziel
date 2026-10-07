import { useEffect } from 'react';
import { usePathname } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { ProfileSelector } from '@/components/ProfileSelector';
import { WorkoutsPage } from '@/routes/WorkoutsPage';
import { ActiveWorkoutPage } from '@/routes/ActiveWorkoutPage';

function NotFound({ onNavigate }: { onNavigate: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-[64px] font-black text-forest-ink">404</h1>
        <p className="text-[16px] text-slate">No encontramos esa ruta.</p>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-pill bg-lime-voltage px-5 py-2 text-[14px] font-semibold text-forest-ink transition hover:brightness-95"
        >
          Volver al inicio
        </button>
      </div>
    </main>
  );
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useProfile();
  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-paper">
        <div className="h-2 w-2 animate-pulse rounded-pill bg-fog" />
      </main>
    );
  }
  if (!profile) {
    if (typeof window !== 'undefined') {
      window.location.replace('/GymAreliHaziel/');
    }
    return null;
  }
  return <>{children}</>;
}

export function App() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  if (pathname === '/' || pathname === '') {
    return <ProfileSelector />;
  }
  if (pathname === '/workouts' || pathname === '/workouts/') {
    return (
      <RequireProfile>
        <WorkoutsPage />
      </RequireProfile>
    );
  }
  if (pathname === '/workouts/active' || pathname === '/workouts/active/') {
    return (
      <RequireProfile>
        <ActiveWorkoutPage />
      </RequireProfile>
    );
  }
  return <NotFound onNavigate={() => { window.location.href = '/GymAreliHaziel/'; }} />;
}