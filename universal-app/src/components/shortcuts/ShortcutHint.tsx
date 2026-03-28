'use client';

/**
 * ShortcutHint Component
 * Displays an inline keyboard shortcut hint with platform-aware key symbols
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useShortcuts } from '@/hooks/useShortcuts';
import type { ModifierKey } from '@/lib/shortcuts/types';
import { KEY_SYMBOLS } from '@/lib/shortcuts/types';

interface ShortcutHintProps {
  /** The shortcut ID to display */
  shortcutId?: string;
  /** Direct key specification (alternative to shortcutId) */
  keys?: {
    key: string;
    modifiers?: ModifierKey[];
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as inline or block */
  inline?: boolean;
}

const sizeClasses = {
  sm: 'text-[10px] px-1 py-0.5 min-w-[16px]',
  md: 'text-xs px-1.5 py-0.5 min-w-[20px]',
  lg: 'text-sm px-2 py-1 min-w-[24px]',
};

const variantClasses = {
  default:
    'bg-muted text-muted-foreground border border-border shadow-sm',
  outline:
    'bg-transparent text-muted-foreground border border-border',
  ghost:
    'bg-transparent text-muted-foreground/70',
};

function ShortcutHintComponent({
  shortcutId,
  keys,
  size = 'sm',
  variant = 'default',
  className,
  inline = true,
}: ShortcutHintProps) {
  const { platform, getShortcuts } = useShortcuts();

  const shortcutKeys = useMemo(() => {
    if (keys) {
      return {
        key: keys.key,
        modifiers: keys.modifiers ?? [],
      };
    }

    if (shortcutId) {
      const shortcuts = getShortcuts();
      const shortcut = shortcuts.find((s) => s.id === shortcutId);
      if (shortcut) {
        return {
          key: shortcut.key,
          modifiers: shortcut.modifiers,
        };
      }
    }

    return null;
  }, [shortcutId, keys, getShortcuts]);

  const formattedKeys = useMemo(() => {
    if (!shortcutKeys) return [];

    const parts: string[] = [];
    const modifierOrder: ModifierKey[] = ['ctrl', 'alt', 'shift', 'meta'];

    // Add modifiers in order
    for (const mod of modifierOrder) {
      if (shortcutKeys.modifiers.includes(mod)) {
        const symbol = KEY_SYMBOLS[mod];
        parts.push(platform.isMac ? symbol.mac : symbol.windows);
      }
    }

    // Add the main key
    const keyLower = shortcutKeys.key.toLowerCase();
    const keySymbol = KEY_SYMBOLS[keyLower];
    if (keySymbol) {
      parts.push(platform.isMac ? keySymbol.mac : keySymbol.windows);
    } else {
      parts.push(shortcutKeys.key.toUpperCase());
    }

    return parts;
  }, [shortcutKeys, platform.isMac]);

  if (!shortcutKeys || formattedKeys.length === 0) {
    return null;
  }

  const containerClass = inline ? 'inline-flex' : 'flex';

  return (
    <span
      className={cn(
        containerClass,
        'items-center gap-0.5',
        className
      )}
      aria-label={`Keyboard shortcut: ${formattedKeys.join(' ')}`}
    >
      {formattedKeys.map((key, index) => (
        <kbd
          key={index}
          className={cn(
            'inline-flex items-center justify-center rounded font-mono font-medium',
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export const ShortcutHint = memo(ShortcutHintComponent);
ShortcutHint.displayName = 'ShortcutHint';

/** Convenience component for common shortcuts */
export function CmdK({ className }: { className?: string }) {
  return (
    <ShortcutHint
      keys={{ key: 'k', modifiers: ['meta'] }}
      className={className}
    />
  );
}

export function CmdS({ className }: { className?: string }) {
  return (
    <ShortcutHint
      keys={{ key: 's', modifiers: ['meta'] }}
      className={className}
    />
  );
}

export function CmdSlash({ className }: { className?: string }) {
  return (
    <ShortcutHint
      keys={{ key: '/', modifiers: ['meta'] }}
      className={className}
    />
  );
}

export function Escape({ className }: { className?: string }) {
  return (
    <ShortcutHint
      keys={{ key: 'Escape', modifiers: [] }}
      className={className}
    />
  );
}
