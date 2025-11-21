'use client';

import { Logo } from './logo';
import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-sm md:bg-transparent">
      {/* Mobile Logo (Hidden on Desktop) */}
      <div className="md:hidden">
        <Logo />
      </div>

      {/* Desktop Title/Breadcrumb (Hidden on Mobile) */}
      <div className="hidden md:block">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Dashboard
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium text-sm shadow-lg shadow-primary/20">
          JD
        </div>
      </div>
    </header>
  );
}
