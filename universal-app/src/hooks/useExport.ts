'use client';

/**
 * useExport Hook
 * 
 * React hook for exporting meeting minutes to various formats.
 * Handles export generation, progress tracking, and error handling.
 */

import { useState, useCallback } from 'react';
import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportProgress,
  ExportTemplate,
  ExportRequest,
} from '../lib/export/types';
import { DEFAULT_EXPORT_OPTIONS } from '../lib/export/types';
import { getFormatter } from '../lib/export/formatters';
import { getTemplateForTenant, genericTemplate } from '../lib/export/templates';
import type { Minute } from '../lib/minutes/types';

// ============================================================================
// Types
// ============================================================================

export interface UseExportOptions {
  /** Override tenant ID for template selection */
  tenantId?: string;
  /** Override service domain for template selection */
  domain?: string;
  /** Custom template to use */
  template?: ExportTemplate;
  /** Callback when export starts */
  onStart?: () => void;
  /** Callback when export completes */
  onComplete?: (result: ExportResult) => void;
  /** Callback when export fails */
  onError?: (error: Error) => void;
}

export interface UseExportReturn {
  /** Current export progress */
  progress: ExportProgress | null;
  /** Whether an export is in progress */
  isExporting: boolean;
  /** Last export result */
  result: ExportResult | null;
  /** Last export error */
  error: Error | null;
  /** Export a minute to a specific format */
  exportMinute: (minute: Minute, format: ExportFormat, options?: Partial<ExportOptions>) => Promise<ExportResult>;
  /** Generate preview for a format */
  generatePreview: (minute: Minute, format: ExportFormat, options?: Partial<ExportOptions>) => Promise<string>;
  /** Download the last exported file */
  downloadResult: () => void;
  /** Reset state */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useExport(hookOptions: UseExportOptions = {}): UseExportReturn {
  const { tenantId, domain, template: customTemplate, onStart, onComplete, onError } = hookOptions;

  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get the template to use for export
   */
  const getExportTemplate = useCallback((): ExportTemplate => {
    if (customTemplate) return customTemplate;
    if (tenantId) return getTemplateForTenant(tenantId, domain);
    return genericTemplate;
  }, [customTemplate, tenantId, domain]);

  /**
   * Update progress state
   */
  const updateProgress = useCallback((stage: ExportProgress['stage'], progressValue: number, message: string, currentSection?: string) => {
    setProgress({
      stage,
      progress: progressValue,
      message,
      currentSection,
    });
  }, []);

  /**
   * Export a minute to the specified format
   */
  const exportMinute = useCallback(async (
    minute: Minute,
    format: ExportFormat,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    setResult(null);
    onStart?.();

    try {
      // Merge options with defaults
      const fullOptions: ExportOptions = {
        ...DEFAULT_EXPORT_OPTIONS,
        ...options,
        // If minute is a draft, show watermark by default
        showDraftWatermark: options.showDraftWatermark ?? (minute.status === 'draft' || minute.status === 'pending_review'),
      };

      // Get template
      updateProgress('preparing', 10, 'Preparing export...');
      const template = getExportTemplate();

      // Get formatter
      updateProgress('processing_sections', 30, 'Processing sections...');
      const formatter = getFormatter(format);

      // Build request
      const request: ExportRequest = {
        minute,
        format,
        options: fullOptions,
        template,
      };

      // Generate document
      updateProgress('generating_document', 50, 'Generating document...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI to update

      updateProgress('applying_branding', 70, 'Applying branding...');
      const exportResult = await formatter.generate(request);

      updateProgress('finalizing', 90, 'Finalizing...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI to update

      if (exportResult.success) {
        updateProgress('completed', 100, 'Export complete!');
        setResult(exportResult);
        onComplete?.(exportResult);
      } else {
        updateProgress('error', 0, exportResult.error || 'Export failed');
        const exportError = new Error(exportResult.error || 'Export failed');
        setError(exportError);
        onError?.(exportError);
      }

      setIsExporting(false);
      return exportResult;
    } catch (err) {
      const exportError = err instanceof Error ? err : new Error('Unknown export error');
      updateProgress('error', 0, exportError.message);
      setError(exportError);
      setIsExporting(false);
      onError?.(exportError);
      
      return {
        success: false,
        filename: 'error',
        mimeType: 'application/octet-stream',
        generatedAt: new Date().toISOString(),
        error: exportError.message,
      };
    }
  }, [getExportTemplate, updateProgress, onStart, onComplete, onError]);

  /**
   * Generate a preview for the specified format
   */
  const generatePreview = useCallback(async (
    minute: Minute,
    format: ExportFormat,
    options: Partial<ExportOptions> = {}
  ): Promise<string> => {
    const fullOptions: ExportOptions = {
      ...DEFAULT_EXPORT_OPTIONS,
      ...options,
    };

    const template = getExportTemplate();
    const formatter = getFormatter(format);

    if (formatter.generatePreview) {
      const request: ExportRequest = {
        minute,
        format,
        options: fullOptions,
        template,
      };
      return await formatter.generatePreview(request);
    }

    // For formats without preview support, generate and convert to data URL
    const request: ExportRequest = {
      minute,
      format,
      options: fullOptions,
      template,
    };
    const result = await formatter.generate(request);
    
    if (result.success && result.blob) {
      if (format === 'html' || format === 'txt') {
        return await result.blob.text();
      }
      // For binary formats, return a message
      return `Preview not available for ${format.toUpperCase()} format. Click Download to view the file.`;
    }

    return 'Preview not available';
  }, [getExportTemplate]);

  /**
   * Download the last exported result
   */
  const downloadResult = useCallback(() => {
    if (!result?.success || !result.blob) return;

    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setProgress(null);
    setIsExporting(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    progress,
    isExporting,
    result,
    error,
    exportMinute,
    generatePreview,
    downloadResult,
    reset,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Download a file from a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Estimate export file size (rough estimate)
 */
export function estimateExportSize(minute: Minute, format: ExportFormat): string {
  const contentLength = minute.sections.reduce((acc, s) => acc + s.content.length, 0);
  const baseSize = contentLength + (minute.actionItems.length * 100);
  
  let multiplier = 1;
  switch (format) {
    case 'docx':
      multiplier = 3;
      break;
    case 'pdf':
      multiplier = 2.5;
      break;
    case 'html':
      multiplier = 2;
      break;
    case 'txt':
      multiplier = 1;
      break;
  }

  const estimatedBytes = baseSize * multiplier;
  
  if (estimatedBytes < 1024) {
    return `~${estimatedBytes} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    return `~${Math.round(estimatedBytes / 1024)} KB`;
  } else {
    return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export default useExport;
