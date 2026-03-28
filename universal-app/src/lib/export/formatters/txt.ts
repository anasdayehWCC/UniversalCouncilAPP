/**
 * Plain Text Formatter
 * 
 * Exports meeting minutes as plain text files.
 * Optimized for compatibility and accessibility.
 */

import type {
  ExportRequest,
  ExportResult,
  IExportFormatter,
  ExportFormat,
} from '../types';

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Wrap text to specified width
 */
function wrapText(text: string, width: number = 80): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

/**
 * Create a text separator line
 */
function separator(char: string = '=', width: number = 80): string {
  return char.repeat(width);
}

/**
 * Plain text export formatter
 */
export class TxtFormatter implements IExportFormatter {
  readonly format: ExportFormat = 'txt';

  async generate(request: ExportRequest): Promise<ExportResult> {
    const { minute, options, template } = request;
    const lines: string[] = [];
    const width = 80;

    try {
      // Header
      lines.push(separator('=', width));
      lines.push('');
      lines.push(minute.title.toUpperCase());
      lines.push('');
      lines.push(separator('=', width));
      lines.push('');

      // Organization header
      if (options.includeBranding) {
        lines.push(template.organization);
        lines.push('');
      }

      // Metadata
      if (options.includeMetadata) {
        lines.push(`Date: ${formatDate(minute.date)}`);
        lines.push(`Duration: ${minute.duration}`);
        if (minute.metadata.caseId) {
          lines.push(`Case Reference: ${minute.metadata.caseId}`);
        }
        if (minute.metadata.domain) {
          lines.push(`Service Area: ${minute.metadata.domain}`);
        }
        if (minute.status !== 'approved' && minute.status !== 'published') {
          lines.push(`Status: ${minute.status.toUpperCase()} - DRAFT`);
        }
        lines.push('');
        lines.push(separator('-', width));
        lines.push('');
      }

      // Attendees
      if (options.includeAttendees && minute.attendees.length > 0) {
        lines.push('ATTENDEES');
        lines.push(separator('-', 40));
        for (const attendee of minute.attendees) {
          const presence = attendee.present ? '' : ' (Absent)';
          lines.push(`  * ${attendee.name} - ${attendee.role}${presence}`);
        }
        lines.push('');
      }

      // Table of Contents
      if (options.includeTableOfContents) {
        lines.push('CONTENTS');
        lines.push(separator('-', 40));
        let sectionNum = 1;
        for (const section of minute.sections) {
          if (
            options.includedSections.length === 0 ||
            options.includedSections.includes(section.id)
          ) {
            lines.push(`  ${sectionNum}. ${section.title}`);
            sectionNum++;
          }
        }
        if (options.includeActionItems && minute.actionItems.length > 0) {
          lines.push(`  ${sectionNum}. Action Items`);
        }
        lines.push('');
        lines.push(separator('=', width));
        lines.push('');
      }

      // Sections
      let sectionNum = 1;
      for (const section of minute.sections) {
        if (
          options.includedSections.length > 0 &&
          !options.includedSections.includes(section.id)
        ) {
          continue;
        }

        lines.push(`${sectionNum}. ${section.title.toUpperCase()}`);
        lines.push(separator('-', 40));
        lines.push('');

        // Process content - strip markdown and wrap
        const plainContent = stripMarkdown(section.content);
        lines.push(wrapText(plainContent, width));
        lines.push('');

        // Evidence citations
        if (options.includeEvidence && section.evidence.length > 0) {
          lines.push('  Evidence citations:');
          for (const evidence of section.evidence) {
            const timestamp = options.includeTimestamps 
              ? ` [${formatTimestamp(evidence.transcriptStart)}]` 
              : '';
            const speaker = options.includeSpeakers && evidence.speaker 
              ? `${evidence.speaker}: ` 
              : '';
            lines.push(`    > ${speaker}"${evidence.text}"${timestamp}`);
          }
          lines.push('');
        }

        lines.push('');
        sectionNum++;
      }

      // Action Items
      if (options.includeActionItems && minute.actionItems.length > 0) {
        lines.push(`${sectionNum}. ACTION ITEMS`);
        lines.push(separator('-', 40));
        lines.push('');

        for (let i = 0; i < minute.actionItems.length; i++) {
          const action = minute.actionItems[i];
          lines.push(`  [${i + 1}] ${action.description}`);
          lines.push(`      Assigned to: ${action.assignee}`);
          lines.push(`      Due: ${formatDate(action.dueDate)}`);
          lines.push(`      Priority: ${action.priority.toUpperCase()}`);
          lines.push(`      Status: ${action.status}`);
          lines.push('');
        }
      }

      // Footer
      lines.push(separator('=', width));
      lines.push('');
      lines.push(`Document generated on ${new Date().toLocaleDateString('en-GB')}`);
      
      if (options.includeBranding && template.confidentialityNotice) {
        lines.push('');
        lines.push(separator('-', width));
        lines.push('');
        lines.push('CONFIDENTIALITY NOTICE:');
        lines.push(wrapText(template.confidentialityNotice, width));
      }

      if (options.showDraftWatermark && minute.status === 'draft') {
        lines.push('');
        lines.push(separator('*', width));
        lines.push('*** THIS IS A DRAFT DOCUMENT - NOT FOR OFFICIAL USE ***');
        lines.push(separator('*', width));
      }

      lines.push('');
      lines.push(separator('=', width));

      // Create blob
      const content = lines.join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const filename = generateFilename(minute.title, minute.date);

      return {
        success: true,
        blob,
        filename,
        mimeType: 'text/plain',
        size: blob.size,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filename: 'error.txt',
        mimeType: 'text/plain',
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to generate text export',
      };
    }
  }

  async generatePreview(request: ExportRequest): Promise<string> {
    const result = await this.generate(request);
    if (result.success && result.blob) {
      return await result.blob.text();
    }
    return 'Preview not available';
  }
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove bullet points formatting but keep bullets
    .replace(/^[-*+]\s+/gm, '• ')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Format timestamp in seconds to MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate filename for export
 */
function generateFilename(title: string, date: string): string {
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 50);
  const dateStr = date.split('T')[0] || new Date().toISOString().split('T')[0];
  return `${dateStr}_${sanitizedTitle}.txt`;
}

export const txtFormatter = new TxtFormatter();
export default txtFormatter;
