'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { UserRole } from '@/config/domains';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const { role, isAuthenticated, isSessionHydrated } = useDemo();
  const hasAllowedRole = allowedRoles.includes(role);
  const isAuthorized = isSessionHydrated && isAuthenticated && hasAllowedRole;

  useEffect(() => {
    if (!isSessionHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasAllowedRole) {
      router.replace('/');
    }
  }, [hasAllowedRole, isAuthenticated, isSessionHydrated, router]);

  return {
    isReady: isSessionHydrated,
    isAuthorized,
  };
}
