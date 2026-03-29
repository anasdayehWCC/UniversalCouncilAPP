'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Key or keys to display */
  children: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual style */
  variant?: 'default' | 'ghost' | 'outline';
}

const sizeStyles = {
  sm: 'text-[10px] px-1 py-0.5 min-w-4 min-h-4',
  md: 'text-xs px-1.5 py-0.5 min-w-5 min-h-5',
  lg: 'text-sm px-2 py-1 min-w-6 min-h-6',
};

const variantStyles = {
  default: 'bg-muted border-border shadow-sm',
  ghost: 'bg-muted/50 border-transparent',
  outline: 'bg-transparent border-border',
};

/**
 * Kbd - Keyboard shortcut indicator
 * 
 * Use to display keyboard shortcuts in tooltips, menus, or inline.
 * 
 * @example
 * // Single key
 * <Kbd>⌘</Kbd>
 * 
 * @example
 * // Key combination
 * <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
 * 
 * @example
 * // With KeyboardShortcut helper
 * <KeyboardShortcut keys={['⌘', 'K']} />
 */
export function Kbd({
  children,
  size = 'md',
  variant = 'default',
  className,
  ...props
}: KbdProps) {
  return (
    <kbd
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md border font-mono font-medium',
        // Interactive feedback
        'select-none',
        // Size
        sizeStyles[size],
        // Variant
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export interface KeyboardShortcutProps {
  /** Array of keys in the shortcut */
  keys: string[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Separator between keys */
  separator?: 'plus' | 'then' | 'none';
  /** Additional class name */
  className?: string;
}

/**
 * KeyboardShortcut - Display a keyboard shortcut combination
 * 
 * @example
 * <KeyboardShortcut keys={['⌘', 'Shift', 'K']} />
 */
export function KeyboardShortcut({
  keys,
  size = 'md',
  separator = 'none',
  className,
}: KeyboardShortcutProps) {
  const separatorElement = {
    plus: <span className="mx-0.5 text-muted-foreground">+</span>,
    then: <span className="mx-1 text-muted-foreground">then</span>,
    none: null,
  }[separator];

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && separatorElement}
          <Kbd size={size}>{formatKey(key)}</Kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Format key names to symbols
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    cmd: '⌘',
    command: '⌘',
    meta: '⌘',
    ctrl: '⌃',
    control: '⌃',
    alt: '⌥',
    option: '⌥',
    shift: '⇧',
    enter: '↵',
    return: '↵',
    backspace: '⌫',
    delete: '⌦',
    escape: 'esc',
    esc: 'esc',
    tab: '⇥',
    space: '␣',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
  };
  
  const lower = key.toLowerCase();
  return keyMap[lower] || key.toUpperCase();
}

/**
 * Platform-aware modifier key
 * Returns ⌘ on Mac, Ctrl on Windows/Linux
 */
export function usePlatformModifier(): string {
  if (typeof window === 'undefined') return '⌘';
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘' : 'Ctrl';
}
