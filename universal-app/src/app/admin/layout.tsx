'use client';

import React from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { Card } from '@/components/ui/card';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect entire admin section
  useRoleGuard(['admin', 'manager']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0">
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
