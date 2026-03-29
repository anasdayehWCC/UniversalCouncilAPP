'use client';

/**
 * ExportProgress Component
 * 
 * Displays export generation progress with stages and visual feedback.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileType2, Loader2, Check, X, FileTerminal, FileCode } from 'lucide-react';
import type { ExportProgress as ExportProgressType, ExportFormat } from '../../lib/export/types';

// ============================================================================
// Types
// ============================================================================

interface ExportProgressProps {
  progress: ExportProgressType | null;
  format: ExportFormat;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  docx: <FileText className="w-5 h-5" />,
  pdf: <FileType2 className="w-5 h-5" />,
  txt: <FileTerminal className="w-5 h-5" />,
  html: <FileCode className="w-5 h-5" />,
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  docx: 'Word Document',
  pdf: 'PDF Document',
  txt: 'Plain Text',
  html: 'HTML Document',
};

const STAGE_LABELS: Record<ExportProgressType['stage'], string> = {
  preparing: 'Preparing export...',
  processing_sections: 'Processing sections...',
  generating_document: 'Generating document...',
  applying_branding: 'Applying branding...',
  finalizing: 'Finalizing...',
  completed: 'Export complete!',
  error: 'Export failed',
};

// ============================================================================
// Component
// ============================================================================

export function ExportProgress({ progress, format, className = '' }: ExportProgressProps) {
  if (!progress) return null;

  const isComplete = progress.stage === 'completed';
  const isError = progress.stage === 'error';
  const isProcessing = !isComplete && !isError;

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          isComplete ? 'bg-success/10 text-success' :
          isError ? 'bg-destructive/10 text-destructive' :
          'bg-primary/10 text-primary'
        }`}>
          {isComplete ? <Check className="w-5 h-5" /> :
           isError ? <X className="w-5 h-5" /> :
           FORMAT_ICONS[format]}
        </div>
        <div>
          <h3 className="font-medium text-foreground">
            {isComplete ? 'Export Complete' :
             isError ? 'Export Failed' :
             `Generating ${FORMAT_LABELS[format]}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {progress.message || STAGE_LABELS[progress.stage]}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            isComplete ? 'bg-success' :
            isError ? 'bg-destructive' :
            'bg-primary'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {isProcessing && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>

      {/* Progress Percentage */}
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-muted-foreground">{progress.progress}%</span>
        {isProcessing && (
          <span className="flex items-center gap-1 text-primary">
            <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" />
            Processing...
          </span>
        )}
      </div>

      {/* Current Section */}
      <AnimatePresence mode="wait">
        {progress.currentSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t"
          >
            <p className="text-sm text-muted-foreground">
              Current section: <span className="font-medium text-foreground">{progress.currentSection}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-destructive/20"
          >
            <p className="text-sm text-destructive">
              {progress.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactProgressProps {
  progress: number;
  message?: string;
  isComplete?: boolean;
  isError?: boolean;
}

export function CompactProgress({ progress, message, isComplete, isError }: CompactProgressProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              isComplete ? 'bg-success' :
              isError ? 'bg-destructive' :
              'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className={`text-xs font-medium ${
        isComplete ? 'text-success' :
        isError ? 'text-destructive' :
        'text-muted-foreground'
      }`}>
        {message || `${progress}%`}
      </span>
    </div>
  );
}

export default ExportProgress;
