'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LogOut, 
  User, 
  Settings, 
  ChevronDown,
  Moon,
  Sun,
  Building,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserRole, ServiceDomain } from '@/config/domains';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
  role: UserRole;
  domain: ServiceDomain;
  onSignOut?: () => void;
  onSwitchRole?: () => void;
  className?: string;
}

/**
 * Format role for display
 */
function formatRole(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    social_worker: 'Social Worker',
    manager: 'Manager',
    admin: 'Administrator',
    housing_officer: 'Housing Officer',
  };
  return roleLabels[role] || role;
}

/**
 * Get role badge color
 */
function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'manager':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'social_worker':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'housing_officer':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default:
      return 'bg-muted/20 text-muted-foreground border-border/30';
  }
}

/**
 * UserMenu Component
 * 
 * User dropdown menu displaying:
 * - User info and avatar
 * - Role badge
 * - Settings links
 * - Sign out action
 */
export function UserMenu({
  user,
  role,
  domain,
  onSignOut,
  onSwitchRole,
  className,
}: UserMenuProps) {
  const initials = user.initials || 
    user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg transition-colors',
            'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20',
            className,
          )}
        >
          {/* Avatar */}
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white/20">
                {initials}
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0 text-left hidden sm:block">
            <div className="text-sm font-medium text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-white/60 truncate">
              {formatRole(role)}
            </div>
          </div>

          <ChevronDown className="h-4 w-4 text-white/60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 bg-slate-900/95 backdrop-blur-xl border-white/10 text-white"
        sideOffset={8}
      >
        {/* User Header */}
        <DropdownMenuLabel className="p-4">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-lg font-semibold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-white/60 truncate">{user.email}</div>
              <div className={cn(
                'inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full border',
                getRoleBadgeColor(role),
              )}>
                <Shield className="h-2.5 w-2.5 mr-1" />
                {formatRole(role)}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/10"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {/* Domain info */}
        <DropdownMenuItem disabled className="flex items-center gap-2 px-4 py-2 opacity-60">
          <Building className="h-4 w-4" />
          <span className="capitalize">{domain}</span>
        </DropdownMenuItem>

        {/* Switch Role (for demo) */}
        {onSwitchRole && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={onSwitchRole}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/10"
            >
              <Shield className="h-4 w-4" />
              <span>Switch Role</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
