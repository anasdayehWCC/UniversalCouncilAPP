/**
 * Keyboard Shortcuts Type Definitions
 * Supports Mac/Windows key detection, context-aware shortcuts, and conflict detection
 */

/** Modifier keys that can be combined with shortcuts */
export type ModifierKey = 'meta' | 'ctrl' | 'alt' | 'shift';

/** Platform-specific key representation */
export interface PlatformKeys {
  mac: string;
  windows: string;
}

/** Shortcut context determines when a shortcut is active */
export type ShortcutContext =
  | 'global'           // Always active
  | 'editor'           // Active in editor/form contexts
  | 'dialog'           // Active when dialogs are open
  | 'navigation'       // Active during navigation
  | 'recording'        // Active during audio recording
  | 'transcription'    // Active in transcription view
  | 'review'           // Active in review queue
  | 'admin';           // Active in admin panels

/** Priority levels for conflict resolution */
export type ShortcutPriority = 'low' | 'normal' | 'high' | 'critical';

/** A single keyboard shortcut definition */
export interface Shortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Human-readable label */
  label: string;
  /** Description of what the shortcut does */
  description?: string;
  /** Key combination (e.g., 'k', 'Escape', 'Enter') */
  key: string;
  /** Required modifier keys */
  modifiers: ModifierKey[];
  /** Context(s) where this shortcut is active */
  contexts: ShortcutContext[];
  /** Handler function */
  handler: (event: KeyboardEvent) => void | boolean;
  /** Priority for conflict resolution (higher wins) */
  priority: ShortcutPriority;
  /** Whether the shortcut is currently enabled */
  enabled: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault: boolean;
  /** Whether to stop event propagation */
  stopPropagation: boolean;
  /** Group this shortcut belongs to */
  group?: string;
}

/** Input for registering a new shortcut */
export interface ShortcutInput {
  id: string;
  label: string;
  description?: string;
  key: string;
  modifiers?: ModifierKey[];
  contexts?: ShortcutContext[];
  handler: (event: KeyboardEvent) => void | boolean;
  priority?: ShortcutPriority;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  group?: string;
}

/** Group of related shortcuts */
export interface ShortcutGroup {
  id: string;
  label: string;
  description?: string;
  shortcuts: Shortcut[];
  icon?: string;
  order: number;
}

/** Conflict between two or more shortcuts */
export interface ShortcutConflict {
  key: string;
  modifiers: ModifierKey[];
  context: ShortcutContext;
  shortcuts: Shortcut[];
}

/** Platform detection result */
export interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  modifierKey: 'meta' | 'ctrl';
  modifierSymbol: string;
}

/** Shortcut registry state */
export interface ShortcutRegistryState {
  shortcuts: Map<string, Shortcut>;
  groups: Map<string, ShortcutGroup>;
  activeContexts: Set<ShortcutContext>;
  conflicts: ShortcutConflict[];
  platform: PlatformInfo;
}

/** Context value for ShortcutProvider */
export interface ShortcutContextValue {
  /** Register a new shortcut */
  register: (input: ShortcutInput) => () => void;
  /** Unregister a shortcut by ID */
  unregister: (id: string) => void;
  /** Enable/disable a shortcut */
  setEnabled: (id: string, enabled: boolean) => void;
  /** Add an active context */
  pushContext: (context: ShortcutContext) => void;
  /** Remove an active context */
  popContext: (context: ShortcutContext) => void;
  /** Get all registered shortcuts */
  getShortcuts: () => Shortcut[];
  /** Get shortcuts grouped by category */
  getGroups: () => ShortcutGroup[];
  /** Check for conflicts */
  getConflicts: () => ShortcutConflict[];
  /** Format shortcut for display */
  formatShortcut: (shortcut: Shortcut) => string;
  /** Platform information */
  platform: PlatformInfo;
  /** Whether help dialog is open */
  isHelpOpen: boolean;
  /** Open help dialog */
  openHelp: () => void;
  /** Close help dialog */
  closeHelp: () => void;
}

/** Key symbols for display */
export const KEY_SYMBOLS: Record<string, PlatformKeys> = {
  meta: { mac: '⌘', windows: 'Ctrl' },
  ctrl: { mac: '⌃', windows: 'Ctrl' },
  alt: { mac: '⌥', windows: 'Alt' },
  shift: { mac: '⇧', windows: 'Shift' },
  enter: { mac: '↩', windows: 'Enter' },
  escape: { mac: 'Esc', windows: 'Esc' },
  backspace: { mac: '⌫', windows: 'Backspace' },
  delete: { mac: '⌦', windows: 'Delete' },
  tab: { mac: '⇥', windows: 'Tab' },
  space: { mac: 'Space', windows: 'Space' },
  arrowup: { mac: '↑', windows: '↑' },
  arrowdown: { mac: '↓', windows: '↓' },
  arrowleft: { mac: '←', windows: '←' },
  arrowright: { mac: '→', windows: '→' },
};

/** Priority order for sorting */
export const PRIORITY_ORDER: Record<ShortcutPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};
