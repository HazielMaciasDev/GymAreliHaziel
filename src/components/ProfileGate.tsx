'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, ready } = useProfile();

  useEffect(() => {
    if (!ready) return;
    if (!profile && pathname !== '/') {
      router.replace('/');
    }
  }, [ready, profile, pathname, router]);

  return <>{children}</>;
}