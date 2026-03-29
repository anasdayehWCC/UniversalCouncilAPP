'use client';

/**
 * KeyboardShortcutHint Component
 * 
 * Visual hint component showing keyboard shortcut keys with
 * platform-aware modifier display (⌘ vs Ctrl).
 * 
 * @module components/ui/KeyboardShortcutHint
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useIsMac } from '@/hooks/useKeyboardShortcuts';
import type { ModifierKey } from '@/lib/shortcuts/types';
import { KEY_SYMBOLS } from '@/lib/shortcuts/types';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcutHintProps {
  /** Key combination to display (e.g., 'k', 'Escape') */
  shortcutKey: string;
  /** Modifier keys required */
  modifiers?: ModifierKey[];
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'outline' | 'ghost' | 'solid';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show keys inline or as a block */
  inline?: boolean;
  /** Whether to join keys visually (no gap) */
  joined?: boolean;
  /** Separator between keys (default: none on Mac, + on Windows) */
  separator?: string;
  /** Label prefix */
  label?: string;
  /** Show the shortcut in a dark/light contrast mode */
  contrast?: 'auto' | 'light' | 'dark';
}

// ============================================================================
// Styles
// ============================================================================

const sizeClasses = {
  xs: 'text-[9px] px-1 py-0.5 min-w-[14px] h-[18px]',
  sm: 'text-[10px] px-1.5 py-0.5 min-w-[18px] h-[20px]',
  md: 'text-xs px-2 py-1 min-w-[22px] h-[24px]',
  lg: 'text-sm px-2.5 py-1 min-w-[28px] h-[28px]',
};

const variantClasses = {
  default:
    'bg-muted text-muted-foreground border border-border shadow-[0_1px_0_1px_rgba(0,0,0,0.05)]',
  outline:
    'bg-transparent text-muted-foreground border border-border',
  ghost:
    'bg-transparent text-muted-foreground',
  solid:
    'bg-foreground text-background border border-border shadow-sm',
};

const gapClasses = {
  joined: 'gap-0',
  spaced: 'gap-0.5',
};

// ============================================================================
// Component
// ============================================================================

function KeyboardShortcutHintComponent({
  shortcutKey,
  modifiers = [],
  size = 'sm',
  variant = 'default',
  className,
  inline = true,
  joined = false,
  separator,
  label,
  contrast = 'auto',
}: KeyboardShortcutHintProps) {
  const isMac = useIsMac();

  // Format keys for display
  const formattedKeys = useMemo(() => {
    const parts: string[] = [];
    const modifierOrder: ModifierKey[] = ['ctrl', 'alt', 'shift', 'meta'];

    // Add modifiers in consistent order
    for (const mod of modifierOrder) {
      if (modifiers.includes(mod)) {
        const symbol = KEY_SYMBOLS[mod];
        parts.push(isMac ? symbol.mac : symbol.windows);
      }
    }

    // Add the main key
    const keyLower = shortcutKey.toLowerCase();
    const keySymbol = KEY_SYMBOLS[keyLower];
    if (keySymbol) {
      parts.push(isMac ? keySymbol.mac : keySymbol.windows);
    } else {
      parts.push(shortcutKey.toUpperCase());
    }

    return parts;
  }, [shortcutKey, modifiers, isMac]);

  // Determine separator
  const keySeparator = separator ?? (isMac ? '' : '+');

  if (formattedKeys.length === 0) {
    return null;
  }

  const containerClass = inline ? 'inline-flex' : 'flex';

  // Render separate kbd elements or joined
  const renderKeys = () => {
    if (joined || (isMac && keySeparator === '')) {
      // Render as single kbd with joined keys
      return (
        <kbd
          className={cn(
            'inline-flex items-center justify-center rounded font-mono font-medium tracking-tight',
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          {formattedKeys.join(keySeparator)}
        </kbd>
      );
    }

    // Render separate kbd elements
    return formattedKeys.map((key, index) => (
      <span key={index} className="contents">
        {index > 0 && keySeparator && !isMac && (
          <span className="text-muted-foreground text-xs mx-0.5">
            {keySeparator}
          </span>
        )}
        <kbd
          className={cn(
            'inline-flex items-center justify-center rounded font-mono font-medium',
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          {key}
        </kbd>
      </span>
    ));
  };

  return (
    <span
      className={cn(
        containerClass,
        'items-center',
        joined ? gapClasses.joined : gapClasses.spaced,
        className
      )}
      role="img"
      aria-label={`Keyboard shortcut: ${label || formattedKeys.join(' + ')}`}
    >
      {label && (
        <span className="text-xs text-muted-foreground mr-2">
          {label}
        </span>
      )}
      {renderKeys()}
    </span>
  );
}

export const KeyboardShortcutHint = memo(KeyboardShortcutHintComponent);
KeyboardShortcutHint.displayName = 'KeyboardShortcutHint';

// ============================================================================
// Preset Shortcuts
// ============================================================================

/** ⌘/Ctrl + K */
export function CmdK({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <KeyboardShortcutHint
      shortcutKey="k"
      modifiers={['meta']}
      className={className}
      size={size}
    />
  );
}
CmdK.displayName = 'CmdK';

/** ⌘/Ctrl + S */
export function CmdS({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <KeyboardShortcutHint
      shortcutKey="s"
      modifiers={['meta']}
      className={className}
      size={size}
    />
  );
}
CmdS.displayName = 'CmdS';

/** ⌘/Ctrl + N */
export function CmdN({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <KeyboardShortcutHint
      shortcutKey="n"
      modifiers={['meta']}
      className={className}
      size={size}
    />
  );
}
CmdN.displayName = 'CmdN';

/** ⌘/Ctrl + / */
export function CmdSlash({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <KeyboardShortcutHint
      shortcutKey="/"
      modifiers={['meta']}
      className={className}
      size={size}
    />
  );
}
CmdSlash.displayName = 'CmdSlash';

/** Escape key */
export function EscapeKey({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <KeyboardShortcutHint
      shortcutKey="Escape"
      className={className}
      size={size}
    />
  );
}
EscapeKey.displayName = 'EscapeKey';

/** Enter key */
export function EnterKey({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <KeyboardShortcutHint
      shortcutKey="enter"
      className={className}
      size={size}
    />
  );
}
EnterKey.displayName = 'EnterKey';

/** Arrow keys */
export function ArrowKeys({
  direction,
  className,
  size = 'sm',
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const keyMap = {
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
  };
  return (
    <KeyboardShortcutHint
      shortcutKey={keyMap[direction]}
      className={className}
      size={size}
    />
  );
}
ArrowKeys.displayName = 'ArrowKeys';

// ============================================================================
// Export
// ============================================================================

export default KeyboardShortcutHint;
