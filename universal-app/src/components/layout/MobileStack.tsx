'use client';

/**
 * MobileStack Component
 * 
 * Stacks children vertically on mobile, displays in a row on larger screens.
 * Perfect for form layouts and content that needs different mobile/desktop views.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { Breakpoint } from '@/lib/responsive/types';

interface MobileStackProps {
  children: React.ReactNode;
  /** Breakpoint at which to switch from stack to row */
  breakAt?: Breakpoint;
  /** Gap between items */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Vertical alignment in row mode */
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Horizontal alignment in row mode */
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Whether to reverse order on mobile */
  reverseOnMobile?: boolean;
  /** Additional class names */
  className?: string;
}

const gapMap: Record<string, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignMap: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const breakAtMap: Record<Breakpoint, string> = {
  xs: 'xs:flex-row',
  sm: 'sm:flex-row',
  md: 'md:flex-row',
  lg: 'lg:flex-row',
  xl: 'xl:flex-row',
  '2xl': '2xl:flex-row',
};

export function MobileStack({
  children,
  breakAt = 'md',
  gap = 'md',
  alignItems = 'stretch',
  justifyContent = 'start',
  reverseOnMobile = false,
  className,
}: MobileStackProps) {
  return (
    <div
      className={cn(
        'flex',
        reverseOnMobile ? 'flex-col-reverse' : 'flex-col',
        breakAtMap[breakAt],
        gapMap[gap],
        alignMap[alignItems],
        justifyMap[justifyContent],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * StackItem Component
 * 
 * Child component for MobileStack with responsive width control
 */

interface StackItemProps {
  children: React.ReactNode;
  /** Width in row mode (fraction or fixed) */
  rowWidth?: 'auto' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4' | 'full';
  /** Whether to grow to fill available space */
  grow?: boolean;
  /** Whether to shrink if needed */
  shrink?: boolean;
  /** Additional class names */
  className?: string;
}

const widthMap: Record<string, string> = {
  auto: 'w-auto',
  '1/2': 'md:w-1/2',
  '1/3': 'md:w-1/3',
  '2/3': 'md:w-2/3',
  '1/4': 'md:w-1/4',
  '3/4': 'md:w-3/4',
  full: 'w-full',
};

export function StackItem({
  children,
  rowWidth = 'auto',
  grow = false,
  shrink = true,
  className,
}: StackItemProps) {
  return (
    <div
      className={cn(
        'w-full', // Full width on mobile
        widthMap[rowWidth],
        grow && 'grow',
        shrink ? 'shrink' : 'shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}
