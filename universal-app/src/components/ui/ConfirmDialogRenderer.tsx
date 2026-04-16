'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface ConfirmDialogRendererProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialogRenderer
 *
 * Stateless render companion for useConfirmDialog. Render this once in the
 * component that calls useConfirmDialog and wire the returned state + handlers.
 *
 * Example:
 *   const { confirm, confirmDialogState, handleConfirm, handleCancel } = useConfirmDialog();
 *   ...
 *   return (
 *     <>
 *       <ConfirmDialogRenderer
 *         {...confirmDialogState}
 *         onConfirm={handleConfirm}
 *         onCancel={handleCancel}
 *       />
 *       ... rest of component
 *     </>
 *   );
 */
export function ConfirmDialogRenderer({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogRendererProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              variant === 'destructive' &&
                buttonVariants('destructive')
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
