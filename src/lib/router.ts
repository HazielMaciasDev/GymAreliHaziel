import { useEffect, useState } from 'react';

function fromHashRoute(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw || raw === '/' || raw === '') return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(() => fromHashRoute());

  useEffect(() => {
    const handler = () => setPathname(fromHashRoute());
    window.addEventListener('hashchange', handler);
    window.addEventListener('gym:navigate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('gym:navigate', handler);
    };
  }, []);

  return pathname;
}

export function useRouter() {
  function setHash(path: string) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    window.location.hash = `#${cleanPath}`;
  }

  return {
    push(path: string) {
      setHash(path);
    },
    replace(path: string) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const targetHash = `#${cleanPath}`;
      if (window.location.hash === targetHash) return;
      const url = `${window.location.pathname}${window.location.search}${targetHash}`;
      window.history.replaceState({}, '', url);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
  };
}