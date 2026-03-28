'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { X, Menu, ChevronRight } from 'lucide-react';
import { NavSection } from './NavSection';
import { QuickActions } from './QuickActions';
import { UserMenu } from './UserMenu';
import type { NavigationConfig, NavItem } from '@/lib/navigation';
import type { UserRole, ServiceDomain, DomainConfig } from '@/config/domains';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  config: NavigationConfig;
  role: UserRole;
  domain: ServiceDomain;
  domainConfig: DomainConfig;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onSignOut?: () => void;
  onSwitchRole?: () => void;
}

/**
 * MobileNav Component
 * 
 * Full-screen mobile navigation drawer with:
 * - Backdrop overlay
 * - Slide-in animation
 * - All navigation sections
 * - User menu
 * - Quick actions
 */
export function MobileNav({
  isOpen,
  onClose,
  config,
  role,
  domain,
  domainConfig,
  user,
  onSignOut,
  onSwitchRole,
}: MobileNavProps) {
  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleItemSelect = () => {
    onClose();
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm flex flex-col',
          'bg-slate-900 text-white shadow-2xl',
          'transform transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ backgroundColor: domainConfig.theme.primary }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
              style={{ background: domainConfig.theme.gradient }}
            >
              M
            </div>
            <span className="font-display font-bold text-lg">
              Minute<span className="text-white/70">Platform</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        {config.quickActions.length > 0 && (
          <div className="px-4 py-4 border-b border-white/10">
            <QuickActions
              actions={config.quickActions}
              variant="vertical"
              className="w-full"
            />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {config.sections.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              defaultExpanded={true}
              onItemSelect={handleItemSelect}
            />
          ))}
        </nav>

        {/* Footer Items */}
        {config.footerItems.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10 space-y-1">
            {config.footerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* User Menu */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <UserMenu
            user={user}
            role={role}
            domain={domain}
            onSignOut={onSignOut}
            onSwitchRole={onSwitchRole}
            className="w-full"
          />
        </div>
      </aside>
    </Fragment>
  );
}

/**
 * MobileNavTrigger - Button to open mobile nav
 */
export function MobileNavTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden',
        className,
      )}
      aria-label="Open navigation menu"
    >
      <Menu className="h-6 w-6 text-white" />
    </button>
  );
}

export default MobileNav;
