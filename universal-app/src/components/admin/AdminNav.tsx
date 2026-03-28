'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Puzzle, 
  FileText, 
  Settings, 
  ScrollText,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: 'users:read' | 'modules:read' | 'templates:read' | 'settings:read' | 'audit:read';
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" />, permission: 'users:read' },
  { href: '/admin/modules', label: 'Modules', icon: <Puzzle className="w-4 h-4" />, permission: 'modules:read' },
  { href: '/admin/templates', label: 'Templates', icon: <FileText className="w-4 h-4" />, permission: 'templates:read' },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, permission: 'settings:read' },
  { href: '/admin/audit', label: 'Audit Log', icon: <ScrollText className="w-4 h-4" />, permission: 'audit:read' },
];

export function AdminNav() {
  const pathname = usePathname();
  const { hasPermission, tenantConfig, stats } = useAdmin();

  const visibleItems = NAV_ITEMS.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <nav className="space-y-1">
      <div className="px-3 py-2 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Admin Panel</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{tenantConfig.name}</p>
      </div>

      {visibleItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/admin' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all',
              isActive 
                ? 'bg-[var(--primary)] text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.label === 'Users' && (
                <Badge variant="secondary" className="text-xs">
                  {stats.totalUsers}
                </Badge>
              )}
              {item.label === 'Modules' && (
                <Badge variant="secondary" className="text-xs">
                  {stats.activeModules}/{stats.totalModules}
                </Badge>
              )}
              {isActive && <ChevronRight className="w-4 h-4" />}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
