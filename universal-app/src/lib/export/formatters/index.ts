/**
 * Export Formatters Index
 * 
 * Central registry for all export formatters.
 * Provides factory function to get formatter by format type.
 */

import type { ExportFormat, IExportFormatter } from '../types';
import { docxFormatter } from './docx';
import { pdfFormatter } from './pdf';
import { txtFormatter } from './txt';
import { htmlFormatter } from './html';

/**
 * Map of format to formatter instance
 */
const formatters: Record<ExportFormat, IExportFormatter> = {
  docx: docxFormatter,
  pdf: pdfFormatter,
  txt: txtFormatter,
  html: htmlFormatter,
};

/**
 * Get formatter for a specific format
 */
export function getFormatter(format: ExportFormat): IExportFormatter {
  const formatter = formatters[format];
  if (!formatter) {
    throw new Error(`Unsupported export format: ${format}`);
  }
  return formatter;
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(format: string): format is ExportFormat {
  return format in formatters;
}

/**
 * Get list of supported formats
 */
export function getSupportedFormats(): ExportFormat[] {
  return Object.keys(formatters) as ExportFormat[];
}

// Re-export individual formatters
export { docxFormatter, pdfFormatter, txtFormatter, htmlFormatter };
