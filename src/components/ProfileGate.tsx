'use client';

import { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useProfile();

  useEffect(() => {
    if (!ready) return;
    if (!profile) {
      const pathname = window.location.pathname.replace(/^\/GymAreliHaziel/, '');
      if (pathname !== '/' && pathname !== '') {
        window.location.replace('/GymAreliHaziel/');
      }
    }
  }, [ready, profile]);

  return <>{children}</>;
}