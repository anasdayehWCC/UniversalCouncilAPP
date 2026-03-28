'use client';

/**
 * useKeyboardShortcuts Hook
 * 
 * Comprehensive hook for registering and managing keyboard shortcuts.
 * Provides cleanup on unmount, disabled state support, and type-safe APIs.
 * 
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useShortcuts as useShortcutContext } from './useShortcuts';
import type {
  ShortcutInput,
  ShortcutContext,
  Shortcut,
  ShortcutGroup,
  ShortcutConflict,
  ModifierKey,
  PlatformInfo,
} from '@/lib/shortcuts/types';

// ============================================================================
// Types
// ============================================================================

/** Configuration for a keyboard shortcut */
export interface KeyboardShortcutConfig {
  /** Unique identifier */
  id: string;
  /** The key to listen for (e.g., 'k', 'Escape', 'Enter') */
  key: string;
  /** Required modifier keys */
  modifiers?: ModifierKey[];
  /** Handler function - return false to allow default behavior */
  handler: (event: KeyboardEvent) => void | boolean;
  /** Human-readable label */
  label?: string;
  /** Description of what the shortcut does */
  description?: string;
  /** Contexts where this shortcut is active */
  contexts?: ShortcutContext[];
  /** Priority for conflict resolution */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  /** Whether the shortcut is enabled */
  enabled?: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
  /** Group this shortcut belongs to */
  group?: string;
}

/** Options for the useKeyboardShortcuts hook */
export interface UseKeyboardShortcutsOptions {
  /** Whether all shortcuts in this group are disabled */
  disabled?: boolean;
  /** Default context for all shortcuts */
  defaultContext?: ShortcutContext;
  /** Prefix for shortcut IDs to avoid conflicts */
  idPrefix?: string;
}

/** Return type for useKeyboardShortcuts */
export interface UseKeyboardShortcutsReturn {
  /** Register a new shortcut dynamically */
  register: (config: KeyboardShortcutConfig) => () => void;
  /** Enable a shortcut by ID */
  enable: (id: string) => void;
  /** Disable a shortcut by ID */
  disable: (id: string) => void;
  /** Check if a shortcut is enabled */
  isEnabled: (id: string) => boolean;
  /** Get platform information */
  platform: PlatformInfo;
  /** Format a shortcut for display */
  formatShortcut: (shortcut: Shortcut) => string;
  /** Open the shortcuts help dialog */
  openHelp: () => void;
  /** Close the shortcuts help dialog */
  closeHelp: () => void;
  /** Whether the help dialog is open */
  isHelpOpen: boolean;
  /** Get all registered shortcuts */
  getAllShortcuts: () => Shortcut[];
  /** Get shortcuts grouped by category */
  getGroups: () => ShortcutGroup[];
  /** Get any conflicts between shortcuts */
  getConflicts: () => ShortcutConflict[];
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for registering multiple keyboard shortcuts with automatic cleanup.
 * 
 * @example
 * ```tsx
 * const { register, platform } = useKeyboardShortcuts([
 *   {
 *     id: 'save',
 *     key: 's',
 *     modifiers: ['meta'],
 *     handler: () => handleSave(),
 *     label: 'Save Document',
 *   },
 *   {
 *     id: 'cancel',
 *     key: 'Escape',
 *     handler: () => handleCancel(),
 *     label: 'Cancel',
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[] = [],
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const {
    register: contextRegister,
    setEnabled,
    platform,
    formatShortcut,
    openHelp,
    closeHelp,
    isHelpOpen,
    getShortcuts,
    getGroups,
    getConflicts,
  } = useShortcutContext();

  const { disabled = false, defaultContext = 'global', idPrefix = '' } = options;
  const unregisterRefs = useRef<Map<string, () => void>>(new Map());
  const enabledStateRef = useRef<Map<string, boolean>>(new Map());

  // Build full ID with prefix
  const getFullId = useCallback(
    (id: string) => (idPrefix ? `${idPrefix}.${id}` : id),
    [idPrefix]
  );

  // Register a single shortcut
  const register = useCallback(
    (config: KeyboardShortcutConfig): (() => void) => {
      const fullId = getFullId(config.id);
      
      // Unregister existing shortcut with same ID
      const existingUnregister = unregisterRefs.current.get(fullId);
      if (existingUnregister) {
        existingUnregister();
      }

      const input: ShortcutInput = {
        id: fullId,
        key: config.key,
        modifiers: config.modifiers ?? [],
        handler: config.handler,
        label: config.label ?? config.id,
        description: config.description,
        contexts: config.contexts ?? [defaultContext],
        priority: config.priority,
        enabled: disabled ? false : (config.enabled ?? true),
        preventDefault: config.preventDefault ?? true,
        stopPropagation: config.stopPropagation ?? true,
        group: config.group,
      };

      const unregister = contextRegister(input);
      unregisterRefs.current.set(fullId, unregister);
      enabledStateRef.current.set(fullId, input.enabled ?? true);

      return () => {
        unregister();
        unregisterRefs.current.delete(fullId);
        enabledStateRef.current.delete(fullId);
      };
    },
    [contextRegister, defaultContext, disabled, getFullId]
  );

  // Register initial shortcuts
  useEffect(() => {
    const unregisters: (() => void)[] = [];

    for (const config of shortcuts) {
      const unregister = register(config);
      unregisters.push(unregister);
    }

    return () => {
      unregisters.forEach((unregister) => unregister());
    };
  }, [shortcuts, register]);

  // Handle disabled state changes
  useEffect(() => {
    for (const [id, originalState] of enabledStateRef.current) {
      setEnabled(id, disabled ? false : originalState);
    }
  }, [disabled, setEnabled]);

  // Enable a shortcut
  const enable = useCallback(
    (id: string) => {
      const fullId = getFullId(id);
      enabledStateRef.current.set(fullId, true);
      if (!disabled) {
        setEnabled(fullId, true);
      }
    },
    [disabled, getFullId, setEnabled]
  );

  // Disable a shortcut
  const disable = useCallback(
    (id: string) => {
      const fullId = getFullId(id);
      enabledStateRef.current.set(fullId, false);
      setEnabled(fullId, false);
    },
    [getFullId, setEnabled]
  );

  // Check if enabled
  const isEnabled = useCallback(
    (id: string): boolean => {
      const fullId = getFullId(id);
      return enabledStateRef.current.get(fullId) ?? false;
    },
    [getFullId]
  );

  // Get all shortcuts
  const getAllShortcuts = useCallback(() => getShortcuts(), [getShortcuts]);

  return useMemo(
    () => ({
      register,
      enable,
      disable,
      isEnabled,
      platform,
      formatShortcut,
      openHelp,
      closeHelp,
      isHelpOpen,
      getAllShortcuts,
      getGroups,
      getConflicts,
    }),
    [
      register,
      enable,
      disable,
      isEnabled,
      platform,
      formatShortcut,
      openHelp,
      closeHelp,
      isHelpOpen,
      getAllShortcuts,
      getGroups,
      getConflicts,
    ]
  );
}

// ============================================================================
// Single Shortcut Hook
// ============================================================================

/**
 * Hook for registering a single keyboard shortcut with automatic cleanup.
 * 
 * @example
 * ```tsx
 * useKeyboardShortcut('save', 's', () => handleSave(), { modifiers: ['meta'] });
 * ```
 */
export function useKeyboardShortcut(
  id: string,
  key: string,
  handler: (event: KeyboardEvent) => void | boolean,
  options?: Omit<KeyboardShortcutConfig, 'id' | 'key' | 'handler'>
) {
  const config = useMemo(
    (): KeyboardShortcutConfig => ({
      id,
      key,
      handler,
      ...options,
    }),
    [id, key, handler, options]
  );

  return useKeyboardShortcuts([config]);
}

// ============================================================================
// Context Hook
// ============================================================================

/**
 * Hook to push a shortcut context when a component mounts.
 * Automatically pops the context on unmount.
 * 
 * @example
 * ```tsx
 * // In a modal component
 * useShortcutContext('dialog');
 * ```
 */
export function useShortcutActiveContext(context: ShortcutContext) {
  const { pushContext, popContext } = useShortcutContext();

  useEffect(() => {
    pushContext(context);
    return () => popContext(context);
  }, [context, pushContext, popContext]);
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for the ⌘/Ctrl + K search shortcut
 */
export function useSearchShortcut(onSearch: () => void, enabled = true) {
  return useKeyboardShortcuts(
    [
      {
        id: 'search.open',
        key: 'k',
        modifiers: ['meta'],
        handler: onSearch,
        label: 'Open Search',
        description: 'Open the quick search dialog',
        contexts: ['global'],
        priority: 'high',
        enabled,
        group: 'navigation',
      },
    ],
    { disabled: !enabled }
  );
}

/**
 * Hook for the ⌘/Ctrl + S save shortcut
 */
export function useSaveShortcut(onSave: () => void, enabled = true) {
  return useKeyboardShortcuts(
    [
      {
        id: 'save',
        key: 's',
        modifiers: ['meta'],
        handler: (e) => {
          e.preventDefault();
          onSave();
        },
        label: 'Save',
        description: 'Save the current document',
        contexts: ['editor', 'global'],
        priority: 'high',
        enabled,
        group: 'editor',
      },
    ],
    { disabled: !enabled }
  );
}

/**
 * Hook for the ⌘/Ctrl + N new recording shortcut
 */
export function useNewRecordingShortcut(onNew: () => void, enabled = true) {
  return useKeyboardShortcuts(
    [
      {
        id: 'recording.new',
        key: 'n',
        modifiers: ['meta'],
        handler: (e) => {
          e.preventDefault();
          onNew();
        },
        label: 'New Recording',
        description: 'Start a new recording',
        contexts: ['global'],
        priority: 'high',
        enabled,
        group: 'recording',
      },
    ],
    { disabled: !enabled }
  );
}

/**
 * Hook for the Escape key
 */
export function useEscapeShortcut(onEscape: () => void, enabled = true) {
  return useKeyboardShortcuts(
    [
      {
        id: 'escape',
        key: 'Escape',
        handler: onEscape,
        label: 'Cancel/Close',
        description: 'Close the current dialog or panel',
        contexts: ['dialog', 'global'],
        priority: 'normal',
        enabled,
      },
    ],
    { disabled: !enabled }
  );
}

/**
 * Hook for the ⌘/Ctrl + / show shortcuts shortcut
 */
export function useShowShortcutsShortcut(onShow?: () => void) {
  const { openHelp } = useShortcutContext();

  return useKeyboardShortcuts([
    {
      id: 'help.shortcuts',
      key: '/',
      modifiers: ['meta'],
      handler: () => {
        if (onShow) {
          onShow();
        } else {
          openHelp();
        }
      },
      label: 'Show Shortcuts',
      description: 'Display keyboard shortcuts help',
      contexts: ['global'],
      priority: 'critical',
      group: 'help',
    },
  ]);
}

// ============================================================================
// Platform Detection Hooks
// ============================================================================

/**
 * Hook to get platform information
 */
export function usePlatform(): PlatformInfo {
  const { platform } = useShortcutContext();
  return platform;
}

/**
 * Hook to check if running on Mac
 */
export function useIsMac(): boolean {
  const { platform } = useShortcutContext();
  return platform.isMac;
}

/**
 * Hook to get the correct modifier symbol for the platform
 */
export function useModifierSymbol(): string {
  const { platform } = useShortcutContext();
  return platform.modifierSymbol;
}

// ============================================================================
// Re-exports
// ============================================================================

export type {
  ShortcutInput,
  ShortcutContext,
  Shortcut,
  ShortcutGroup,
  ShortcutConflict,
  ModifierKey,
  PlatformInfo,
};
