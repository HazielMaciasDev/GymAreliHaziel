import { lazy, Suspense, useEffect } from 'react';
import { usePathname } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { ProfileSelectorPage } from '@/pages/ProfileSelectorPage';

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const RoutinePage = lazy(() =>
  import('@/pages/RoutinePage').then((m) => ({ default: m.RoutinePage })),
);
const ActiveSessionPage = lazy(() =>
  import('@/pages/ActiveSessionPage').then((m) => ({ default: m.ActiveSessionPage })),
);
const ExerciseBankPage = lazy(() =>
  import('@/pages/ExerciseBankPage').then((m) => ({ default: m.ExerciseBankPage })),
);
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <span className="block h-2 w-2 animate-pulse rounded-full bg-[#2c2e2a]" />
      <span className="t-eyebrow text-[#80827f]">Cargando</span>
    </div>
  );
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useProfile();
  if (!ready) {
    return <PageLoader />;
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
        <Suspense fallback={<PageLoader />}>
          <HomePage />
        </Suspense>
      </RequireProfile>
    );
  }
  if (pathname === '/routine' || pathname === '/routine/') {
    return (
      <RequireProfile>
        <Suspense fallback={<PageLoader />}>
          <RoutinePage />
        </Suspense>
      </RequireProfile>
    );
  }
  if (pathname === '/routine/active' || pathname === '/routine/active/') {
    return (
      <RequireProfile>
        <Suspense fallback={<PageLoader />}>
          <ActiveSessionPage />
        </Suspense>
      </RequireProfile>
    );
  }
  if (pathname === '/exercises' || pathname === '/exercises/') {
    return (
      <RequireProfile>
        <Suspense fallback={<PageLoader />}>
          <ExerciseBankPage />
        </Suspense>
      </RequireProfile>
    );
  }
  if (pathname === '/history' || pathname === '/history/') {
    return (
      <RequireProfile>
        <Suspense fallback={<PageLoader />}>
          <HistoryPage />
        </Suspense>
      </RequireProfile>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f1e4] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="t-display text-[120px] leading-[0.9] text-[#2c2e2a]">404</h1>
        <p className="t-body text-[#80827f]">No encontramos esa ruta.</p>
        <a
          href="/GymAreliHaziel/"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#2c2e2a] px-6 text-[14px] font-medium text-[#f5f1e4] transition-colors hover:bg-[#1f211d]"
        >
          <span>Volver al inicio</span>
          <span className="h-2 w-2 rounded-full bg-[#8ed462]" />
        </a>
      </div>
    </main>
  );
}
