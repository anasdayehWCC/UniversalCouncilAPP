'use client';

/**
 * ChangesRequestDialog Component
 * 
 * Dialog for requesting changes or rejecting meeting minutes.
 * Requires feedback/reason to be provided.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ChangesRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (feedback: string) => void;
  isRejection?: boolean;
  title?: string;
  description?: string;
}

// ============================================================================
// Quick Feedback Templates
// ============================================================================

const FEEDBACK_TEMPLATES = [
  { label: 'More detail needed', text: 'Please add more detail about the key discussion points and outcomes.' },
  { label: 'Clarify safeguarding', text: 'Please clarify the safeguarding concerns and actions taken.' },
  { label: 'Missing actions', text: 'Please include the agreed actions and who is responsible for each.' },
  { label: 'Formatting issues', text: 'Please review the formatting and ensure sections are clearly separated.' },
  { label: 'Factual correction', text: 'Please review and correct the factual information in the highlighted section.' },
];

// ============================================================================
// Icons
// ============================================================================

const AlertCircleIcon = () => (
  <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export function ChangesRequestDialog({
  open,
  onOpenChange,
  onConfirm,
  isRejection = false,
  title,
  description,
}: ChangesRequestDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default text based on dialog type
  const dialogTitle = title ?? (isRejection ? 'Reject Minutes' : 'Request Changes');
  const dialogDescription = description ?? (
    isRejection
      ? 'Please provide a reason for rejecting these minutes. The author will be notified.'
      : 'Describe the changes needed. The author will receive this feedback and can resubmit.'
  );

  const handleConfirm = async () => {
    if (!feedback.trim()) {
      setError('Please provide feedback for the author');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(feedback.trim());
      setFeedback('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFeedback('');
    setError(null);
    onOpenChange(false);
  };

  const handleTemplateClick = (text: string) => {
    setFeedback((prev) => {
      if (prev.trim()) {
        return `${prev}\n\n${text}`;
      }
      return text;
    });
    setError(null);
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
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
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
                    {isRejection ? <XCircleIcon /> : <AlertCircleIcon />}
                  </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-center text-slate-900 mb-2">
                  {dialogTitle}
                </h2>

                {/* Description */}
                <p className="text-center text-slate-600 mb-6">
                  {dialogDescription}
                </p>

                {/* Quick Feedback Templates */}
                {!isRejection && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Quick feedback:</p>
                    <div className="flex flex-wrap gap-2">
                      {FEEDBACK_TEMPLATES.map((template) => (
                        <button
                          key={template.label}
                          onClick={() => handleTemplateClick(template.text)}
                          className={cn(
                            'px-2 py-1 text-xs rounded-full border transition-colors',
                            'border-slate-200 text-slate-600',
                            'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                          )}
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Input */}
                <div className="mb-6">
                  <label
                    htmlFor="feedback-input"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    {isRejection ? 'Reason for rejection' : 'Feedback'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-input"
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={
                      isRejection
                        ? 'Explain why these minutes cannot be approved...'
                        : 'Describe the specific changes needed...'
                    }
                    rows={4}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg',
                      'focus:outline-none focus:ring-2 focus:border-transparent',
                      'placeholder:text-slate-400 resize-none',
                      error
                        ? 'border-red-300 focus:ring-red-500'
                        : isRejection
                        ? 'border-slate-200 focus:ring-red-500'
                        : 'border-slate-200 focus:ring-amber-500'
                    )}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                  )}
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
                    variant={isRejection ? 'destructive' : 'default'}
                    className={cn(
                      'flex-1',
                      !isRejection && 'bg-amber-500 hover:bg-amber-600'
                    )}
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {isRejection ? 'Rejecting...' : 'Sending...'}
                      </span>
                    ) : isRejection ? (
                      'Reject Minutes'
                    ) : (
                      'Request Changes'
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer Note */}
              <div
                className={cn(
                  'px-6 py-3 border-t',
                  isRejection ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                )}
              >
                <p
                  className={cn(
                    'text-xs text-center',
                    isRejection ? 'text-red-700' : 'text-amber-700'
                  )}
                >
                  {isRejection
                    ? 'This will reject the minutes. The author will need to start fresh.'
                    : 'The author will receive your feedback and can make edits before resubmitting.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ChangesRequestDialog;
