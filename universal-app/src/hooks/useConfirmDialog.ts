'use client';

import { useState, useCallback, useRef } from 'react';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolveRef: ((value: boolean) => void) | null;
}

/**
 * useConfirmDialog
 *
 * Returns a `confirm(options)` function that resolves to a Promise<boolean>.
 * Backed by Radix AlertDialog — focus-trapped, keyboard-dismissible, never
 * auto-dismisses (Apple HIG Cognitive: prefer explicit user action).
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *   const ok = await confirm({ title: 'Delete?', variant: 'destructive' });
 *   if (ok) { ... }
 *
 * Render <ConfirmDialog /> once anywhere in the component tree alongside the
 * hook call site.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: undefined,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    resolveRef: null,
  });

  // Keep resolveRef stable across renders so the dialog close handlers
  // always call the latest promise resolver.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        variant: 'default',
        ...options,
        resolveRef: resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return {
    confirm,
    confirmDialogState: state,
    handleConfirm,
    handleCancel,
  };
}
