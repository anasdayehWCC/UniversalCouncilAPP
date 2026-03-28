'use client';

/**
 * ShowAbove / HideAbove Components
 * 
 * Conditional rendering based on breakpoints.
 * Uses CSS display utilities for zero layout shift.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { Breakpoint } from '@/lib/responsive/types';

const showAboveClasses: Record<Breakpoint, string> = {
  xs: 'block',
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
  '2xl': 'hidden 2xl:block',
};

const hideAboveClasses: Record<Breakpoint, string> = {
  xs: 'hidden',
  sm: 'block sm:hidden',
  md: 'block md:hidden',
  lg: 'block lg:hidden',
  xl: 'block xl:hidden',
  '2xl': 'block 2xl:hidden',
};

interface ShowAboveProps {
  children: React.ReactNode;
  /** Breakpoint at which to show the content */
  breakpoint: Breakpoint;
  /** Display type (block, flex, grid, inline, etc.) */
  as?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex' | 'inline-block';
  /** Additional class names */
  className?: string;
}

/**
 * ShowAbove Component
 * 
 * Shows children only when viewport is at or above the specified breakpoint.
 */
export function ShowAbove({
  children,
  breakpoint,
  as = 'block',
  className,
}: ShowAboveProps) {
  const displayClasses: Record<Breakpoint, Record<string, string>> = {
    xs: {
      block: 'block',
      flex: 'flex',
      grid: 'grid',
      inline: 'inline',
      'inline-flex': 'inline-flex',
      'inline-block': 'inline-block',
    },
    sm: {
      block: 'hidden sm:block',
      flex: 'hidden sm:flex',
      grid: 'hidden sm:grid',
      inline: 'hidden sm:inline',
      'inline-flex': 'hidden sm:inline-flex',
      'inline-block': 'hidden sm:inline-block',
    },
    md: {
      block: 'hidden md:block',
      flex: 'hidden md:flex',
      grid: 'hidden md:grid',
      inline: 'hidden md:inline',
      'inline-flex': 'hidden md:inline-flex',
      'inline-block': 'hidden md:inline-block',
    },
    lg: {
      block: 'hidden lg:block',
      flex: 'hidden lg:flex',
      grid: 'hidden lg:grid',
      inline: 'hidden lg:inline',
      'inline-flex': 'hidden lg:inline-flex',
      'inline-block': 'hidden lg:inline-block',
    },
    xl: {
      block: 'hidden xl:block',
      flex: 'hidden xl:flex',
      grid: 'hidden xl:grid',
      inline: 'hidden xl:inline',
      'inline-flex': 'hidden xl:inline-flex',
      'inline-block': 'hidden xl:inline-block',
    },
    '2xl': {
      block: 'hidden 2xl:block',
      flex: 'hidden 2xl:flex',
      grid: 'hidden 2xl:grid',
      inline: 'hidden 2xl:inline',
      'inline-flex': 'hidden 2xl:inline-flex',
      'inline-block': 'hidden 2xl:inline-block',
    },
  };

  return (
    <div className={cn(displayClasses[breakpoint][as], className)}>
      {children}
    </div>
  );
}

interface HideAboveProps {
  children: React.ReactNode;
  /** Breakpoint at which to hide the content */
  breakpoint: Breakpoint;
  /** Display type when visible (block, flex, grid, inline, etc.) */
  as?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex' | 'inline-block';
  /** Additional class names */
  className?: string;
}

/**
 * HideAbove Component
 * 
 * Hides children when viewport is at or above the specified breakpoint.
 */
export function HideAbove({
  children,
  breakpoint,
  as = 'block',
  className,
}: HideAboveProps) {
  const displayClasses: Record<Breakpoint, Record<string, string>> = {
    xs: {
      block: 'hidden',
      flex: 'hidden',
      grid: 'hidden',
      inline: 'hidden',
      'inline-flex': 'hidden',
      'inline-block': 'hidden',
    },
    sm: {
      block: 'block sm:hidden',
      flex: 'flex sm:hidden',
      grid: 'grid sm:hidden',
      inline: 'inline sm:hidden',
      'inline-flex': 'inline-flex sm:hidden',
      'inline-block': 'inline-block sm:hidden',
    },
    md: {
      block: 'block md:hidden',
      flex: 'flex md:hidden',
      grid: 'grid md:hidden',
      inline: 'inline md:hidden',
      'inline-flex': 'inline-flex md:hidden',
      'inline-block': 'inline-block md:hidden',
    },
    lg: {
      block: 'block lg:hidden',
      flex: 'flex lg:hidden',
      grid: 'grid lg:hidden',
      inline: 'inline lg:hidden',
      'inline-flex': 'inline-flex lg:hidden',
      'inline-block': 'inline-block lg:hidden',
    },
    xl: {
      block: 'block xl:hidden',
      flex: 'flex xl:hidden',
      grid: 'grid xl:hidden',
      inline: 'inline xl:hidden',
      'inline-flex': 'inline-flex xl:hidden',
      'inline-block': 'inline-block xl:hidden',
    },
    '2xl': {
      block: 'block 2xl:hidden',
      flex: 'flex 2xl:hidden',
      grid: 'grid 2xl:hidden',
      inline: 'inline 2xl:hidden',
      'inline-flex': 'inline-flex 2xl:hidden',
      'inline-block': 'inline-block 2xl:hidden',
    },
  };

  return (
    <div className={cn(displayClasses[breakpoint][as], className)}>
      {children}
    </div>
  );
}

/**
 * MobileOnly Component
 * 
 * Shorthand for showing content only on mobile devices (below md breakpoint)
 */
export function MobileOnly({
  children,
  as = 'block',
  className,
}: Omit<HideAboveProps, 'breakpoint'>) {
  return (
    <HideAbove breakpoint="md" as={as} className={className}>
      {children}
    </HideAbove>
  );
}

/**
 * TabletOnly Component
 * 
 * Shows content only on tablet devices (md to lg breakpoint)
 */
export function TabletOnly({
  children,
  as = 'block',
  className,
}: Omit<HideAboveProps, 'breakpoint'>) {
  const displayClasses: Record<string, string> = {
    block: 'hidden md:block lg:hidden',
    flex: 'hidden md:flex lg:hidden',
    grid: 'hidden md:grid lg:hidden',
    inline: 'hidden md:inline lg:hidden',
    'inline-flex': 'hidden md:inline-flex lg:hidden',
    'inline-block': 'hidden md:inline-block lg:hidden',
  };

  return (
    <div className={cn(displayClasses[as], className)}>
      {children}
    </div>
  );
}

/**
 * DesktopOnly Component
 * 
 * Shorthand for showing content only on desktop (lg and above)
 */
export function DesktopOnly({
  children,
  as = 'block',
  className,
}: Omit<ShowAboveProps, 'breakpoint'>) {
  return (
    <ShowAbove breakpoint="lg" as={as} className={className}>
      {children}
    </ShowAbove>
  );
}

/**
 * TouchDeviceOnly Component
 * 
 * Shows content only on touch devices
 */
export function TouchDeviceOnly({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('@media (hover: none) and (pointer: coarse)', className)}>
      {children}
    </div>
  );
}
