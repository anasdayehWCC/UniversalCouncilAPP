'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import { UserRole } from '@/config/domains';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const { role } = useDemo();

  useEffect(() => {
    if (!allowedRoles.includes(role)) {
      router.replace('/');
    }
  }, [allowedRoles, role, router]);
}
