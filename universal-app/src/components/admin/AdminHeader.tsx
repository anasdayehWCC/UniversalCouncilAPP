'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/modules': 'Modules',
  '/admin/templates': 'Templates',
  '/admin/settings': 'Settings',
  '/admin/audit': 'Audit Log',
};

export function AdminHeader({ 
  title,
  description,
  action
}: { 
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const breadcrumbs: Breadcrumb[] = React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [{ label: 'Admin', href: '/admin' }];
    
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      if (index > 0) {
        crumbs.push({
          label: ROUTE_LABELS[currentPath] || part.charAt(0).toUpperCase() + part.slice(1),
          href: index < parts.length - 1 ? currentPath : undefined
        });
      }
    });
    
    return crumbs;
  }, [pathname]);

  const pageTitle = title || ROUTE_LABELS[pathname] || 'Admin';

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
              {crumb.href ? (
                <Link 
                  href={crumb.href} 
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Title and Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{pageTitle}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function AdminPageWrapper({
  children,
  title,
  description,
  action
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-0">
      <AdminHeader title={title} description={description} action={action} />
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
