/**
 * Document Export Types
 * 
 * Type definitions for exporting meeting minutes to various formats
 * including Word, PDF, plain text, and HTML with council branding support.
 * 
 * @module lib/export/types
 */

import type { Minute, MinuteSection, ActionItem, MinuteAttendee } from '../minutes/types';

// ============================================================================
// Export Formats
// ============================================================================

/**
 * Supported export formats
 */
export type ExportFormat = 'docx' | 'pdf' | 'txt' | 'html';

/**
 * Format-specific MIME types
 */
export const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  txt: 'text/plain',
  html: 'text/html',
};

/**
 * Format labels for UI
 */
export const EXPORT_FORMAT_LABELS: Record<ExportFormat, { label: string; description: string; icon: string }> = {
  docx: {
    label: 'Microsoft Word',
    description: 'Editable Word document with council branding',
    icon: 'FileText',
  },
  pdf: {
    label: 'PDF Document',
    description: 'Print-ready PDF with council branding',
    icon: 'FileType2',
  },
  txt: {
    label: 'Plain Text',
    description: 'Simple text format for compatibility',
    icon: 'FileTerminal',
  },
  html: {
    label: 'HTML',
    description: 'Web-ready HTML with embedded styles',
    icon: 'FileCode',
  },
};

// ============================================================================
// Export Options
// ============================================================================

/**
 * Options for customizing export output
 */
export interface ExportOptions {
  /** Include timestamps for each section */
  includeTimestamps: boolean;
  /** Include evidence citations from transcript */
  includeEvidence: boolean;
  /** Include speaker names/roles */
  includeSpeakers: boolean;
  /** Include document metadata (case ID, date, etc.) */
  includeMetadata: boolean;
  /** Include attendee list */
  includeAttendees: boolean;
  /** Include action items table */
  includeActionItems: boolean;
  /** Include table of contents (Word/PDF only) */
  includeTableOfContents: boolean;
  /** Include page numbers (Word/PDF only) */
  includePageNumbers: boolean;
  /** Include header/footer with branding */
  includeBranding: boolean;
  /** Sections to include (empty = all) */
  includedSections: string[];
  /** Custom document title (overrides minute title) */
  customTitle?: string;
  /** Custom footer text */
  customFooter?: string;
  /** Draft watermark for non-approved minutes */
  showDraftWatermark: boolean;
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeTimestamps: true,
  includeEvidence: false,
  includeSpeakers: true,
  includeMetadata: true,
  includeAttendees: true,
  includeActionItems: true,
  includeTableOfContents: true,
  includePageNumbers: true,
  includeBranding: true,
  includedSections: [],
  showDraftWatermark: true,
};

// ============================================================================
// Export Templates
// ============================================================================

/**
 * Template style configuration
 */
export interface TemplateStyleConfig {
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Secondary/accent color (hex) */
  accentColor: string;
  /** Heading font family */
  headingFont: string;
  /** Body text font family */
  bodyFont: string;
  /** Font sizes in points */
  fontSize: {
    title: number;
    heading1: number;
    heading2: number;
    heading3: number;
    body: number;
    caption: number;
  };
  /** Line spacing */
  lineSpacing: number;
  /** Paragraph spacing in points */
  paragraphSpacing: number;
  /** Page margins in inches */
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Export template with branding
 */
export interface ExportTemplate {
  /** Template identifier */
  id: string;
  /** Template display name */
  name: string;
  /** Organization/council name */
  organization: string;
  /** Short organization name */
  organizationShort: string;
  /** Logo URL (base64 or external) */
  logoUrl?: string;
  /** Logo for PDF (base64 data URL preferred) */
  logoBase64?: string;
  /** Logo dimensions */
  logoDimensions?: {
    width: number;
    height: number;
  };
  /** Style configuration */
  styles: TemplateStyleConfig;
  /** Footer text template (supports {{date}}, {{page}}, etc.) */
  footerTemplate: string;
  /** Header text template */
  headerTemplate: string;
  /** Confidentiality notice */
  confidentialityNotice?: string;
  /** GDPR/data protection notice */
  dataProtectionNotice?: string;
  /** Document classification level */
  classification?: 'official' | 'official-sensitive' | 'confidential';
}

// ============================================================================
// Export Result
// ============================================================================

/**
 * Export operation result
 */
export interface ExportResult {
  /** Successfully generated */
  success: boolean;
  /** Generated file as Blob */
  blob?: Blob;
  /** Suggested filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size?: number;
  /** Generation timestamp */
  generatedAt: string;
  /** Error message if failed */
  error?: string;
  /** Warning messages */
  warnings?: string[];
}

// ============================================================================
// Export Progress
// ============================================================================

/**
 * Export progress stages
 */
export type ExportStage = 
  | 'preparing'
  | 'processing_sections'
  | 'generating_document'
  | 'applying_branding'
  | 'finalizing'
  | 'completed'
  | 'error';

/**
 * Export progress state
 */
export interface ExportProgress {
  stage: ExportStage;
  progress: number; // 0-100
  message: string;
  currentSection?: string;
}

// ============================================================================
// Export Request
// ============================================================================

/**
 * Complete export request
 */
export interface ExportRequest {
  /** Minute document to export */
  minute: Minute;
  /** Export format */
  format: ExportFormat;
  /** Export options */
  options: ExportOptions;
  /** Template to use */
  template: ExportTemplate;
}

// ============================================================================
// Formatter Interface
// ============================================================================

/**
 * Interface for format-specific exporters
 */
export interface IExportFormatter {
  /** Format this formatter handles */
  readonly format: ExportFormat;
  
  /**
   * Generate the export document
   */
  generate(request: ExportRequest): Promise<ExportResult>;
  
  /**
   * Generate preview (for UI display)
   */
  generatePreview?(request: ExportRequest): Promise<string>;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Processed section for export
 */
export interface ProcessedSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: string;
  evidence?: Array<{
    text: string;
    timestamp: string;
    speaker?: string;
  }>;
}

/**
 * Document structure for export
 */
export interface ExportDocumentStructure {
  title: string;
  subtitle?: string;
  date: string;
  duration: string;
  metadata: Record<string, string>;
  attendees: MinuteAttendee[];
  sections: ProcessedSection[];
  actionItems: ActionItem[];
  footer: string;
  classification?: string;
}
