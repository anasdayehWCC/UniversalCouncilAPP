'use client';

/**
 * ExportDialog Component
 * 
 * Modal dialog for exporting meeting minutes to various formats.
 * Includes format selection, options configuration, preview, and download.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, FileType2, FileTerminal, FileCode,
  Download, X, Settings2, Eye, Check,
  AlertCircle, Clock, Users, FileWarning, Calendar, List
} from 'lucide-react';
import { Button } from '../ui/button';
import { ExportProgress } from './ExportProgress';
import { ExportPreview } from './ExportPreview';
import { useExport, estimateExportSize } from '../../hooks/useExport';
import type { ExportFormat, ExportOptions, ExportTemplate } from '../../lib/export/types';
import { DEFAULT_EXPORT_OPTIONS, EXPORT_FORMAT_LABELS } from '../../lib/export/types';
import { listTemplates, getTemplate } from '../../lib/export/templates';
import type { Minute } from '../../lib/minutes/types';

// ============================================================================
// Types
// ============================================================================

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  minute: Minute;
  tenantId?: string;
  domain?: string;
  defaultFormat?: ExportFormat;
  defaultTemplate?: string;
}

// ============================================================================
// Constants
// ============================================================================

const FORMAT_ICONS: Record<ExportFormat, React.ComponentType<{ className?: string }>> = {
  docx: FileText,
  pdf: FileType2,
  txt: FileTerminal,
  html: FileCode,
};

const SUPPORTED_FORMATS: ExportFormat[] = ['docx', 'pdf', 'txt', 'html'];

// ============================================================================
// Component
// ============================================================================

export function ExportDialog({
  isOpen,
  onClose,
  minute,
  tenantId,
  domain,
  defaultFormat = 'docx',
  defaultTemplate,
}: ExportDialogProps) {
  // State
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplate || 'generic');
  const [showOptions, setShowOptions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Get template
  const selectedTemplate = useMemo(() => getTemplate(selectedTemplateId), [selectedTemplateId]);
  const availableTemplates = useMemo(() => listTemplates(), []);

  // Export hook
  const {
    progress,
    isExporting,
    result,
    error,
    exportMinute,
    generatePreview,
    downloadResult,
    reset,
  } = useExport({
    tenantId,
    domain,
    template: selectedTemplate,
  });

  // Handlers
  const handleFormatChange = useCallback((format: ExportFormat) => {
    setSelectedFormat(format);
    reset();
  }, [reset]);

  const handleOptionChange = useCallback((key: keyof ExportOptions, value: boolean | string[]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    await exportMinute(minute, selectedFormat, options);
  }, [exportMinute, minute, selectedFormat, options]);

  const handleDownload = useCallback(() => {
    if (result?.success) {
      downloadResult();
    }
  }, [result, downloadResult]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Estimated file size
  const estimatedSize = useMemo(() => 
    estimateExportSize(minute, selectedFormat),
    [minute, selectedFormat]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Export Minutes</h2>
              <p className="text-sm text-muted-foreground truncate max-w-md">{minute.title}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex">
            {/* Left Panel - Options */}
            <div className="flex-1 p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SUPPORTED_FORMATS.map(format => {
                    const Icon = FORMAT_ICONS[format];
                    const info = EXPORT_FORMAT_LABELS[format];
                    const isSelected = selectedFormat === format;
                    
                    return (
                      <button
                        key={format}
                        onClick={() => handleFormatChange(format)}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {info.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{info.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[var(--primary)] ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  {availableTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Options Toggle */}
              <div>
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                >
                  <Settings2 className="w-4 h-4" />
                  Export Options
                  <motion.span
                    animate={{ rotate: showOptions ? 180 : 0 }}
                    className="text-muted-foreground"
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 mt-4 p-4 bg-muted rounded-lg">
                        <OptionCheckbox
                          label="Include timestamps"
                          icon={Clock}
                          checked={options.includeTimestamps}
                          onChange={v => handleOptionChange('includeTimestamps', v)}
                        />
                        <OptionCheckbox
                          label="Include evidence"
                          icon={FileText}
                          checked={options.includeEvidence}
                          onChange={v => handleOptionChange('includeEvidence', v)}
                        />
                        <OptionCheckbox
                          label="Include speakers"
                          icon={Users}
                          checked={options.includeSpeakers}
                          onChange={v => handleOptionChange('includeSpeakers', v)}
                        />
                        <OptionCheckbox
                          label="Include metadata"
                          icon={List}
                          checked={options.includeMetadata}
                          onChange={v => handleOptionChange('includeMetadata', v)}
                        />
                        <OptionCheckbox
                          label="Include attendees"
                          icon={Users}
                          checked={options.includeAttendees}
                          onChange={v => handleOptionChange('includeAttendees', v)}
                        />
                        <OptionCheckbox
                          label="Include action items"
                          icon={Calendar}
                          checked={options.includeActionItems}
                          onChange={v => handleOptionChange('includeActionItems', v)}
                        />
                        <OptionCheckbox
                          label="Table of contents"
                          icon={List}
                          checked={options.includeTableOfContents}
                          onChange={v => handleOptionChange('includeTableOfContents', v)}
                        />
                        <OptionCheckbox
                          label="Page numbers"
                          icon={FileText}
                          checked={options.includePageNumbers}
                          onChange={v => handleOptionChange('includePageNumbers', v)}
                        />
                        <OptionCheckbox
                          label="Council branding"
                          icon={FileWarning}
                          checked={options.includeBranding}
                          onChange={v => handleOptionChange('includeBranding', v)}
                        />
                        <OptionCheckbox
                          label="Draft watermark"
                          icon={AlertCircle}
                          checked={options.showDraftWatermark}
                          onChange={v => handleOptionChange('showDraftWatermark', v)}
                          disabled={minute.status === 'approved' || minute.status === 'published'}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Preview Toggle */}
              <div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                  <motion.span
                    animate={{ rotate: showPreview ? 180 : 0 }}
                    className="text-muted-foreground"
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4">
                        <ExportPreview
                          minute={minute}
                          format={selectedFormat}
                          options={options}
                          generatePreview={generatePreview}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress */}
              {progress && (
                <ExportProgress
                  progress={progress}
                  format={selectedFormat}
                />
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Export failed</span>
                  </div>
                  <p className="text-sm text-destructive mt-1">{error.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted">
            <div className="text-sm text-muted-foreground">
              Estimated size: <span className="font-medium">{estimatedSize}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {result?.success ? (
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download {selectedFormat.toUpperCase()}
                </Button>
              ) : (
                <Button onClick={handleExport} disabled={isExporting} className="gap-2">
                  {isExporting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Option Checkbox Component
// ============================================================================

interface OptionCheckboxProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function OptionCheckbox({ label, icon: Icon, checked, onChange, disabled }: OptionCheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
      />
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

// ============================================================================
// Export Button Component (for use outside dialog)
// ============================================================================

interface ExportButtonProps {
  minute: Minute;
  tenantId?: string;
  domain?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ExportButton({
  minute,
  tenantId,
  domain,
  variant = 'default',
  size = 'default',
  className = '',
}: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        className={`gap-2 ${className}`}
      >
        <Download className="w-4 h-4" />
        Export
      </Button>
      
      <ExportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        minute={minute}
        tenantId={tenantId}
        domain={domain}
      />
    </>
  );
}

export default ExportDialog;
