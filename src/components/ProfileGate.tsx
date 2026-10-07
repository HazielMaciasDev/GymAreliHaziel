'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, ready } = useProfile();

  useEffect(() => {
    if (!ready) return;
    const pathname = window.location.pathname.replace(/^\/GymAreliHaziel/, '');
    if (!profile && pathname !== '/' && pathname !== '') {
      router.replace('/');
    }
  }, [ready, profile, router]);

  return <>{children}</>;
}