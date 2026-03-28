'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import type { ServiceDomain } from '@/config/domains';
import { cn, hexToRgba } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Bell, Search, Menu, LogOut, ChevronDown } from 'lucide-react';
import { getNavForRole } from '@/config/navigation';
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
  const { config, domain, role, currentUser, switchUser, signOut, featureFlags, personas, isAuthenticated } = useDemo();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const isLogin = pathname === '/login';

  React.useEffect(() => {
    if (!isLogin && !isAuthenticated) {
      // Use window.location to ensure a clean state if needed, or router for speed.
      // Since this is a demo app, router is fine.
      // But we can't use router here because we didn't import it.
      // Let's use window.location.href for now to be safe.
      window.location.href = '/login';
    }
  }, [isLogin, isAuthenticated]);

  const navItems = React.useMemo(() => getNavForRole(domain, role, featureFlags), [domain, role, featureFlags]);

  const sidebarBg = config.theme.primary;
  const isDarkSidebar = true;

  const canvasBg = React.useMemo(() => {
    // Use theme-aware backgrounds with domain color tints for better visual distinction
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
  }, [domain, role, config.theme]);

  const navStyle = React.useMemo(() => ({
    '--nav-hover-bg': isDarkSidebar ? 'rgba(255,255,255,0.08)' : 'var(--primary-soft)',
    '--nav-hover-color': isDarkSidebar ? '#ffffff' : config.theme.primary,
    '--nav-active-bg': isDarkSidebar ? 'rgba(255,255,255,0.16)' : 'var(--primary-soft)',
    '--nav-active-color': isDarkSidebar ? '#ffffff' : config.theme.primary,
  } as React.CSSProperties), [config.theme.primary, isDarkSidebar]);

  if (isLogin) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-900 relative isolate"
      style={{
        background: canvasBg,
        transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="min-h-screen flex relative z-10">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setIsSidebarOpen(true)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[17rem] text-white bg-slate-900 backdrop-blur-lg border-r border-slate-900/20 transform transition-transform duration-300 ease-in-out shadow-2xl lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
        style={{ backgroundColor: sidebarBg }}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
              style={{ background: config.theme.gradient }}
            >
              M
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Minute<span className="text-slate-300">Platform</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav id="main-navigation" aria-label="Main navigation" className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-3 text-xs font-semibold text-white/90 uppercase tracking-wider">
            {config.name}
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-link nav-link--dark flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                  isActive && "nav-link--active"
                )}
                style={navStyle}
              >
                <Icon className="w-5 h-5" style={{ strokeWidth: isActive ? 2.6 : 2.2 }} />
                {item.label}
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
                  <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden">
                    <Image src={user.avatar} alt={user.name} width={24} height={24} className="w-full h-full object-cover" sizes="24px" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{user.role.replace('_', ' ')}</span>
                  </div>
                  {currentUser.id === user.id && <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 gap-2 cursor-pointer"
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Toggle navigation"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <AnimatedIcon rotate pulse hoverColor="#facc15">
                  <Menu className="w-5 h-5" />
                </AnimatedIcon>
              </Button>
              <div className="hidden sm:flex items-center gap-1 text-[11px] tracking-wide text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                <span>Touch-friendly</span>
              </div>
            
            {/* Breadcrumbs / Context */}
            <div className="hidden md:flex items-center gap-3 text-sm text-slate-500">
              <span className="font-medium text-slate-900 truncate max-w-[300px]" title={currentUser.authorityLabel || config.authorityLabel}>
                {currentUser.authorityLabel || config.authorityLabel}
              </span>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{config.name}</span>
                <span
                  className="px-2 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm"
                  style={{ background: config.theme.gradient }}
                >
                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                </span>
              </div>
              <span className="text-slate-300">/</span>
              <span className="truncate max-w-[300px]" title={currentUser.team}>{currentUser.team}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search minutes, people..." 
                className="h-9 pl-9 pr-4 rounded-full bg-slate-100 border-none text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-slate-200 w-64 transition-all"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {/* <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span> */}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
              Switch persona
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  </div>
  );
}
