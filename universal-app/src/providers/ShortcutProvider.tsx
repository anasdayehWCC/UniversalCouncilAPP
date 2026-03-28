'use client';

/**
 * ShortcutProvider
 * Context provider for the keyboard shortcuts system
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createShortcutRegistry,
  type ShortcutInput,
  type ShortcutContext as ShortcutContextType,
  type Shortcut,
  type ShortcutGroup,
  type ShortcutConflict,
  type PlatformInfo,
  type ShortcutContextValue,
  DEFAULT_SHORTCUTS,
  DEFAULT_GROUPS,
} from '@/lib/shortcuts';

/** Context for shortcut system */
export const ShortcutContext = createContext<ShortcutContextValue | null>(null);

interface ShortcutProviderProps {
  children: ReactNode;
  /** Whether to register default shortcuts */
  includeDefaults?: boolean;
  /** Initial contexts to activate */
  initialContexts?: ShortcutContextType[];
}

export function ShortcutProvider({
  children,
  includeDefaults = true,
  initialContexts = ['global'],
}: ShortcutProviderProps) {
  // Create registry instance
  const registry = useMemo(() => createShortcutRegistry(), []);

  // Help dialog state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Register default groups
  useEffect(() => {
    if (includeDefaults) {
      for (const group of DEFAULT_GROUPS) {
        registry.registerGroup(
          group.id,
          group.label,
          undefined,
          group.icon,
          group.order
        );
      }
    }
  }, [registry, includeDefaults]);

  // Register default shortcuts
  useEffect(() => {
    if (includeDefaults) {
      const unregisters = DEFAULT_SHORTCUTS.map((shortcut) =>
        registry.register(shortcut)
      );

      return () => {
        unregisters.forEach((unregister) => unregister());
      };
    }
  }, [registry, includeDefaults]);

  // Initialize contexts
  useEffect(() => {
    for (const context of initialContexts) {
      registry.pushContext(context);
    }
  }, [registry, initialContexts]);

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if focused on input elements (unless it's a global shortcut)
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow certain shortcuts even in input fields
      const isMetaKey = event.metaKey || event.ctrlKey;
      const allowedInInput = ['k', 's', '/', 'Escape'].includes(event.key);

      if (isInputFocused && !(isMetaKey && allowedInInput)) {
        return;
      }

      registry.handleKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [registry]);

  // Listen for help shortcut event
  useEffect(() => {
    const handleShowHelp = () => setIsHelpOpen(true);
    window.addEventListener('shortcut:showHelp', handleShowHelp);
    return () => window.removeEventListener('shortcut:showHelp', handleShowHelp);
  }, []);

  // Context value
  const register = useCallback(
    (input: ShortcutInput) => registry.register(input),
    [registry]
  );

  const unregister = useCallback(
    (id: string) => registry.unregister(id),
    [registry]
  );

  const setEnabled = useCallback(
    (id: string, enabled: boolean) => registry.setEnabled(id, enabled),
    [registry]
  );

  const pushContext = useCallback(
    (context: ShortcutContextType) => registry.pushContext(context),
    [registry]
  );

  const popContext = useCallback(
    (context: ShortcutContextType) => registry.popContext(context),
    [registry]
  );

  const getShortcuts = useCallback(
    (): Shortcut[] => registry.getShortcuts(),
    [registry]
  );

  const getGroups = useCallback(
    (): ShortcutGroup[] => registry.getGroups(),
    [registry]
  );

  const getConflicts = useCallback(
    (): ShortcutConflict[] => registry.getConflicts(),
    [registry]
  );

  const formatShortcut = useCallback(
    (shortcut: Shortcut): string => registry.formatShortcut(shortcut),
    [registry]
  );

  const platform: PlatformInfo = useMemo(
    () => registry.getPlatform(),
    [registry]
  );

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

  const contextValue: ShortcutContextValue = useMemo(
    () => ({
      register,
      unregister,
      setEnabled,
      pushContext,
      popContext,
      getShortcuts,
      getGroups,
      getConflicts,
      formatShortcut,
      platform,
      isHelpOpen,
      openHelp,
      closeHelp,
    }),
    [
      register,
      unregister,
      setEnabled,
      pushContext,
      popContext,
      getShortcuts,
      getGroups,
      getConflicts,
      formatShortcut,
      platform,
      isHelpOpen,
      openHelp,
      closeHelp,
    ]
  );

  return (
    <ShortcutContext.Provider value={contextValue}>
      {children}
    </ShortcutContext.Provider>
  );
}

export default ShortcutProvider;
