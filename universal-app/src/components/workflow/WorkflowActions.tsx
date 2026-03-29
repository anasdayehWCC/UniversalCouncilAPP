'use client';

/**
 * WorkflowActions Component
 * 
 * Action buttons for workflow transitions based on current step
 * and user role. Handles all workflow actions with confirmation dialogs.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  type WorkflowStep,
  type WorkflowAction,
  type WorkflowActor,
  WORKFLOW_ACTION_CONFIG,
} from '@/lib/workflow/types';
import { Button } from '@/components/ui/button';
import { ApprovalDialog } from './ApprovalDialog';
import { ChangesRequestDialog } from './ChangesRequestDialog';
import { EscalationDialog } from './EscalationDialog';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface WorkflowActionsProps {
  availableActions: WorkflowAction[];
  currentStep: WorkflowStep;
  actor: WorkflowActor;
  entityId: string;
  onAction: (
    action: WorkflowAction,
    comment?: string,
    metadata?: Record<string, string>
  ) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'compact';
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  Send: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  CheckCircle2: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  MessageSquare: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  ArrowUpCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>
  ),
  RefreshCw: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Undo: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  UserPlus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-4 h-4 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

const getActionIcon = (iconName: string) => {
  const iconMap: Record<string, () => JSX.Element> = {
    Send: Icons.Send,
    CheckCircle2: Icons.CheckCircle2,
    XCircle: Icons.XCircle,
    MessageSquare: Icons.MessageSquare,
    ArrowUpCircle: Icons.ArrowUpCircle,
    RefreshCw: Icons.RefreshCw,
    Undo: Icons.Undo,
    Globe: Icons.Globe,
    UserPlus: Icons.UserPlus,
  };
  const Icon = iconMap[iconName];
  return Icon ? <Icon /> : null;
};

// ============================================================================
// Layout Configurations
// ============================================================================

const layoutClasses = {
  horizontal: 'flex flex-wrap items-center gap-2',
  vertical: 'flex flex-col gap-2',
  compact: 'flex items-center gap-1',
};

// ============================================================================
// Component
// ============================================================================

export function WorkflowActions({
  availableActions,
  currentStep,
  actor,
  entityId,
  onAction,
  isLoading = false,
  className,
  layout = 'horizontal',
}: WorkflowActionsProps) {
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);
  const [processingAction, setProcessingAction] = useState<WorkflowAction | null>(null);

  // Dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);
  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false);

  // Handle action button click
  const handleActionClick = async (action: WorkflowAction) => {
    const config = WORKFLOW_ACTION_CONFIG[action];

    // Actions that require dialogs
    if (action === 'approve') {
      setActiveAction(action);
      setApprovalDialogOpen(true);
      return;
    }

    if (action === 'request_changes') {
      setActiveAction(action);
      setChangesDialogOpen(true);
      return;
    }

    if (action === 'escalate') {
      setActiveAction(action);
      setEscalationDialogOpen(true);
      return;
    }

    if (action === 'reject') {
      // Reject also goes through changes dialog for reason
      setActiveAction(action);
      setChangesDialogOpen(true);
      return;
    }

    // Direct actions (submit, resubmit, withdraw, publish)
    if (config.confirmationRequired) {
      const confirmed = window.confirm(`Are you sure you want to ${config.label.toLowerCase()}?`);
      if (!confirmed) return;
    }

    await executeAction(action);
  };

  // Execute the action
  const executeAction = async (
    action: WorkflowAction,
    comment?: string,
    metadata?: Record<string, string>
  ) => {
    setProcessingAction(action);
    try {
      await onAction(action, comment, metadata);
    } finally {
      setProcessingAction(null);
      setActiveAction(null);
    }
  };

  // Handle dialog confirmations
  const handleApprovalConfirm = async (comment?: string) => {
    setApprovalDialogOpen(false);
    await executeAction('approve', comment);
  };

  const handleChangesConfirm = async (feedback: string) => {
    setChangesDialogOpen(false);
    if (activeAction === 'reject') {
      await executeAction('reject', feedback);
    } else {
      await executeAction('request_changes', feedback);
    }
  };

  const handleEscalationConfirm = async (
    reason: string,
    comment?: string,
    targetId?: string,
    targetName?: string
  ) => {
    setEscalationDialogOpen(false);
    await executeAction('escalate', comment, {
      escalationReason: reason,
      ...(targetId && { escalationTargetId: targetId }),
      ...(targetName && { escalationTargetName: targetName }),
    });
  };

  // Sort actions by priority (primary actions first)
  const sortedActions = [...availableActions].sort((a, b) => {
    const priorities: Record<string, number> = {
      approve: 1,
      submit: 2,
      resubmit: 2,
      request_changes: 3,
      reject: 4,
      escalate: 5,
      withdraw: 6,
      publish: 1,
    };
    return (priorities[a] ?? 99) - (priorities[b] ?? 99);
  });

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(layoutClasses[layout], className)}>
        {sortedActions.map((action) => {
          const config = WORKFLOW_ACTION_CONFIG[action];
          const isProcessing = processingAction === action;
          const isDisabled = isLoading || processingAction !== null;

          return (
            <motion.div
              key={action}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Button
                variant={config.variant}
                size={layout === 'compact' ? 'sm' : 'default'}
                onClick={() => handleActionClick(action)}
                disabled={isDisabled}
                className={cn(
                  'gap-2',
                  layout === 'compact' && 'px-2'
                )}
              >
                {isProcessing ? <Icons.Loader /> : getActionIcon(config.icon)}
                {layout !== 'compact' && <span>{config.label}</span>}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Dialogs */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onConfirm={handleApprovalConfirm}
        entityId={entityId}
      />

      <ChangesRequestDialog
        open={changesDialogOpen}
        onOpenChange={setChangesDialogOpen}
        onConfirm={handleChangesConfirm}
        isRejection={activeAction === 'reject'}
      />

      <EscalationDialog
        open={escalationDialogOpen}
        onOpenChange={setEscalationDialogOpen}
        onConfirm={handleEscalationConfirm}
        currentStep={currentStep}
      />
    </>
  );
}

// ============================================================================
// Simple Action List (for display only)
// ============================================================================

interface WorkflowActionListProps {
  actions: WorkflowAction[];
  className?: string;
}

export function WorkflowActionList({ actions, className }: WorkflowActionListProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {actions.map((action) => {
        const config = WORKFLOW_ACTION_CONFIG[action];
        return (
          <div
            key={action}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {getActionIcon(config.icon)}
            <span>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default WorkflowActions;
