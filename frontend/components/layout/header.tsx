'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { usePathname } from 'next/navigation';

const NavButton = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        relative px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg
        ${isActive
          ? 'bg-white/15 text-white font-semibold shadow-md border-b-2 border-secondary'
          : 'text-white/90 hover:bg-[rgba(255,255,255,0.1)] hover:text-white hover:shadow-sm'
        }
      `}
    >
      {children}
    </Link>
  );
};

export function Header({ userTemplatesEnabled }: { userTemplatesEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-br from-primary via-primary to-primary/90 shadow-2xl border-b border-white/20">
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.18_130/0.15),transparent_45%),radial-gradient(circle_at_70%_0%,oklch(0.65_0.12_180/0.12),transparent_35%)] pointer-events-none" />

      <div className="container relative mx-auto flex items-center justify-between px-8 py-5">
        {/* Logo - 40% larger */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Powered by link - more subtle */}
        <Link
          href="https://i.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/40 hover:text-white/70 transition-colors duration-200 hover:underline"
        >
          Powered by i.AI
        </Link>
      </div>

      {/* Navigation Bar */}
      <nav className="relative border-t border-white/10 bg-gradient-to-r from-primary/20 via-transparent to-accent/10 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-2 px-8 py-3">
          <NavButton href="/">Dashboard</NavButton>
          <NavButton href="/new">New Meeting</NavButton>
          <NavButton href="/transcriptions">Transcriptions</NavButton>
          <NavButton href="/recordings">Recordings</NavButton>
          {userTemplatesEnabled && (
            <NavButton href="/templates">Templates</NavButton>
          )}
          <NavButton href="/settings">Settings</NavButton>
        </div>
      </nav>
    </header>
  );
}
