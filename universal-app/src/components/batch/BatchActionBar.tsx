'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Download,
  CheckCircle2,
  Archive,
  XCircle,
  Tag,
  Move,
  MoreHorizontal,
  Loader2,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  BatchActionBarProps,
  BatchActionConfig,
  BatchProgress,
} from '@/lib/batch/types';
import { useBatchStore, selectCanUndo, selectExecuteUndo } from '@/lib/batch/store';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// ============================================================================
// Icon Map
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trash2,
  Download,
  CheckCircle2,
  Archive,
  XCircle,
  Tag,
  Move,
};

// ============================================================================
// Component
// ============================================================================

/**
 * Floating action bar that appears when items are selected.
 * Shows selection count and available batch actions.
 * 
 * @example
 * ```tsx
 * <BatchActionBar
 *   selectedCount={5}
 *   actions={[
 *     { id: 'delete', label: 'Delete', icon: 'Trash2', variant: 'destructive', handler: async (ids) => ... },
 *     { id: 'export', label: 'Export', icon: 'Download', handler: async (ids) => ... },
 *   ]}
 *   onAction={(actionId) => handleAction(actionId)}
 *   onCancel={() => deselectAll()}
 * />
 * ```
 */
export function BatchActionBar({
  selectedCount,
  actions,
  onAction,
  onCancel,
  progress,
  className,
  position = 'bottom',
  animate = true,
}: BatchActionBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  
  const canUndo = useBatchStore(selectCanUndo);
  const executeUndo = useBatchStore(selectExecuteUndo);

  const shouldAnimate = animate && !prefersReducedMotion;

  // Split actions into primary (first 3) and overflow
  const primaryActions = actions.slice(0, 3);
  const overflowActions = actions.slice(3);

  const handleActionClick = useCallback(
    (action: BatchActionConfig) => {
      if (action.requiresConfirmation) {
        setConfirmingAction(action.id as string);
      } else {
        onAction(action.id as string);
      }
    },
    [onAction]
  );

  const handleConfirm = useCallback(
    (actionId: string) => {
      setConfirmingAction(null);
      onAction(actionId);
    },
    [onAction]
  );

  const handleCancelConfirm = useCallback(() => {
    setConfirmingAction(null);
  }, []);

  const handleUndo = useCallback(async () => {
    try {
      await executeUndo();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  }, [executeUndo]);

  const getVariantClasses = (variant?: BatchActionConfig['variant']) => {
    switch (variant) {
      case 'destructive':
        return 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30';
      case 'warning':
        return 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30';
      case 'success':
        return 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30';
      default:
        return 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';
    }
  };

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = ICON_MAP[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  const confirmingActionConfig = actions.find((a) => a.id === confirmingAction);

  const barContent = (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'bg-white/95 dark:bg-slate-900/95',
        'backdrop-blur-md',
        'border border-slate-200 dark:border-slate-700',
        'rounded-xl shadow-lg',
        'min-w-[320px] max-w-[600px]',
        className
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-700">
        <span className="text-sm font-medium text-[var(--primary)]">
          {selectedCount}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          selected
        </span>
      </div>

      {/* Progress indicator */}
      {progress && progress.status === 'processing' && (
        <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
          <div className="w-24">
            <ProgressBar value={progress.percentage} height="8px" />
          </div>
          <span className="text-xs text-slate-500">
            {progress.processedItems}/{progress.totalItems}
          </span>
        </div>
      )}

      {/* Confirmation dialog inline */}
      {confirmingAction && confirmingActionConfig && (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
            {confirmingActionConfig.confirmationMessage || 'Are you sure?'}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelConfirm}
              className="h-7 px-2"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={confirmingActionConfig.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => handleConfirm(confirmingAction)}
              className="h-7 px-3"
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!confirmingAction && (
        <>
          <div className="flex items-center gap-1 flex-1">
            {primaryActions.map((action) => {
              const isProcessing = progress?.status === 'processing';
              return (
                <Button
                  key={action.id as string}
                  size="sm"
                  variant="ghost"
                  disabled={isProcessing}
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    'h-8 px-3 gap-1.5',
                    getVariantClasses(action.variant)
                  )}
                >
                  {renderIcon(action.icon, 'h-4 w-4')}
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}

            {/* Overflow menu */}
            {overflowActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {overflowActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id as string}
                      onClick={() => handleActionClick(action)}
                      className={cn(
                        'gap-2',
                        getVariantClasses(action.variant)
                      )}
                    >
                      {renderIcon(action.icon, 'h-4 w-4')}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Undo button */}
            {canUndo && (
              <>
                <DropdownMenuSeparator className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUndo}
                  className="h-8 px-2 gap-1.5 text-slate-500"
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="text-sm">Undo</span>
                </Button>
              </>
            )}
          </div>

          {/* Cancel button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

  // Position classes
  const positionClasses = position === 'top'
    ? 'top-4 left-1/2 -translate-x-1/2'
    : 'bottom-6 left-1/2 -translate-x-1/2';

  if (!shouldAnimate) {
    return selectedCount > 0 ? (
      <div className={cn('fixed z-50', positionClasses)}>
        {barContent}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          className={cn('fixed z-50', positionClasses)}
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        >
          {barContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BatchActionBar;
