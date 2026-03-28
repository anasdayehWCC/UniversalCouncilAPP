/**
 * Shortcut Registry
 * Manages registration, unregistration, and conflict detection for keyboard shortcuts
 */

import type {
  Shortcut,
  ShortcutInput,
  ShortcutGroup,
  ShortcutConflict,
  ShortcutContext,
  ModifierKey,
  PlatformInfo,
  ShortcutRegistryState,
  KEY_SYMBOLS,
  PRIORITY_ORDER,
} from './types';

/** Generate a unique key for shortcut lookup */
function getShortcutKey(key: string, modifiers: ModifierKey[]): string {
  const sortedModifiers = [...modifiers].sort();
  return `${sortedModifiers.join('+')}+${key.toLowerCase()}`;
}

/** Detect platform information */
function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isMac: false,
      isWindows: true,
      isLinux: false,
      modifierKey: 'ctrl',
      modifierSymbol: 'Ctrl',
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMac = /mac|ipod|iphone|ipad/.test(userAgent);
  const isWindows = /win/.test(userAgent);
  const isLinux = /linux/.test(userAgent) && !isWindows;

  return {
    isMac,
    isWindows,
    isLinux,
    modifierKey: isMac ? 'meta' : 'ctrl',
    modifierSymbol: isMac ? '⌘' : 'Ctrl',
  };
}

/** Create the shortcut registry */
export function createShortcutRegistry() {
  const state: ShortcutRegistryState = {
    shortcuts: new Map(),
    groups: new Map(),
    activeContexts: new Set(['global']),
    conflicts: [],
    platform: detectPlatform(),
  };

  /** Register a new shortcut */
  function register(input: ShortcutInput): () => void {
    const shortcut: Shortcut = {
      id: input.id,
      label: input.label,
      description: input.description,
      key: input.key,
      modifiers: input.modifiers ?? [],
      contexts: input.contexts ?? ['global'],
      handler: input.handler,
      priority: input.priority ?? 'normal',
      enabled: input.enabled ?? true,
      preventDefault: input.preventDefault ?? true,
      stopPropagation: input.stopPropagation ?? true,
      group: input.group,
    };

    state.shortcuts.set(shortcut.id, shortcut);

    // Add to group if specified
    if (shortcut.group) {
      const group = state.groups.get(shortcut.group);
      if (group) {
        group.shortcuts.push(shortcut);
      }
    }

    // Detect conflicts
    detectConflicts();

    // Return unregister function
    return () => unregister(shortcut.id);
  }

  /** Unregister a shortcut by ID */
  function unregister(id: string): void {
    const shortcut = state.shortcuts.get(id);
    if (!shortcut) return;

    state.shortcuts.delete(id);

    // Remove from group
    if (shortcut.group) {
      const group = state.groups.get(shortcut.group);
      if (group) {
        group.shortcuts = group.shortcuts.filter((s) => s.id !== id);
      }
    }

    // Re-detect conflicts
    detectConflicts();
  }

  /** Register a shortcut group */
  function registerGroup(
    id: string,
    label: string,
    description?: string,
    icon?: string,
    order: number = 0
  ): void {
    state.groups.set(id, {
      id,
      label,
      description,
      shortcuts: [],
      icon,
      order,
    });
  }

  /** Enable or disable a shortcut */
  function setEnabled(id: string, enabled: boolean): void {
    const shortcut = state.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  /** Add an active context */
  function pushContext(context: ShortcutContext): void {
    state.activeContexts.add(context);
  }

  /** Remove an active context */
  function popContext(context: ShortcutContext): void {
    if (context !== 'global') {
      state.activeContexts.delete(context);
    }
  }

  /** Check if a context is currently active */
  function isContextActive(context: ShortcutContext): boolean {
    return state.activeContexts.has(context);
  }

  /** Get all registered shortcuts */
  function getShortcuts(): Shortcut[] {
    return Array.from(state.shortcuts.values());
  }

  /** Get shortcuts grouped by category */
  function getGroups(): ShortcutGroup[] {
    const groups = Array.from(state.groups.values());
    
    // Add ungrouped shortcuts to a default group
    const ungroupedShortcuts = getShortcuts().filter((s) => !s.group);
    if (ungroupedShortcuts.length > 0) {
      groups.push({
        id: 'general',
        label: 'General',
        shortcuts: ungroupedShortcuts,
        order: -1,
      });
    }

    return groups.sort((a, b) => a.order - b.order);
  }

  /** Detect conflicts between shortcuts */
  function detectConflicts(): void {
    const conflicts: ShortcutConflict[] = [];
    const keyMap = new Map<string, Shortcut[]>();

    // Group shortcuts by key combination
    for (const shortcut of state.shortcuts.values()) {
      const key = getShortcutKey(shortcut.key, shortcut.modifiers);
      
      for (const context of shortcut.contexts) {
        const contextKey = `${key}:${context}`;
        const existing = keyMap.get(contextKey) || [];
        existing.push(shortcut);
        keyMap.set(contextKey, existing);
      }
    }

    // Find conflicts (multiple shortcuts for same key+context)
    for (const [contextKey, shortcuts] of keyMap) {
      if (shortcuts.length > 1) {
        const [keyPart, context] = contextKey.split(':');
        const [modifiersStr, key] = keyPart.split('+').reduce(
          (acc, part, i, arr) => {
            if (i === arr.length - 1) {
              acc[1] = part;
            } else {
              acc[0] = acc[0] ? `${acc[0]}+${part}` : part;
            }
            return acc;
          },
          ['', ''] as [string, string]
        );

        conflicts.push({
          key,
          modifiers: modifiersStr ? (modifiersStr.split('+') as ModifierKey[]) : [],
          context: context as ShortcutContext,
          shortcuts,
        });
      }
    }

    state.conflicts = conflicts;
  }

  /** Get current conflicts */
  function getConflicts(): ShortcutConflict[] {
    return state.conflicts;
  }

  /** Format a shortcut for display */
  function formatShortcut(shortcut: Shortcut): string {
    const { KEY_SYMBOLS } = require('./types');
    const platform = state.platform;
    const parts: string[] = [];

    // Add modifiers in consistent order
    const modifierOrder: ModifierKey[] = ['ctrl', 'alt', 'shift', 'meta'];
    for (const mod of modifierOrder) {
      if (shortcut.modifiers.includes(mod)) {
        const symbol = KEY_SYMBOLS[mod];
        parts.push(platform.isMac ? symbol.mac : symbol.windows);
      }
    }

    // Add the key
    const keyLower = shortcut.key.toLowerCase();
    const keySymbol = KEY_SYMBOLS[keyLower];
    if (keySymbol) {
      parts.push(platform.isMac ? keySymbol.mac : keySymbol.windows);
    } else {
      parts.push(shortcut.key.toUpperCase());
    }

    return platform.isMac ? parts.join('') : parts.join('+');
  }

  /** Handle a keyboard event */
  function handleKeyDown(event: KeyboardEvent): boolean {
    // Build modifier set from event
    const modifiers: ModifierKey[] = [];
    if (event.metaKey) modifiers.push('meta');
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    const key = event.key.toLowerCase();
    const shortcutKey = getShortcutKey(key, modifiers);

    // Find matching shortcuts
    const { PRIORITY_ORDER } = require('./types');
    const candidates: Shortcut[] = [];

    for (const shortcut of state.shortcuts.values()) {
      if (!shortcut.enabled) continue;
      
      // Check if key matches
      const candidateKey = getShortcutKey(shortcut.key.toLowerCase(), shortcut.modifiers);
      if (candidateKey !== shortcutKey) continue;

      // Check if any context is active
      const hasActiveContext = shortcut.contexts.some((ctx) => isContextActive(ctx));
      if (!hasActiveContext) continue;

      candidates.push(shortcut);
    }

    if (candidates.length === 0) return false;

    // Sort by priority (highest first)
    candidates.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);

    // Execute highest priority handler
    const shortcut = candidates[0];
    
    if (shortcut.preventDefault) {
      event.preventDefault();
    }
    if (shortcut.stopPropagation) {
      event.stopPropagation();
    }

    const result = shortcut.handler(event);
    return result !== false;
  }

  /** Get platform info */
  function getPlatform(): PlatformInfo {
    return state.platform;
  }

  return {
    register,
    unregister,
    registerGroup,
    setEnabled,
    pushContext,
    popContext,
    isContextActive,
    getShortcuts,
    getGroups,
    getConflicts,
    formatShortcut,
    handleKeyDown,
    getPlatform,
  };
}

/** Singleton registry instance */
let registryInstance: ReturnType<typeof createShortcutRegistry> | null = null;

/** Get or create the singleton registry */
export function getShortcutRegistry(): ReturnType<typeof createShortcutRegistry> {
  if (!registryInstance) {
    registryInstance = createShortcutRegistry();
  }
  return registryInstance;
}

/** Reset the registry (useful for testing) */
export function resetShortcutRegistry(): void {
  registryInstance = null;
}
