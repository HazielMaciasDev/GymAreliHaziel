import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

function readPathFromHash(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw || raw === '/' || raw === '') return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

interface RouterContextValue {
  pathname: string;
  push: (path: string) => void;
  replace: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function writeHash(path: string, method: 'push' | 'replace') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetHash = `#${cleanPath}`;
  const fullUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
  if (method === 'push') {
    window.location.hash = targetHash;
  } else {
    if (window.location.hash === targetHash) return;
    window.history.replaceState({}, '', fullUrl);
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState<string>(() => readPathFromHash());

  useEffect(() => {
    const handler = () => setPathname(readPathFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (pathname !== readPathFromHash()) {
      setPathname(readPathFromHash());
    }
  });

  const push = useCallback((path: string) => {
    writeHash(path, 'push');
    setPathname(readPathFromHash());
  }, []);

  const replace = useCallback((path: string) => {
    writeHash(path, 'replace');
    setPathname(readPathFromHash());
  }, []);

  const value = useMemo<RouterContextValue>(() => ({ pathname, push, replace }), [pathname, push, replace]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function usePathname(): string {
  const ctx = useContext(RouterContext);
  if (ctx) return ctx.pathname;
  return readPathFromHash();
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  const fallback = useMemo(() => ({
    push(path: string) {
      writeHash(path, 'push');
    },
    replace(path: string) {
      writeHash(path, 'replace');
    },
  }), []);
  return ctx ?? fallback;
}