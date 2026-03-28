'use client';

/**
 * ShortcutDialog Component
 * Displays a help dialog showing all available keyboard shortcuts
 * Triggered by ⌘/ (Cmd+/)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShortcuts } from '@/hooks/useShortcuts';
import { ShortcutHint } from './ShortcutHint';
import type { ShortcutGroup, ShortcutContext } from '@/lib/shortcuts/types';

interface ShortcutDialogProps {
  /** Whether the dialog is open */
  open?: boolean;
  /** Callback when dialog should close */
  onOpenChange?: (open: boolean) => void;
}

export function ShortcutDialog({ open, onOpenChange }: ShortcutDialogProps) {
  const { isHelpOpen, closeHelp, getGroups, platform } = useShortcuts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<ShortcutContext | 'all'>('all');

  // Use controlled or internal state
  const isOpen = open ?? isHelpOpen;
  const setIsOpen = onOpenChange ?? ((value: boolean) => !value && closeHelp());

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

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
            shortcut.key.toLowerCase().includes(query);

          // Filter by context
          const matchesContext =
            selectedContext === 'all' ||
            shortcut.contexts.includes(selectedContext);

          return matchesSearch && matchesContext;
        }),
      }))
      .filter((group) => group.shortcuts.length > 0);
  }, [getGroups, searchQuery, selectedContext]);

  const contexts: { value: ShortcutContext | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'global', label: 'Global' },
    { value: 'editor', label: 'Editor' },
    { value: 'dialog', label: 'Dialog' },
    { value: 'recording', label: 'Recording' },
    { value: 'transcription', label: 'Transcription' },
    { value: 'review', label: 'Review' },
  ];

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, [setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcut-dialog-title"
              className={cn(
                'rounded-xl border bg-background shadow-2xl',
                'max-h-[80vh] overflow-hidden flex flex-col'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Keyboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2
                      id="shortcut-dialog-title"
                      className="text-lg font-semibold"
                    >
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {platform.isMac ? 'Mac' : 'Windows/Linux'} shortcuts
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className={cn(
                    'rounded-lg p-2 text-muted-foreground transition-colors',
                    'hover:bg-muted hover:text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  )}
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="border-b px-6 py-3 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search shortcuts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'w-full rounded-lg border bg-muted/50 py-2 pl-9 pr-4',
                      'text-sm placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    )}
                    autoFocus
                  />
                </div>

                {/* Context Filter */}
                <div className="flex flex-wrap gap-2">
                  {contexts.map((ctx) => (
                    <button
                      key={ctx.value}
                      onClick={() => setSelectedContext(ctx.value)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        selectedContext === ctx.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shortcuts List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No shortcuts found matching your search.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredGroups.map((group) => (
                      <ShortcutGroupSection key={group.id} group={group} />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Press <ShortcutHint keys={{ key: 'Escape', modifiers: [] }} size="sm" /> to close</span>
                  <span>{filteredGroups.reduce((acc, g) => acc + g.shortcuts.length, 0)} shortcuts</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Renders a group of shortcuts */
function ShortcutGroupSection({ group }: { group: ShortcutGroup }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {group.icon && <span className="text-base">{group.icon}</span>}
        <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
      </div>
      <div className="space-y-1">
        {group.shortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2',
              'hover:bg-muted/50 transition-colors'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {shortcut.label}
              </p>
              {shortcut.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {shortcut.description}
                </p>
              )}
            </div>
            <ShortcutHint
              keys={{
                key: shortcut.key,
                modifiers: shortcut.modifiers,
              }}
              size="md"
              variant="outline"
              className="ml-4 flex-shrink-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShortcutDialog;
