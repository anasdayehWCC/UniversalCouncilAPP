'use client';

/**
 * WorkflowStatus Component
 * 
 * Badge-style component displaying the current workflow status
 * with appropriate styling and optional SLA information.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  type WorkflowStep,
  type WorkflowPriority,
  WORKFLOW_STEP_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/workflow/types';
import { getTimeUntilSlaBreach } from '@/lib/workflow/state-machine';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface WorkflowStatusProps {
  step: WorkflowStep;
  priority?: WorkflowPriority;
  slaDeadline?: string;
  showSla?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  Clock: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  FileEdit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Send: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle2: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const getStepIcon = (iconName: string) => {
  const iconMap: Record<string, () => JSX.Element> = {
    FileEdit: Icons.FileEdit,
    Send: Icons.Send,
    Eye: Icons.Eye,
    AlertCircle: Icons.AlertCircle,
    CheckCircle2: Icons.CheckCircle2,
    Globe: Icons.Globe,
  };
  const Icon = iconMap[iconName] ?? Icons.FileEdit;
  return <Icon />;
};

// ============================================================================
// Size Variants
// ============================================================================

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

// ============================================================================
// Component
// ============================================================================

export function WorkflowStatus({
  step,
  priority,
  slaDeadline,
  showSla = false,
  size = 'md',
  className,
  animate = true,
}: WorkflowStatusProps) {
  const stepConfig = WORKFLOW_STEP_CONFIG[step];
  const slaInfo = slaDeadline ? getTimeUntilSlaBreach(slaDeadline) : null;

  const Badge = animate ? motion.div : 'div';
  const badgeProps = animate
    ? {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Main Status Badge */}
      <Badge
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border',
          sizeClasses[size],
          stepConfig.bgColor,
          stepConfig.color,
          stepConfig.borderColor
        )}
        {...badgeProps}
      >
        {getStepIcon(stepConfig.icon)}
        <span>{stepConfig.label}</span>
      </Badge>

      {/* Priority Badge */}
      {priority && priority !== 'normal' && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            sizeClasses[size],
            PRIORITY_CONFIG[priority].bgColor,
            PRIORITY_CONFIG[priority].color
          )}
        >
          {PRIORITY_CONFIG[priority].label}
        </span>
      )}

      {/* SLA Indicator */}
      {showSla && slaInfo && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            sizeClasses[size],
            slaInfo.breached
              ? 'bg-red-100 text-red-700'
              : slaInfo.remainingMs < 4 * 60 * 60 * 1000 // Less than 4 hours
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          )}
        >
          {slaInfo.breached ? <Icons.AlertTriangle /> : <Icons.Clock />}
          <span>{slaInfo.remainingFormatted}</span>
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Compact Inline Variant
// ============================================================================

interface WorkflowStatusInlineProps {
  step: WorkflowStep;
  className?: string;
}

export function WorkflowStatusInline({ step, className }: WorkflowStatusInlineProps) {
  const stepConfig = WORKFLOW_STEP_CONFIG[step];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        stepConfig.color,
        className
      )}
    >
      {getStepIcon(stepConfig.icon)}
      {stepConfig.label}
    </span>
  );
}

// ============================================================================
// Progress Indicator
// ============================================================================

interface WorkflowProgressProps {
  currentStep: WorkflowStep;
  className?: string;
}

const STEP_ORDER: WorkflowStep[] = ['draft', 'submitted', 'in_review', 'approved', 'published'];

export function WorkflowProgress({ currentStep, className }: WorkflowProgressProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isChangesRequested = currentStep === 'changes_requested';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STEP_ORDER.map((step, index) => {
        const isActive = step === currentStep || (isChangesRequested && step === 'in_review');
        const isComplete = !isChangesRequested && index < currentIndex;
        const isPending = !isActive && !isComplete;
        const config = WORKFLOW_STEP_CONFIG[step];

        return (
          <React.Fragment key={step}>
            {/* Step Dot */}
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-colors',
                isComplete && 'bg-green-500',
                isActive && config.bgColor.replace('bg-', 'bg-'),
                isActive && 'ring-2 ring-offset-2',
                isActive && config.borderColor.replace('border-', 'ring-'),
                isPending && 'bg-slate-200'
              )}
              title={config.label}
            />
            {/* Connector Line */}
            {index < STEP_ORDER.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5',
                  isComplete ? 'bg-green-500' : 'bg-slate-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default WorkflowStatus;
