'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import type { ServiceDomain } from '@/config/domains';
import { cn, hexToRgba } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Bell, Search, Menu, LogOut, ChevronDown, Settings, X } from 'lucide-react';
import { getNavForRole } from '@/config/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorMode } from '@/hooks/useTheme';
import { ResilienceBanner } from '@/components/ResilienceBanner';
import { ConnectivityIndicator } from '@/components/ConnectivityIndicator';
import { ZINDEX_CLASSES } from '@/lib/z-index';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config, domain, role, currentUser, switchUser, signOut, featureFlags, personas, isAuthenticated, isSessionHydrated, meetings } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useColorMode();
  const [isMounted, setIsMounted] = React.useState(false);
  // Start with sidebar closed on mobile (will be shown via lg:translate-x-0 on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isLogin = pathname === '/login';

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isSessionHydrated && !isLogin && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLogin, isSessionHydrated, router]);

  const navItems = React.useMemo(() => getNavForRole(domain, role, featureFlags), [domain, role, featureFlags]);

  // Count pending review items (ready or flagged) for the Review Queue badge
  const pendingReviewCount = React.useMemo(
    () => meetings.filter((m) => m.status === 'ready' || m.status === 'flagged').length,
    [meetings]
  );

  const sidebarBg = config.theme.primary;
  const isDarkSidebar = true;

  const canvasBg = React.useMemo(() => {
    // Dark mode: Use simple dark gradients
    if (isMounted && isDark) {
      const darkBase = 'rgba(15, 23, 42, 1)'; // slate-900
      const darkSubtle = 'rgba(30, 41, 59, 0.5)'; // slate-800/50
      return `linear-gradient(to bottom, ${darkSubtle}, ${darkBase})`;
    }
    
    // Light mode: Use theme-aware backgrounds with domain color tints
    const social: Record<ServiceDomain, string> = { 
      children: hexToRgba(config.theme.primary, 0.02) + ', rgba(247, 248, 255, 0.98)', // Slight blue tint
      adults: hexToRgba(config.theme.primary, 0.015) + ', rgba(242, 251, 247, 0.98)', // Slight teal tint
      housing: hexToRgba(config.theme.primary, 0.02) + ', rgba(255, 251, 245, 0.98)', // Slight orange tint
      corporate: 'rgba(248, 248, 248, 1)' // Neutral gray
    };
    const manager: Record<ServiceDomain, string> = { 
      children: hexToRgba(config.theme.accent, 0.025) + ', rgba(255, 249, 240, 0.98)', // Warm accent
      adults: hexToRgba(config.theme.accent, 0.02) + ', rgba(253, 249, 235, 0.98)', // Light teal
      housing: hexToRgba(config.theme.accent, 0.03) + ', rgba(255, 248, 238, 0.98)', // Amber glow
      corporate: 'rgba(250, 250, 250, 1)' // Lighter neutral
    };
    const admin: Record<ServiceDomain, string> = { 
      children: hexToRgba(config.theme.primary, 0.025) + ', rgba(245, 248, 255, 0.98)', // Cool tint
      adults: hexToRgba(config.theme.primary, 0.02) + ', rgba(240, 252, 250, 0.98)', // Aqua tint
      housing: hexToRgba(config.theme.primary, 0.025) + ', rgba(255, 250, 245, 0.98)', // Warm tint
      corporate: 'rgba(246, 246, 248, 1)' // Cooler neutral
    };
    
    if (role === 'admin') return `linear-gradient(to bottom, ${admin[domain]})`;
    if (role === 'manager') return `linear-gradient(to bottom, ${manager[domain]})`;
    if (role === 'housing_officer') return `linear-gradient(to bottom, ${social[domain]})`;
    return `linear-gradient(to bottom, ${social[domain]})`;
  }, [domain, role, config.theme, isMounted, isDark]);

  const navStyle = React.useMemo(() => ({
    '--nav-hover-bg': isDarkSidebar ? 'rgba(255,255,255,0.08)' : 'var(--primary-soft)',
    '--nav-hover-color': isDarkSidebar ? '#ffffff' : config.theme.primary,
    '--nav-active-bg': isDarkSidebar ? 'rgba(255,255,255,0.16)' : 'var(--primary-soft)',
    '--nav-active-color': isDarkSidebar ? '#ffffff' : config.theme.primary,
  } as React.CSSProperties), [config.theme.primary, isDarkSidebar]);

  if (isLogin) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground transition-colors duration-200">
        {children}
      </div>
    );
  }

  if (!isSessionHydrated) {
    return (
      <div
        className="min-h-[100dvh] bg-background text-foreground transition-colors duration-200"
        aria-busy="true"
        role="status"
      />
    );
  }

  return (
    <div
      className="relative isolate h-[100dvh] overflow-hidden bg-background text-foreground transition-colors duration-200"
      style={{
        background: canvasBg,
        transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s',
      }}
    >
      <div className="flex h-full min-h-0 relative z-10">
      {/* Mobile overlay - shows when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[17rem] text-white bg-slate-900 backdrop-blur-lg border-r border-border/20 transform transition-transform duration-300 ease-in-out shadow-2xl lg:translate-x-0 lg:static lg:inset-auto lg:h-full lg:sticky lg:top-0 flex flex-col shrink-0",
          !isSidebarOpen && "-translate-x-full"
        )}
        style={{ backgroundColor: sidebarBg }}
        aria-label="Main navigation sidebar"
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
              style={{ background: config.theme.gradient }}
            >
              M
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Minute<span className="text-muted-foreground">Platform</span>
            </span>
          </div>
          {/* Mobile close button */}
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav id="main-navigation" aria-label="Main navigation" className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-3 text-xs font-semibold text-white/90 uppercase tracking-wider">
            {config.name}
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.href === '/review-queue' && pendingReviewCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-link nav-link--dark flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                  isActive && "nav-link--active"
                )}
                style={navStyle}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" style={{ strokeWidth: isActive ? 2.6 : 2.2 }} />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold leading-none">
                    {pendingReviewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Demo Switcher */}
        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left group">
                <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border-2 border-white/50 shadow-sm group-hover:border-white transition-colors">
                  <Image 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    width={40} 
                    height={40} 
                    className="w-full h-full object-cover" 
                    priority
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-white/70 truncate capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch Persona (Demo)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(personas).map((user) => (
                <DropdownMenuItem 
                  key={user.id} 
                  onClick={() => {
                    // Wrap in timeout to prevent Radix UI unmount race conditions
                    setTimeout(() => switchUser(user.id), 0);
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                    <Image src={user.avatar} alt={user.name} width={24} height={24} className="w-full h-full object-cover" sizes="24px" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{user.role.replace('_', ' ')}</span>
                  </div>
                  {currentUser.id === user.id && <div className="ml-auto w-2 h-2 rounded-full bg-success" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive gap-2 cursor-pointer"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              <span>{currentUser.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/20"
              onClick={signOut}
            >
              Switch
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header - z-50 to appear above overlay (z-40) */}
        <header className={cn(
          'shrink-0 sticky top-0 bg-card/80 backdrop-blur-md border-b border-border px-6 flex items-center justify-between shadow-sm',
          `h-[var(--shell-header-height)]`,
          ZINDEX_CLASSES.header
        )}>
          <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                aria-label="Toggle navigation"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <AnimatedIcon rotate pulse hoverColor="#facc15">
                  <Menu className="w-5 h-5" />
                </AnimatedIcon>
              </Button>
              <div className="hidden sm:flex items-center gap-1 text-[11px] tracking-wide text-muted-foreground shrink-0">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/70" />
                <span>Touch-friendly</span>
              </div>

            {/* Breadcrumbs / Context */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <span className="font-medium text-foreground truncate max-w-[160px]" title={currentUser.authorityLabel || config.authorityLabel}>
                {currentUser.authorityLabel || config.authorityLabel}
              </span>
              <span className="text-muted-foreground/40 shrink-0">/</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-foreground truncate max-w-[160px]" title={config.name}>{config.name}</span>
                <span
                  className="px-2 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm shrink-0"
                  style={{ background: config.theme.gradient }}
                >
                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                </span>
              </div>
              <span className="text-muted-foreground/40 shrink-0">/</span>
              <span className="truncate max-w-[140px]" title={currentUser.team}>{currentUser.team}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search minutes, people..."
                aria-label="Search minutes, people"
                className="h-9 pl-9 pr-4 rounded-full bg-muted border border-border text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring w-64 transition-all text-foreground"
              />
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 px-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open appearance settings"
            >
              <Link href="/settings">
                <Settings className="w-5 h-5" />
                <span className="hidden lg:inline">Settings</span>
              </Link>
            </Button>
            <ThemeToggle size="default" />
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
              Switch persona
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full min-h-0 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto min-h-full animate-in fade-in duration-500">
              {children}
            </div>
          </div>
        </main>

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 flex justify-center px-4 sm:px-6 lg:px-8',
            ZINDEX_CLASSES.floatingAction
          )}
          style={{
            top: 'calc(env(safe-area-inset-top) + var(--shell-header-height) + 0.5rem)',
          }}
        >
          <ResilienceBanner position="inline" className="w-full max-w-xl" />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="relative mx-auto h-full max-w-7xl">
            <ConnectivityIndicator
              position="bottom-right"
              anchored="absolute"
              hideWhenOnline
              className="pointer-events-auto"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
