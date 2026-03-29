'use client';

/**
 * ApprovalDialog Component
 * 
 * Confirmation dialog for approving meeting minutes.
 * Allows adding an optional comment with the approval.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment?: string) => void;
  entityId: string;
  title?: string;
  description?: string;
}

// ============================================================================
// Icons
// ============================================================================

const CheckCircleIcon = () => (
  <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export function ApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  entityId,
  title = 'Approve Minutes',
  description = 'Confirm that you have reviewed the meeting minutes and approve them for publication.',
}: ApprovalDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(comment.trim() || undefined);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComment('');
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
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
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
                    <CheckCircleIcon />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-center text-foreground mb-2">
                  {title}
                </h2>

                {/* Description */}
                <p className="text-center text-muted-foreground mb-6">
                  {description}
                </p>

                {/* Comment Input */}
                <div className="mb-6">
                  <label
                    htmlFor="approval-comment"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Comment (optional)
                  </label>
                  <textarea
                    id="approval-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a note for the author..."
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 border border-input rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-success focus:border-transparent',
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
                    className="flex-1 bg-success hover:bg-success/90"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Approving...
                      </span>
                    ) : (
                      'Approve Minutes'
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer Note */}
              <div className="px-6 py-3 bg-success/10 border-t border-success/20">
                <p className="text-xs text-success text-center">
                  This action will notify the author and make the minutes ready for publication.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ApprovalDialog;
