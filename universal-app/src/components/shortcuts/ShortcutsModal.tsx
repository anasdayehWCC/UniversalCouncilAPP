'use client';

/**
 * ShortcutsModal Component
 * 
 * Modal dialog showing all available keyboard shortcuts organized by category.
 * Features searchable list, context filtering, and platform-aware key display.
 * 
 * Triggered by ⌘/Ctrl + /
 * 
 * @module components/shortcuts/ShortcutsModal
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Keyboard, Command, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShortcuts } from '@/hooks/useShortcuts';
import { KeyboardShortcutHint } from '@/components/ui/KeyboardShortcutHint';
import type { ShortcutGroup, ShortcutContext, Shortcut } from '@/lib/shortcuts/types';

// ============================================================================
// Types
// ============================================================================

export interface ShortcutsModalProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Whether to show the context filter */
  showContextFilter?: boolean;
  /** Initial context filter */
  initialContext?: ShortcutContext | 'all';
  /** Additional CSS classes */
  className?: string;
}

interface ContextOption {
  value: ShortcutContext | 'all';
  label: string;
  icon?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CONTEXT_OPTIONS: ContextOption[] = [
  { value: 'all', label: 'All Shortcuts' },
  { value: 'global', label: 'Global', icon: '🌐' },
  { value: 'editor', label: 'Editor', icon: '✏️' },
  { value: 'dialog', label: 'Dialogs', icon: '💬' },
  { value: 'navigation', label: 'Navigation', icon: '🧭' },
  { value: 'recording', label: 'Recording', icon: '🎙️' },
  { value: 'transcription', label: 'Transcription', icon: '📝' },
  { value: 'review', label: 'Review', icon: '✅' },
  { value: 'admin', label: 'Admin', icon: '⚙️' },
];

// ============================================================================
// Animation Variants
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -20 },
};

// ============================================================================
// Main Component
// ============================================================================

export function ShortcutsModal({
  open,
  onOpenChange,
  title = 'Keyboard Shortcuts',
  description,
  showContextFilter = true,
  initialContext = 'all',
  className,
}: ShortcutsModalProps) {
  const { isHelpOpen, closeHelp, getGroups, platform, getConflicts } = useShortcuts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<ShortcutContext | 'all'>(initialContext);
  const [highlightedShortcut, setHighlightedShortcut] = useState<string | null>(null);

  // Use controlled or internal state
  const isOpen = open ?? isHelpOpen;
  const handleClose = useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      closeHelp();
    }
    setSearchQuery('');
    setHighlightedShortcut(null);
  }, [onOpenChange, closeHelp]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, handleClose]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const searchInput = document.getElementById('shortcuts-search-input');
        searchInput?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Get conflicts
  const conflicts = useMemo(() => getConflicts(), [getConflicts]);

  // Filter groups based on search and context
  const filteredGroups = useMemo(() => {
    const groups = getGroups();
    const query = searchQuery.toLowerCase().trim();

    return groups
      .map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter((shortcut) => {
          // Filter by search query
          const matchesSearch =
            !query ||
            shortcut.label.toLowerCase().includes(query) ||
            shortcut.description?.toLowerCase().includes(query) ||
            shortcut.key.toLowerCase().includes(query) ||
            shortcut.id.toLowerCase().includes(query);

          // Filter by context
          const matchesContext =
            selectedContext === 'all' ||
            shortcut.contexts.includes(selectedContext);

          return matchesSearch && matchesContext && shortcut.enabled;
        }),
      }))
      .filter((group) => group.shortcuts.length > 0);
  }, [getGroups, searchQuery, selectedContext]);

  // Count total shortcuts
  const totalShortcuts = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.shortcuts.length, 0),
    [filteredGroups]
  );

  // Handle shortcut click (for highlighting)
  const handleShortcutClick = useCallback((shortcutId: string) => {
    setHighlightedShortcut((prev) => (prev === shortcutId ? null : shortcutId));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-modal-title"
              className={cn(
                'rounded-2xl border border-border dark:border-border',
                'bg-card dark:bg-card shadow-2xl',
                'max-h-[85vh] overflow-hidden flex flex-col',
                className
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border dark:border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                    <Keyboard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2
                      id="shortcuts-modal-title"
                      className="text-lg font-semibold text-foreground dark:text-foreground"
                    >
                      {title}
                    </h2>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {description || `${platform.isMac ? 'Mac' : 'Windows/Linux'} keyboard shortcuts`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className={cn(
                    'rounded-lg p-2 text-muted-foreground transition-all',
                    'hover:bg-muted hover:text-foreground',
                    'dark:hover:bg-muted dark:hover:text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    'dark:focus:ring-offset-slate-900'
                  )}
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="border-b border-border dark:border-border px-6 py-4 space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="shortcuts-search-input"
                    type="text"
                    placeholder="Search shortcuts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'w-full rounded-lg border border-input dark:border-input',
                      'bg-muted dark:bg-muted py-2.5 pl-10 pr-4',
                      'text-sm text-foreground dark:text-foreground',
                      'placeholder:text-muted-foreground dark:placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                      'transition-shadow'
                    )}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Context Filter */}
                {showContextFilter && (
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_OPTIONS.map((ctx) => (
                      <button
                        key={ctx.value}
                        onClick={() => setSelectedContext(ctx.value)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                          selectedContext === ctx.value
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                            : 'bg-muted text-foreground hover:bg-muted/80 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80'
                        )}
                      >
                        {ctx.icon && <span className="mr-1">{ctx.icon}</span>}
                        {ctx.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Shortcuts List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {filteredGroups.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} />
                ) : (
                  <div className="space-y-6">
                    {filteredGroups.map((group) => (
                      <ShortcutGroupSection
                        key={group.id}
                        group={group}
                        highlightedId={highlightedShortcut}
                        onShortcutClick={handleShortcutClick}
                        conflicts={conflicts}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border dark:border-border px-6 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      Press <KeyboardShortcutHint shortcutKey="Escape" size="xs" /> to close
                    </span>
                    <span className="flex items-center gap-1.5">
                      <KeyboardShortcutHint shortcutKey="/" modifiers={['meta']} size="xs" /> to toggle
                    </span>
                  </div>
                  <span className="font-medium">
                    {totalShortcuts} shortcut{totalShortcuts !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted dark:bg-muted p-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground dark:text-foreground mb-1">
        No shortcuts found
      </h3>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-[250px]">
        {searchQuery
          ? `No shortcuts match "${searchQuery}". Try a different search term.`
          : 'No shortcuts available for the selected context.'}
      </p>
    </div>
  );
}

interface ShortcutGroupSectionProps {
  group: ShortcutGroup;
  highlightedId: string | null;
  onShortcutClick: (id: string) => void;
  conflicts: Array<{ shortcuts: Shortcut[] }>;
}

function ShortcutGroupSection({
  group,
  highlightedId,
  onShortcutClick,
  conflicts,
}: ShortcutGroupSectionProps) {
  // Find conflicting shortcut IDs
  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const conflict of conflicts) {
      for (const shortcut of conflict.shortcuts) {
        ids.add(shortcut.id);
      }
    }
    return ids;
  }, [conflicts]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {group.icon && <span className="text-base">{group.icon}</span>}
        <h3 className="text-sm font-semibold text-foreground dark:text-foreground uppercase tracking-wide">
          {group.label}
        </h3>
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
          ({group.shortcuts.length})
        </span>
      </div>
      <div className="space-y-1">
        {group.shortcuts.map((shortcut) => {
          const hasConflict = conflictingIds.has(shortcut.id);
          const isHighlighted = highlightedId === shortcut.id;

          return (
            <button
              key={shortcut.id}
              onClick={() => onShortcutClick(shortcut.id)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg px-3 py-2.5',
                'transition-all duration-150 text-left',
                isHighlighted
                  ? 'bg-[var(--primary)]/10 dark:bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/30'
                  : 'hover:bg-muted dark:hover:bg-muted',
                hasConflict && 'border-l-2 border-warning'
              )}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground dark:text-foreground truncate">
                    {shortcut.label}
                  </p>
                  {hasConflict && (
                    <span
                      className="inline-flex items-center text-warning dark:text-warning"
                      title="This shortcut has conflicts with other shortcuts"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                {shortcut.description && (
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate mt-0.5">
                    {shortcut.description}
                  </p>
                )}
              </div>
              <KeyboardShortcutHint
                shortcutKey={shortcut.key}
                modifiers={shortcut.modifiers}
                size="md"
                variant="outline"
                className="flex-shrink-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ShortcutsModal;
