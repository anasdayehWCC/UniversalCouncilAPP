'use client';

/**
 * ResponsiveContainer Component
 * 
 * A max-width container that adapts to different screen sizes.
 * Provides consistent horizontal padding and centered content.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { ContainerSize } from '@/lib/responsive/types';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  /** Container max-width size */
  size?: ContainerSize;
  /** Whether to include horizontal padding */
  padding?: boolean;
  /** Whether to center the container */
  center?: boolean;
  /** Additional class names */
  className?: string;
  /** HTML element to render */
  as?: 'div' | 'main' | 'section' | 'article';
}

const containerSizes: Record<ContainerSize, string> = {
  sm: 'max-w-screen-sm', // 640px
  md: 'max-w-screen-md', // 768px
  lg: 'max-w-screen-lg', // 1024px
  xl: 'max-w-screen-xl', // 1280px
  full: 'max-w-full',
};

export function ResponsiveContainer({
  children,
  size = 'xl',
  padding = true,
  center = true,
  className,
  as: Component = 'div',
}: ResponsiveContainerProps) {
  return (
    <Component
      className={cn(
        'w-full',
        containerSizes[size],
        center && 'mx-auto',
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * SafeAreaContainer Component
 * 
 * A container that respects safe area insets for notched devices.
 * Essential for social workers using modern phones/tablets in the field.
 */

interface SafeAreaContainerProps {
  children: React.ReactNode;
  /** Which edges to apply safe area padding */
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  /** Additional class names */
  className?: string;
}

export function SafeAreaContainer({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  className,
}: SafeAreaContainerProps) {
  const safeAreaClasses = edges.map(edge => {
    switch (edge) {
      case 'top':
        return 'pt-[env(safe-area-inset-top)]';
      case 'right':
        return 'pr-[env(safe-area-inset-right)]';
      case 'bottom':
        return 'pb-[env(safe-area-inset-bottom)]';
      case 'left':
        return 'pl-[env(safe-area-inset-left)]';
      default:
        return '';
    }
  });

  return (
    <div className={cn(safeAreaClasses, className)}>
      {children}
    </div>
  );
}

/**
 * TouchFriendlyContainer Component
 * 
 * Container that ensures touch-friendly sizing and spacing
 */

interface TouchFriendlyContainerProps {
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function TouchFriendlyContainer({
  children,
  className,
}: TouchFriendlyContainerProps) {
  return (
    <div
      className={cn(
        // Minimum tap target size
        '[&_button]:min-h-[44px] [&_button]:min-w-[44px]',
        '[&_a]:min-h-[44px]',
        '[&_input]:min-h-[44px]',
        '[&_select]:min-h-[44px]',
        // Touch-friendly spacing
        '[&_button+button]:ml-2',
        className
      )}
    >
      {children}
    </div>
  );
}
