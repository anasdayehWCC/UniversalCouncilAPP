'use client';

/**
 * Recording Metadata Form
 *
 * Case/subject information form for recording context.
 * Supports offline-first with auto-save.
 *
 * @module app/record/components/RecordingMetadata
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Calendar,
  MapPin,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CaseMetadata } from '@/lib/audio/types';

interface RecordingMetadataProps {
  /** Current metadata values */
  metadata: Partial<CaseMetadata>;
  /** Metadata change callback */
  onChange: (metadata: Partial<CaseMetadata>) => void;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Service domain for template selection */
  serviceDomain?: string;
}

interface FormField {
  id: keyof CaseMetadata;
  label: string;
  icon: React.ElementType;
  type: 'text' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

const VISIT_TYPES = [
  { value: 'statutory_visit', label: 'Statutory Visit' },
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'office_meeting', label: 'Office Meeting' },
  { value: 'multi_agency', label: 'Multi-Agency Meeting' },
  { value: 'review', label: 'Review Meeting' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'other', label: 'Other' },
];

const MEETING_MODES = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online', label: 'Online/Remote' },
];

export function RecordingMetadata({
  metadata,
  onChange,
  disabled = false,
  compact = false,
  serviceDomain,
}: RecordingMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [localMetadata, setLocalMetadata] = useState<Partial<CaseMetadata>>(metadata);

  // Sync local state with props
  useEffect(() => {
    setLocalMetadata(metadata);
  }, [metadata]);

  const handleChange = (field: keyof CaseMetadata, value: string | boolean) => {
    const updated = { ...localMetadata, [field]: value };
    setLocalMetadata(updated);
    onChange(updated);
  };

  const fields: FormField[] = [
    {
      id: 'caseReference',
      label: 'Case Reference',
      icon: FileText,
      type: 'text',
      placeholder: 'e.g., CS-2024-001234',
      required: true,
    },
    {
      id: 'subjectInitials',
      label: 'Subject Initials',
      icon: User,
      type: 'text',
      placeholder: 'e.g., JD',
    },
    {
      id: 'visitType',
      label: 'Visit Type',
      icon: ClipboardList,
      type: 'select',
      options: VISIT_TYPES,
    },
    {
      id: 'meetingMode',
      label: 'Meeting Mode',
      icon: MapPin,
      type: 'select',
      options: MEETING_MODES,
    },
  ];

  const advancedFields: FormField[] = [
    {
      id: 'intendedOutcomes',
      label: 'Intended Outcomes',
      icon: ClipboardList,
      type: 'textarea',
      placeholder: 'What are the goals of this meeting?',
    },
    {
      id: 'riskFlags',
      label: 'Risk Flags',
      icon: AlertTriangle,
      type: 'textarea',
      placeholder: 'Any risk considerations?',
    },
    {
      id: 'notes',
      label: 'Additional Notes',
      icon: MessageSquare,
      type: 'textarea',
      placeholder: 'Any other relevant information...',
    },
  ];

  const renderField = (field: FormField) => {
    const Icon = field.icon;
    const value = localMetadata[field.id] as string || '';

    return (
      <div key={field.id} className="space-y-2">
        <label
          htmlFor={field.id}
          className="flex items-center gap-2 text-sm font-medium text-foreground/80"
        >
          <Icon className="w-4 h-4 text-muted-foreground" />
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>

        {field.type === 'text' && (
          <input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'bg-white/50 dark:bg-white/5',
              'border border-white/30 dark:border-white/10',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        )}

        {field.type === 'date' && (
          <input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'bg-white/50 dark:bg-white/5',
              'border border-white/30 dark:border-white/10',
              'text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        )}

        {field.type === 'select' && field.options && (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl appearance-none',
              'bg-white/50 dark:bg-white/5',
              'border border-white/30 dark:border-white/10',
              'text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <option value="">Select...</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {field.type === 'textarea' && (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl resize-none',
              'bg-white/50 dark:bg-white/5',
              'border border-white/30 dark:border-white/10',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        )}
      </div>
    );
  };

  // Compact view toggle
  if (compact) {
    return (
      <Card
        variant="glass"
        className="p-4 space-y-4"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-medium">Meeting Details</span>
            {localMetadata.caseReference && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                <Check className="w-3 h-3 inline mr-1" />
                {localMetadata.caseReference}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/20 dark:border-white/10">
                {fields.map(renderField)}
              </div>

              {/* Advanced fields toggle */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  More options
                </summary>
                <div className="mt-4 space-y-4">
                  {advancedFields.map(renderField)}
                </div>
              </details>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  // Full view
  return (
    <Card
      variant="glass"
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Meeting Details</h3>
          <p className="text-sm text-muted-foreground">
            Add context for your recording
          </p>
        </div>
      </div>

      {/* Main fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>

      {/* Consent checkbox */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
        <input
          type="checkbox"
          id="consent"
          checked={localMetadata.consentAcknowledged ?? false}
          onChange={(e) => handleChange('consentAcknowledged', e.target.checked)}
          disabled={disabled}
          className="mt-0.5 w-4 h-4 rounded border-warning/50 text-warning focus:ring-warning/50"
        />
        <label htmlFor="consent" className="text-sm text-foreground/80">
          I confirm that all participants have been informed that this meeting will be
          recorded and have given their consent.
        </label>
      </div>

      {/* Advanced fields */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
          Additional Information
        </summary>
        <div className="mt-4 space-y-4">
          {advancedFields.map(renderField)}
        </div>
      </details>
    </Card>
  );
}

export default RecordingMetadata;
