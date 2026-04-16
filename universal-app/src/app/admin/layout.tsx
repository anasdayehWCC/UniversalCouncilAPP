'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { useDemo } from '@/context/DemoContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/config/domains';

const ALLOWED_ROLES: UserRole[] = ['admin', 'manager'];

function AdminLoadingSkeleton() {
  return (
    <div className="min-h-0 bg-muted">
      <div className="flex min-h-0">
        {/* Sidebar skeleton */}
        <aside className="w-64 shrink-0 bg-card border-r border-border min-h-0 h-full sticky top-0">
          <div className="p-4 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 min-w-0 p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role } = useDemo();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ALLOWED_ROLES.includes(role)) {
      router.replace('/');
    } else {
      setIsReady(true);
    }
  }, [role, router]);

  if (!isReady) {
    return <AdminLoadingSkeleton />;
  }

  return (
    <div className="min-h-0 bg-muted">
      <div className="flex min-h-0">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-card border-r border-border min-h-0 h-full sticky top-0">
          <div className="p-4">
            <AdminNav />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
