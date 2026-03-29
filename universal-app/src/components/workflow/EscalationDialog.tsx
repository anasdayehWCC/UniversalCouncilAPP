'use client';

/**
 * EscalationDialog Component
 * 
 * Dialog for escalating meeting minutes to senior management.
 * Requires selection of reason and optional target manager.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  type WorkflowStep,
  type EscalationReason,
  ESCALATION_REASONS,
} from '@/lib/workflow/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface EscalationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    reason: EscalationReason,
    comment?: string,
    targetId?: string,
    targetName?: string
  ) => void;
  currentStep: WorkflowStep;
  availableManagers?: Array<{ id: string; name: string; role: string }>;
}

// ============================================================================
// Mock Managers (would come from API)
// ============================================================================

const MOCK_SENIOR_MANAGERS = [
  { id: 'sm-1', name: 'David Chen', role: 'Team Manager' },
  { id: 'sm-2', name: 'Rachel Thompson', role: 'Service Lead' },
  { id: 'sm-3', name: 'James Okonkwo', role: 'Practice Manager' },
];

// ============================================================================
// Icons
// ============================================================================

const ArrowUpCircleIcon = () => (
  <svg className="w-12 h-12 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export function EscalationDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStep,
  availableManagers = MOCK_SENIOR_MANAGERS,
}: EscalationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<EscalationReason | null>(null);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError('Please select a reason for escalation');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const manager = availableManagers.find(m => m.id === selectedManager);

    try {
      await onConfirm(
        selectedReason,
        comment.trim() || undefined,
        selectedManager ?? undefined,
        manager?.name
      );
      // Reset state
      setSelectedReason(null);
      setSelectedManager(null);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setSelectedManager(null);
    setComment('');
    setError(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors z-10"
              >
                <XIcon />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  >
                    <ArrowUpCircleIcon />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-center text-foreground mb-2">
                  Escalate for Review
                </h2>

                {/* Description */}
                <p className="text-center text-muted-foreground mb-6">
                  Escalate this to a senior manager for additional guidance or decision.
                </p>

                {/* Reason Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Reason for escalation <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-2">
                    {(Object.entries(ESCALATION_REASONS) as [EscalationReason, string][]).map(
                      ([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedReason(key);
                            if (error) setError(null);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                            selectedReason === key
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-input hover:border-primary/50 hover:bg-muted'
                          )}
                        >
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                              selectedReason === key
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-input'
                            )}
                          >
                            {selectedReason === key && (
                              <CheckIcon />
                            )}
                          </div>
                          <span className="text-sm">{label}</span>
                        </button>
                      )
                    )}
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
                </div>

                {/* Senior Manager Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Escalate to (optional)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {availableManagers.map((manager) => (
                      <button
                        key={manager.id}
                        onClick={() =>
                          setSelectedManager(
                            selectedManager === manager.id ? null : manager.id
                          )
                        }
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                          selectedManager === manager.id
                              ? 'border-primary bg-primary/10'
                              : 'border-input hover:border-primary/50 hover:bg-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            selectedManager === manager.id
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <UserIcon />
                        </div>
                        <div>
                          <p
                            className={cn(
                              'font-medium text-sm',
                              selectedManager === manager.id
                                ? 'text-foreground'
                                : 'text-foreground'
                            )}
                          >
                            {manager.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{manager.role}</p>
                        </div>
                        {selectedManager === manager.id && (
                          <div className="ml-auto">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                              <CheckIcon />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Leave empty to notify all available senior managers
                  </p>
                </div>

                {/* Additional Comments */}
                <div className="mb-6">
                  <label
                    htmlFor="escalation-comment"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Additional context (optional)
                  </label>
                  <textarea
                    id="escalation-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide any additional context that would help with the review..."
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 border border-input rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      'placeholder:text-muted-foreground resize-none'
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={handleConfirm}
                    disabled={isSubmitting || !selectedReason}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Escalating...
                      </span>
                    ) : (
                      'Escalate'
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer Note */}
              <div className="px-6 py-3 bg-violet-50 border-t border-violet-100">
                <p className="text-xs text-violet-700 text-center">
                  The selected manager will be notified and assigned to review this case.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EscalationDialog;
