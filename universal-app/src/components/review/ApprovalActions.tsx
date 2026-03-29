'use client';

/**
 * ApprovalActions Component
 * 
 * Manager approval workflow action buttons with confirmation dialogs,
 * comment inputs, and role-based visibility. Integrates with the
 * workflow state machine and audit trail.
 * 
 * @module components/review/ApprovalActions
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowUpCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflow, type UseWorkflowOptions } from '@/hooks/useWorkflow';
import {
  type WorkflowAction,
  type WorkflowStep,
  WORKFLOW_ACTION_CONFIG,
  WORKFLOW_STEP_CONFIG,
} from '@/lib/workflow';
import { useDemo } from '@/context/DemoContext';
import type { UserRole } from '@/config/domains';

// ============================================================================
// Types
// ============================================================================

export interface ApprovalActionsProps {
  /** Entity ID (minute or transcription ID) */
  entityId: string;
  /** Type of entity being reviewed */
  entityType: 'minute' | 'transcription';
  /** Current workflow step (optional - will be fetched if not provided) */
  currentStep?: WorkflowStep;
  /** Callback when any action is completed */
  onActionComplete?: (action: WorkflowAction, success: boolean) => void;
  /** Optional additional metadata for audit trail */
  metadata?: Record<string, string>;
  /** Visual layout variant */
  variant?: 'default' | 'compact' | 'full';
  /** Additional class names */
  className?: string;
  /** Show status badge */
  showStatus?: boolean;
  /** Disable all actions */
  disabled?: boolean;
}

interface ActionDialogState {
  isOpen: boolean;
  action: WorkflowAction | null;
  requiresComment: boolean;
  requiresConfirmation: boolean;
}

// ============================================================================
// Manager Role Check
// ============================================================================

const MANAGER_ROLES: UserRole[] = ['manager', 'admin'];

function useIsManager(): boolean {
  const { currentUser } = useDemo();
  return MANAGER_ROLES.includes((currentUser?.role ?? 'social_worker') as UserRole);
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ActionButtonProps {
  action: WorkflowAction;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'compact';
}

function ActionButton({
  action,
  onClick,
  disabled,
  loading,
  variant = 'default',
}: ActionButtonProps) {
  const config = WORKFLOW_ACTION_CONFIG[action];
  
  const getIcon = () => {
    switch (action) {
      case 'approve':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'reject':
        return <XCircle className="w-4 h-4" />;
      case 'request_changes':
        return <MessageSquare className="w-4 h-4" />;
      case 'escalate':
        return <ArrowUpCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Button
      variant={config.variant}
      size={variant === 'compact' ? 'sm' : 'default'}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'gap-2',
        action === 'approve' && 'bg-success hover:bg-success/90',
        action === 'reject' && 'bg-destructive hover:bg-destructive/90'
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
      ) : (
        getIcon()
      )}
      {variant !== 'compact' && config.label}
    </Button>
  );
}

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
  step: WorkflowStep;
}

function StatusBadge({ step }: StatusBadgeProps) {
  const config = WORKFLOW_STEP_CONFIG[step];
  
  return (
    <Badge
      variant="outline"
      className={cn(config.bgColor, config.color, config.borderColor)}
    >
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ApprovalActions({
  entityId,
  entityType,
  currentStep: externalStep,
  onActionComplete,
  metadata: externalMetadata,
  variant = 'default',
  className,
  showStatus = true,
  disabled: externalDisabled = false,
}: ApprovalActionsProps) {
  const { currentUser, config: demoConfig } = useDemo();
  const isManager = useIsManager();

  // Workflow hook
  const {
    state,
    currentStep: internalStep,
    isLoading,
    error,
    availableActions,
    canReview,
    isFinal,
    slaInfo,
    executeAction,
    history,
  } = useWorkflow({
    entityId,
    entityType,
    domain: demoConfig?.id ?? 'adults',
  });

  // Use external step if provided, otherwise use internal
  const currentStep = externalStep ?? internalStep;

  // Dialog state for confirmation/comment input
  const [dialogState, setDialogState] = useState<ActionDialogState>({
    isOpen: false,
    action: null,
    requiresComment: false,
    requiresConfirmation: false,
  });
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState<WorkflowAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter actions to manager-only approval actions
  const managerActions = useMemo(() => {
    const approvalActions: WorkflowAction[] = ['approve', 'reject', 'request_changes', 'escalate'];
    return availableActions.filter(action => approvalActions.includes(action));
  }, [availableActions]);

  // Handle action button click
  const handleActionClick = useCallback((action: WorkflowAction) => {
    const config = WORKFLOW_ACTION_CONFIG[action];
    
    if (config.requiresComment || config.confirmationRequired) {
      setDialogState({
        isOpen: true,
        action,
        requiresComment: config.requiresComment,
        requiresConfirmation: config.confirmationRequired,
      });
      setComment('');
      setActionError(null);
    } else {
      // Execute immediately
      handleExecuteAction(action);
    }
  }, []);

  // Execute the workflow action
  const handleExecuteAction = useCallback(
    async (action: WorkflowAction, actionComment?: string) => {
      setActionLoading(action);
      setActionError(null);

      try {
        const result = await executeAction(
          action,
          actionComment || comment,
          {
            ...externalMetadata,
            reviewedBy: currentUser?.id ?? 'unknown',
            reviewedAt: new Date().toISOString(),
          }
        );

        if (result.success) {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          setComment('');
          onActionComplete?.(action, true);
        } else {
          setActionError(result.error ?? 'Action failed');
          onActionComplete?.(action, false);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setActionError(errorMsg);
        onActionComplete?.(action, false);
      } finally {
        setActionLoading(null);
      }
    },
    [executeAction, comment, externalMetadata, currentUser, onActionComplete]
  );

  // Handle dialog confirm
  const handleDialogConfirm = useCallback(() => {
    if (!dialogState.action) return;

    // Validate comment if required
    if (dialogState.requiresComment && !comment.trim()) {
      setActionError('Please provide a comment for this action');
      return;
    }

    handleExecuteAction(dialogState.action, comment);
  }, [dialogState, comment, handleExecuteAction]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setDialogState({
      isOpen: false,
      action: null,
      requiresComment: false,
      requiresConfirmation: false,
    });
    setComment('');
    setActionError(null);
  }, []);

  // Get dialog title and description
  const getDialogContent = useCallback(() => {
    if (!dialogState.action) return { title: '', description: '' };

    const config = WORKFLOW_ACTION_CONFIG[dialogState.action];
    
    switch (dialogState.action) {
      case 'approve':
        return {
          title: 'Approve Minutes',
          description: 'This will mark the minutes as approved and ready for publication. Are you sure you want to proceed?',
        };
      case 'reject':
        return {
          title: 'Reject Submission',
          description: 'Please provide a reason for rejecting this submission. The author will be notified and the item will be returned to draft status.',
        };
      case 'request_changes':
        return {
          title: 'Request Changes',
          description: 'Describe the changes needed. The author will be notified and can make revisions before resubmitting.',
        };
      case 'escalate':
        return {
          title: 'Escalate to Senior Manager',
          description: 'Please explain why this item needs to be escalated. A senior manager will be assigned to review.',
        };
      default:
        return {
          title: config.label,
          description: config.description,
        };
    }
  }, [dialogState.action]);

  // Don't render if not a manager
  if (!isManager) {
    return null;
  }

  // Don't render if in final state
  if (isFinal) {
    return showStatus && currentStep ? (
      <div className={cn('flex items-center gap-2', className)}>
        <StatusBadge step={currentStep} />
        <span className="text-sm text-muted-foreground">Final</span>
      </div>
    ) : null;
  }

  // Don't render if can't review
  if (!canReview) {
    return showStatus && currentStep ? (
      <div className={cn('flex items-center gap-2', className)}>
        <StatusBadge step={currentStep} />
      </div>
    ) : null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const dialogContent = getDialogContent();
  const disabled = externalDisabled || !!actionLoading;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3',
          variant === 'full' && 'flex-wrap',
          className
        )}
      >
        {/* Status Badge */}
        {showStatus && currentStep && (
          <StatusBadge step={currentStep} />
        )}

        {/* SLA Warning */}
        {slaInfo?.breached && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
            <Clock className="w-3 h-3" />
            SLA Breached
          </Badge>
        )}

        {/* Action Buttons */}
        <div className={cn('flex items-center gap-2', variant === 'compact' && 'gap-1')}>
          {managerActions.map((action) => (
            <ActionButton
              key={action}
              action={action}
              onClick={() => handleActionClick(action)}
              disabled={disabled}
              loading={actionLoading === action}
              variant={variant === 'compact' ? 'compact' : 'default'}
            />
          ))}
        </div>

        {/* Error Display */}
        {error && !dialogState.isOpen && (
          <span className="text-sm text-destructive flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </span>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogState.isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogState.action === 'approve' && (
                <CheckCircle2 className="w-5 h-5 text-success" />
              )}
              {dialogState.action === 'reject' && (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {dialogState.action === 'request_changes' && (
                <MessageSquare className="w-5 h-5 text-amber-600" />
              )}
              {dialogState.action === 'escalate' && (
                <ArrowUpCircle className="w-5 h-5 text-violet-600" />
              )}
              {dialogContent.title}
            </DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>

          {/* Comment Input */}
          {(dialogState.requiresComment || dialogState.action === 'approve') && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="comment" className="text-sm font-medium text-foreground">
                  {dialogState.requiresComment ? 'Comment (Required)' : 'Comment (Optional)'}
                </label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    dialogState.action === 'reject'
                      ? 'Please explain the reason for rejection...'
                      : dialogState.action === 'request_changes'
                      ? 'Describe the changes needed...'
                      : 'Add any comments or notes...'
                  }
                  rows={4}
                  className="resize-none"
                  variant={actionError ? 'error' : 'default'}
                />
                {actionError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {actionError}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={dialogState.action === 'reject' ? 'destructive' : 'default'}
              onClick={handleDialogConfirm}
              disabled={!!actionLoading}
              className={cn(
                dialogState.action === 'approve' && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none mr-2" />
              ) : null}
              {dialogState.action && WORKFLOW_ACTION_CONFIG[dialogState.action].label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ApprovalActions };
// ApprovalActionsProps is exported inline
