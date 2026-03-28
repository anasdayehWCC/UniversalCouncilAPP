'use client';

/**
 * ExportPreview Component
 * 
 * Live preview panel for export output.
 * Supports HTML preview rendering and text preview display.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileType2, FileTerminal, FileCode, RefreshCw, Maximize2, Minimize2, Eye, EyeOff, Download } from 'lucide-react';
import { Button } from '../ui/button';
import type { ExportFormat, ExportOptions } from '../../lib/export/types';
import type { Minute } from '../../lib/minutes/types';

// ============================================================================
// Types
// ============================================================================

interface ExportPreviewProps {
  minute: Minute | null;
  format: ExportFormat;
  options: ExportOptions;
  generatePreview: (minute: Minute, format: ExportFormat, options: Partial<ExportOptions>) => Promise<string>;
  className?: string;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  docx: <FileText className="w-4 h-4" />,
  pdf: <FileType2 className="w-4 h-4" />,
  txt: <FileTerminal className="w-4 h-4" />,
  html: <FileCode className="w-4 h-4" />,
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  docx: 'Word Preview',
  pdf: 'PDF Preview',
  txt: 'Text Preview',
  html: 'HTML Preview',
};

// ============================================================================
// Component
// ============================================================================

export function ExportPreview({
  minute,
  format,
  options,
  generatePreview,
  className = '',
  onFullscreen,
  isFullscreen = false,
}: ExportPreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Generate preview when inputs change
  useEffect(() => {
    if (!minute || !showPreview) return;

    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const content = await generatePreview(minute, format, options);
        setPreview(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce preview generation
    const timeoutId = setTimeout(loadPreview, 300);
    return () => clearTimeout(timeoutId);
  }, [minute, format, options, generatePreview, showPreview]);

  // Render HTML preview in iframe
  useEffect(() => {
    if (format === 'html' && preview && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(preview);
        doc.close();
      }
    }
  }, [preview, format]);

  if (!minute) {
    return (
      <div className={`flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-dashed border-slate-300 ${className}`}>
        <p className="text-slate-400">No minute selected for preview</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {FORMAT_ICONS[format]}
          <span className="text-sm font-medium text-slate-700">{FORMAT_LABELS[format]}</span>
          {isLoading && (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
            className="h-7 w-7"
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          {onFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFullscreen}
              className="h-7 w-7"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <AnimatePresence mode="wait">
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 min-h-[300px] max-h-[600px] overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-slate-500">Generating preview...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            ) : (
              <PreviewContent
                format={format}
                content={preview}
                iframeRef={iframeRef}
                preRef={preRef}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Preview Content Component
// ============================================================================

interface PreviewContentProps {
  format: ExportFormat;
  content: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  preRef: React.RefObject<HTMLPreElement | null>;
}

function PreviewContent({ format, content, iframeRef, preRef }: PreviewContentProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No preview available
      </div>
    );
  }

  // HTML preview uses iframe
  if (format === 'html') {
    return (
      <iframe
        ref={iframeRef}
        className="w-full h-full min-h-[400px] border-0"
        title="Export Preview"
        sandbox="allow-same-origin"
      />
    );
  }

  // Text preview uses pre/code
  if (format === 'txt') {
    return (
      <div className="h-full overflow-auto bg-slate-900 p-4">
        <pre
          ref={preRef}
          className="text-xs font-mono text-slate-100 whitespace-pre-wrap"
        >
          {content}
        </pre>
      </div>
    );
  }

  // DOCX and PDF show a placeholder message
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
      <div className="p-4 bg-slate-100 rounded-full">
        {FORMAT_ICONS[format]}
      </div>
      <div>
        <p className="text-sm text-slate-600 font-medium">
          Preview not available for {format.toUpperCase()} format
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Download the file to view the full document
        </p>
      </div>
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
        <Download className="w-4 h-4" />
        <span className="text-sm">Click Export to generate and download</span>
      </div>
    </div>
  );
}

// ============================================================================
// Fullscreen Preview Modal
// ============================================================================

interface FullscreenPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  minute: Minute | null;
  format: ExportFormat;
  options: ExportOptions;
  generatePreview: (minute: Minute, format: ExportFormat, options: Partial<ExportOptions>) => Promise<string>;
}

export function FullscreenPreview({
  isOpen,
  onClose,
  minute,
  format,
  options,
  generatePreview,
}: FullscreenPreviewProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-5xl h-[90vh] bg-white rounded-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <ExportPreview
          minute={minute}
          format={format}
          options={options}
          generatePreview={generatePreview}
          className="h-full"
          onFullscreen={onClose}
          isFullscreen
        />
      </motion.div>
    </motion.div>
  );
}

export default ExportPreview;
