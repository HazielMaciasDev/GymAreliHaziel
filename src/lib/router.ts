import { useEffect, useState } from 'react';

function stripBase(path: string): string {
  const base = '/GymAreliHaziel';
  if (path.startsWith(base)) {
    const stripped = path.slice(base.length);
    return stripped || '/';
  }
  return path;
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(() => stripBase(window.location.pathname));
  useEffect(() => {
    const handler = () => setPathname(stripBase(window.location.pathname));
    window.addEventListener('popstate', handler);
    window.addEventListener('gym:navigate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('gym:navigate', handler);
    };
  }, []);
  return pathname;
}

export function useRouter() {
  return {
    push(path: string) {
      const fullPath = path.startsWith('/GymAreliHaziel') ? path : `/GymAreliHaziel${path.startsWith('/') ? '' : '/'}${path}`;
      window.history.pushState({}, '', fullPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    replace(path: string) {
      const fullPath = path.startsWith('/GymAreliHaziel') ? path : `/GymAreliHaziel${path.startsWith('/') ? '' : '/'}${path}`;
      window.history.replaceState({}, '', fullPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
  };
}