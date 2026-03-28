'use client';

/**
 * useShortcuts Hook
 * Register and manage keyboard shortcuts with conflict detection
 */

import { useContext, useCallback, useEffect, useRef } from 'react';
import { ShortcutContext as ShortcutProviderContext } from '@/providers/ShortcutProvider';
import type {
  ShortcutInput,
  ShortcutContext,
  Shortcut,
  ShortcutGroup,
  ShortcutConflict,
  PlatformInfo,
} from '@/lib/shortcuts/types';

/** Main hook for accessing the shortcut system */
export function useShortcuts() {
  const context = useContext(ShortcutProviderContext);

  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }

  return context;
}

/** Hook to register shortcuts that auto-unregister on unmount */
export function useRegisterShortcuts(shortcuts: ShortcutInput[]) {
  const { register } = useShortcuts();
  const unregisterRefs = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Register all shortcuts
    unregisterRefs.current = shortcuts.map((shortcut) => register(shortcut));

    // Cleanup on unmount
    return () => {
      unregisterRefs.current.forEach((unregister) => unregister());
      unregisterRefs.current = [];
    };
  }, [register, shortcuts]);
}

/** Hook to register a single shortcut */
export function useShortcut(
  id: string,
  key: string,
  handler: (event: KeyboardEvent) => void,
  options?: Partial<Omit<ShortcutInput, 'id' | 'key' | 'handler'>>
) {
  const { register } = useShortcuts();

  useEffect(() => {
    const unregister = register({
      id,
      key,
      handler,
      label: options?.label ?? id,
      modifiers: options?.modifiers,
      contexts: options?.contexts,
      priority: options?.priority,
      enabled: options?.enabled,
      preventDefault: options?.preventDefault,
      stopPropagation: options?.stopPropagation,
      group: options?.group,
      description: options?.description,
    });

    return unregister;
  }, [id, key, handler, options, register]);
}

/** Hook to manage shortcut contexts */
export function useShortcutContext(context: ShortcutContext) {
  const { pushContext, popContext } = useShortcuts();

  useEffect(() => {
    pushContext(context);
    return () => popContext(context);
  }, [context, pushContext, popContext]);
}

/** Hook to enable/disable a shortcut based on a condition */
export function useShortcutEnabled(id: string, enabled: boolean) {
  const { setEnabled } = useShortcuts();

  useEffect(() => {
    setEnabled(id, enabled);
  }, [id, enabled, setEnabled]);
}

/** Hook for search functionality (⌘K) */
export function useSearchShortcut(onSearch: () => void) {
  useShortcut('search.open', 'k', onSearch, {
    label: 'Open Search',
    modifiers: ['meta'],
    contexts: ['global'],
    priority: 'high',
    group: 'navigation',
  });
}

/** Hook for save functionality (⌘S) */
export function useSaveShortcut(onSave: () => void, enabled = true) {
  useShortcut('editor.save.custom', 's', onSave, {
    label: 'Save',
    modifiers: ['meta'],
    contexts: ['editor'],
    priority: 'high',
    group: 'editor',
    enabled,
  });
}

/** Hook for escape key handling */
export function useEscapeShortcut(onEscape: () => void, enabled = true) {
  useShortcut('escape.custom', 'Escape', onEscape, {
    label: 'Cancel/Close',
    modifiers: [],
    contexts: ['dialog', 'global'],
    priority: 'normal',
    enabled,
  });
}

/** Hook to detect platform */
export function usePlatform(): PlatformInfo {
  const { platform } = useShortcuts();
  return platform;
}

/** Hook to check if running on Mac */
export function useIsMac(): boolean {
  const { platform } = useShortcuts();
  return platform.isMac;
}

/** Hook to get the primary modifier key for the platform */
export function useModifierKey(): 'meta' | 'ctrl' {
  const { platform } = useShortcuts();
  return platform.modifierKey;
}

/** Hook to format a shortcut for display */
export function useFormatShortcut() {
  const { formatShortcut } = useShortcuts();
  return formatShortcut;
}

/** Hook to get all shortcuts */
export function useAllShortcuts(): Shortcut[] {
  const { getShortcuts } = useShortcuts();
  return getShortcuts();
}

/** Hook to get shortcut groups */
export function useShortcutGroups(): ShortcutGroup[] {
  const { getGroups } = useShortcuts();
  return getGroups();
}

/** Hook to get shortcut conflicts */
export function useShortcutConflicts(): ShortcutConflict[] {
  const { getConflicts } = useShortcuts();
  return getConflicts();
}

/** Hook for help dialog state */
export function useShortcutHelp() {
  const { isHelpOpen, openHelp, closeHelp } = useShortcuts();

  const toggleHelp = useCallback(() => {
    if (isHelpOpen) {
      closeHelp();
    } else {
      openHelp();
    }
  }, [isHelpOpen, openHelp, closeHelp]);

  return {
    isOpen: isHelpOpen,
    open: openHelp,
    close: closeHelp,
    toggle: toggleHelp,
  };
}
