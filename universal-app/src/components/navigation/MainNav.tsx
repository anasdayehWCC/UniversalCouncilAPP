'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, Bell } from 'lucide-react';
import { NavSection } from './NavSection';
import { QuickActions } from './QuickActions';
import { UserMenu } from './UserMenu';
import { MobileNav, MobileNavTrigger } from './MobileNav';
import type { NavigationConfig, NavItem, BreadcrumbItem } from '@/lib/navigation';
import type { UserRole, ServiceDomain, DomainConfig } from '@/config/domains';
import { getDefaultExpandedSections } from '@/lib/navigation';

interface MainNavProps {
  config: NavigationConfig;
  role: UserRole;
  domain: ServiceDomain;
  domainConfig: DomainConfig;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  onSignOut?: () => void;
  onSwitchRole?: () => void;
  children: React.ReactNode;
}

/**
 * MainNav Component
 * 
 * Main navigation layout providing:
 * - Collapsible sidebar with role-based sections
 * - Header with quick actions and user menu
 * - Breadcrumb navigation
 * - Mobile drawer navigation
 * - Premium glassmorphism styling
 */
export function MainNav({
  config,
  role,
  domain,
  domainConfig,
  user,
  breadcrumbs = [],
  onSignOut,
  onSwitchRole,
  children,
}: MainNavProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const defaultExpanded = React.useMemo(
    () => getDefaultExpandedSections(role),
    [role]
  );

  // Close mobile nav on route change
  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-40',
          'text-white shadow-2xl transition-all duration-300',
          isSidebarCollapsed ? 'w-20' : 'w-64',
        )}
        style={{ backgroundColor: domainConfig.theme.primary }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shrink-0"
              style={{ background: domainConfig.theme.gradient }}
            >
              M
            </div>
            {!isSidebarCollapsed && (
              <span className="font-display font-bold text-lg whitespace-nowrap">
                Minute<span className="text-white/70">Platform</span>
              </span>
            )}
          </Link>
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Quick Actions (condensed in collapsed mode) */}
        {!isSidebarCollapsed && config.quickActions.length > 0 && (
          <div className="p-4 border-b border-white/10">
            <QuickActions
              actions={config.quickActions.slice(0, 2)}
              showLabels={!isSidebarCollapsed}
              variant="vertical"
              className="w-full"
            />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {config.sections.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              isCollapsed={isSidebarCollapsed}
              defaultExpanded={defaultExpanded.includes(section.id)}
            />
          ))}
        </nav>

        {/* Footer Items */}
        {config.footerItems.length > 0 && (
          <div className="px-2 py-2 border-t border-white/10 space-y-1">
            {config.footerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-white/70 hover:bg-white/10 hover:text-white transition-colors',
                    isSidebarCollapsed && 'justify-center',
                  )}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {!isSidebarCollapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* User Menu */}
        <div className="p-3 border-t border-white/10 bg-black/10">
          {isSidebarCollapsed ? (
            <UserMenu
              user={user}
              role={role}
              domain={domain}
              onSignOut={onSignOut}
              onSwitchRole={onSwitchRole}
              className="justify-center"
            />
          ) : (
            <UserMenu
              user={user}
              role={role}
              domain={domain}
              onSignOut={onSignOut}
              onSwitchRole={onSwitchRole}
            />
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          {/* Left: Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <MobileNavTrigger onClick={() => setIsMobileNavOpen(true)} />
            
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, index) => {
                  const Icon = crumb.icon;
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-900 font-medium">
                          {Icon && <Icon className="h-4 w-4" />}
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Search, Actions, Notifications */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-64 h-9 pl-10 pr-4 rounded-lg border border-slate-200/80',
                    'bg-slate-50 text-sm placeholder:text-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'transition-all duration-200',
                  )}
                  style={{
                    '--tw-ring-color': domainConfig.theme.primary,
                  } as React.CSSProperties}
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded">
                  /
                </kbd>
              </div>
            </div>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            {/* Mobile User Avatar */}
            <div className="lg:hidden">
              <UserMenu
                user={user}
                role={role}
                domain={domain}
                onSignOut={onSignOut}
                onSwitchRole={onSwitchRole}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        config={config}
        role={role}
        domain={domain}
        domainConfig={domainConfig}
        user={user}
        onSignOut={onSignOut}
        onSwitchRole={onSwitchRole}
      />
    </div>
  );
}

export default MainNav;
