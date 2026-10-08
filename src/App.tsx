import { useEffect } from 'react';
import { usePathname } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { ProfileSelectorPage } from '@/pages/ProfileSelectorPage';
import { HomePage } from '@/pages/HomePage';
import { RoutinePage } from '@/pages/RoutinePage';
import { ExerciseBankPage } from '@/pages/ExerciseBankPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ActiveSessionPage } from '@/pages/ActiveSessionPage';

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useProfile();
  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-paper">
        <span className="block h-2 w-2 animate-pulse bg-fog" />
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
    return <ProfileSelectorPage />;
  }
  if (pathname === '/home' || pathname === '/home/') {
    return (
      <RequireProfile>
        <HomePage />
      </RequireProfile>
    );
  }
  if (pathname === '/routine' || pathname === '/routine/') {
    return (
      <RequireProfile>
        <RoutinePage />
      </RequireProfile>
    );
  }
  if (pathname === '/routine/active' || pathname === '/routine/active/') {
    return (
      <RequireProfile>
        <ActiveSessionPage />
      </RequireProfile>
    );
  }
  if (pathname === '/exercises' || pathname === '/exercises/') {
    return (
      <RequireProfile>
        <ExerciseBankPage />
      </RequireProfile>
    );
  }
  if (pathname === '/history' || pathname === '/history/') {
    return (
      <RequireProfile>
        <HistoryPage />
      </RequireProfile>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-[64px] leading-none text-forest-ink">404</h1>
        <p className="text-[14px] text-slate">No encontramos esa ruta.</p>
        <a
          href="/GymAreliHaziel/"
          className="inline-flex h-11 items-center bg-forest-ink px-5 text-[13px] font-medium text-paper hover:bg-obsidian transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </main>
  );
}