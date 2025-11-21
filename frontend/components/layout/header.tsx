'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { usePathname } from 'next/navigation';
import { useDevPreview } from '@/lib/dev-preview-provider';
import { fallbackTenantConfig } from '@/lib/config/fallback';
import { useTenantConfig } from '@/lib/config/useTenantConfig';
import { getEnabledModules } from '@/lib/modules';

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
  const { currentRole, currentDomain } = useDevPreview();
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'westminster';
  const { config, loading, error } = useTenantConfig(tenantId);

  const modules = config
    ? getEnabledModules(config, currentDomain, currentRole)
    : getEnabledModules(fallbackTenantConfig, currentDomain, currentRole);
  const navItems =
    modules.flatMap((m) => m.routes).concat([{ path: '/settings', label: 'Settings' }]);
  const showTemplates = userTemplatesEnabled && modules.some((m) => m.id === 'minutes');

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-br from-primary via-primary to-primary/90 shadow-2xl border-b border-white/20 transition-colors duration-500">
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
      <nav className="relative glass-panel-premium border-t-0 rounded-none">
        <div className="container mx-auto flex items-center gap-2 px-8 py-3 overflow-x-auto no-scrollbar">
          {loading && <span className="text-white/70 text-sm">Loading config…</span>}
          {error && <span className="text-red-200 text-sm">Config error, using fallback</span>}
          {!loading &&
            !error &&
            navItems.map((item) => (
              <NavButton key={item.path} href={item.path}>
                {item.label}
              </NavButton>
            ))}
          {!loading && !error && showTemplates && (
            <NavButton href="/templates">Templates</NavButton>
          )}
        </div>
      </nav>
    </header>
  );
}
