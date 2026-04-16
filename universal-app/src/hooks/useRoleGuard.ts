'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { UserRole } from '@/config/domains';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const { role, isSessionHydrated } = useDemo();
  const isAuthorized = allowedRoles.includes(role);

  useEffect(() => {
    if (isSessionHydrated && !isAuthorized) {
      router.replace('/');
    }
  }, [isAuthorized, isSessionHydrated, router]);

  return {
    isReady: isSessionHydrated,
    isAuthorized,
  };
}
