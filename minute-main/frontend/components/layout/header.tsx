'use client';

import { Logo } from './logo';
import { Bell, Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header({
  onToggleSidebar,
  sidebarCollapsed,
}: {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 px-4 md:px-6 py-4 flex items-center justify-between bg-background/60 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-foreground hover:bg-white/20 transition"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
        <div className="md:hidden">
          <Logo />
        </div>
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        </button>
        <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium text-sm shadow-lg shadow-primary/20")}>
          JD
        </div>
      </div>
    </header>
  );
}
