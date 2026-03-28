/**
 * PDF Document Formatter
 * 
 * Exports meeting minutes as PDF documents using jsPDF library.
 * Includes council branding, professional styling, and print-ready formatting.
 */

import type {
  ExportRequest,
  ExportResult,
  IExportFormatter,
  ExportFormat,
} from '../types';
import type { MinuteSection, ActionItem, MinuteAttendee } from '../../minutes/types';

// Note: jspdf needs to be added to package.json
// This formatter is designed to work with the 'jspdf' npm package

/**
 * Check if jsPDF library is available
 */
async function getJsPdfModule() {
  try {
    const jsPDF = await import('jspdf');
    return jsPDF;
  } catch {
    return null;
  }
}

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
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
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
 * PDF export formatter
 */
export class PdfFormatter implements IExportFormatter {
  readonly format: ExportFormat = 'pdf';

  async generate(request: ExportRequest): Promise<ExportResult> {
    const jsPDFModule = await getJsPdfModule();
    
    if (!jsPDFModule) {
      return {
        success: false,
        filename: 'error.pdf',
        mimeType: 'application/pdf',
        generatedAt: new Date().toISOString(),
        error: 'PDF export requires the jspdf library. Please install it with: npm install jspdf',
      };
    }

    const { minute, options, template } = request;
    const { styles } = template;
    const primaryColor = hexToRgb(styles.primaryColor);
    const accentColor = hexToRgb(styles.accentColor);

    try {
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = {
        top: styles.margins.top * 25.4,
        bottom: styles.margins.bottom * 25.4,
        left: styles.margins.left * 25.4,
        right: styles.margins.right * 25.4,
      };
      const contentWidth = pageWidth - margin.left - margin.right;
      let y = margin.top;

      // Helper function to add page break if needed
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin.bottom) {
          doc.addPage();
          y = margin.top;
          // Add header on new page
          if (options.includeBranding) {
            this.addHeader(doc, template, pageWidth, margin, primaryColor);
            y = margin.top + 15;
          }
          // Add page number
          if (options.includePageNumbers) {
            this.addFooter(doc, template, pageWidth, pageHeight, margin);
          }
          return true;
        }
        return false;
      };

      // Add header
      if (options.includeBranding) {
        this.addHeader(doc, template, pageWidth, margin, primaryColor);
        y += 15;
      }

      // Title
      doc.setFontSize(styles.fontSize.title);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      
      const title = options.customTitle || minute.title;
      const titleLines = doc.splitTextToSize(title, contentWidth);
      doc.text(titleLines, margin.left, y);
      y += titleLines.length * 8 + 5;

      // Draft watermark
      if (options.showDraftWatermark && (minute.status === 'draft' || minute.status === 'pending_review')) {
        doc.setFontSize(60);
        doc.setTextColor(239, 68, 68, 0.1);
        doc.setFont('helvetica', 'bold');
        doc.text('DRAFT', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45,
        });
        doc.setTextColor(0, 0, 0);
      }

      // Metadata
      if (options.includeMetadata) {
        doc.setFontSize(styles.fontSize.body);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Date: ${formatDate(minute.date)}  |  Duration: ${minute.duration}`, margin.left, y);
        y += 6;

        if (minute.metadata.caseId) {
          doc.text(`Case Reference: ${minute.metadata.caseId}`, margin.left, y);
          y += 6;
        }

        if (minute.metadata.domain) {
          doc.text(`Service Area: ${minute.metadata.domain}`, margin.left, y);
          y += 6;
        }

        // Divider
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin.left, y + 2, pageWidth - margin.right, y + 2);
        y += 10;
      }

      // Attendees
      if (options.includeAttendees && minute.attendees.length > 0) {
        checkPageBreak(30);
        y = this.addAttendees(doc, minute.attendees, y, margin, contentWidth, styles, primaryColor);
      }

      // Sections
      const includedSections = minute.sections.filter(s =>
        options.includedSections.length === 0 || options.includedSections.includes(s.id)
      );

      for (const section of includedSections) {
        checkPageBreak(20);
        y = this.addSection(doc, section, y, margin, contentWidth, styles, options, primaryColor, accentColor);
      }

      // Action Items
      if (options.includeActionItems && minute.actionItems.length > 0) {
        checkPageBreak(40);
        y = this.addActionItems(doc, minute.actionItems, y, margin, contentWidth, styles, primaryColor);
      }

      // Confidentiality Notice
      if (options.includeBranding && template.confidentialityNotice) {
        checkPageBreak(30);
        y = this.addConfidentialityNotice(doc, template.confidentialityNotice, y, margin, contentWidth, styles);
      }

      // Add footer to all pages
      if (options.includePageNumbers) {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          this.addFooter(doc, template, pageWidth, pageHeight, margin, i, totalPages);
        }
      }

      // Generate blob
      const blob = doc.output('blob');
      const filename = this.generateFilename(minute.title, minute.date);

      return {
        success: true,
        blob,
        filename,
        mimeType: 'application/pdf',
        size: blob.size,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filename: 'error.pdf',
        mimeType: 'application/pdf',
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to generate PDF document',
      };
    }
  }

  private addHeader(
    doc: any,
    template: any,
    pageWidth: number,
    margin: { left: number; right: number; top: number },
    primaryColor: [number, number, number]
  ): void {
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(template.organization, pageWidth - margin.right, margin.top, { align: 'right' });
    
    // Underline
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin.left, margin.top + 5, pageWidth - margin.right, margin.top + 5);
  }

  private addFooter(
    doc: any,
    template: any,
    pageWidth: number,
    pageHeight: number,
    margin: { left: number; right: number; bottom: number },
    currentPage?: number,
    totalPages?: number
  ): void {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    
    const footerY = pageHeight - margin.bottom + 10;
    const pageText = currentPage && totalPages 
      ? `Page ${currentPage} of ${totalPages}  |  ${template.organizationShort}`
      : template.organizationShort;
    
    doc.text(pageText, pageWidth / 2, footerY, { align: 'center' });
  }

  private addAttendees(
    doc: any,
    attendees: MinuteAttendee[],
    y: number,
    margin: { left: number },
    contentWidth: number,
    styles: any,
    primaryColor: [number, number, number]
  ): number {
    doc.setFontSize(styles.fontSize.heading1);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendees', margin.left, y);
    y += 8;

    doc.setFontSize(styles.fontSize.body);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');

    for (const attendee of attendees) {
      const status = attendee.present ? '✓' : '(Absent)';
      doc.text(`${status} ${attendee.name} - ${attendee.role}`, margin.left + 5, y);
      y += 5;
    }

    return y + 10;
  }

  private addSection(
    doc: any,
    section: MinuteSection,
    y: number,
    margin: { left: number },
    contentWidth: number,
    styles: any,
    options: any,
    primaryColor: [number, number, number],
    accentColor: [number, number, number]
  ): number {
    // Section title
    doc.setFontSize(styles.fontSize.heading1);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin.left, y);
    
    // Underline
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(margin.left, y + 2, margin.left + contentWidth, y + 2);
    y += 10;

    // Section content
    doc.setFontSize(styles.fontSize.body);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');

    const content = stripMarkdown(section.content);
    const lines = doc.splitTextToSize(content, contentWidth);
    doc.text(lines, margin.left, y);
    y += lines.length * 5 + 5;

    // Evidence
    if (options.includeEvidence && section.evidence.length > 0) {
      doc.setFillColor(255, 251, 235);
      doc.rect(margin.left, y - 2, contentWidth, section.evidence.length * 8 + 8, 'F');
      
      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(1);
      doc.line(margin.left, y - 2, margin.left, y + section.evidence.length * 8 + 6);

      doc.setFontSize(styles.fontSize.caption);
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.text('Supporting Evidence:', margin.left + 3, y + 3);
      y += 8;

      doc.setFont('helvetica', 'italic');
      for (const evidence of section.evidence) {
        const speakerText = options.includeSpeakers && evidence.speaker ? `${evidence.speaker}: ` : '';
        const timestampText = options.includeTimestamps ? ` [${formatTimestamp(evidence.transcriptStart)}]` : '';
        const evidenceText = `"${speakerText}${evidence.text}"${timestampText}`;
        const evidenceLines = doc.splitTextToSize(evidenceText, contentWidth - 10);
        doc.text(evidenceLines, margin.left + 5, y);
        y += evidenceLines.length * 4 + 3;
      }
    }

    return y + 5;
  }

  private addActionItems(
    doc: any,
    actionItems: ActionItem[],
    y: number,
    margin: { left: number },
    contentWidth: number,
    styles: any,
    primaryColor: [number, number, number]
  ): number {
    doc.setFontSize(styles.fontSize.heading1);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Items', margin.left, y);
    y += 10;

    // Table header
    const colWidths = [10, 60, 40, 35, 25, 25];
    const headers = ['#', 'Action', 'Assignee', 'Due Date', 'Priority', 'Status'];

    doc.setFillColor(...primaryColor);
    doc.rect(margin.left, y - 4, contentWidth, 8, 'F');
    
    doc.setFontSize(styles.fontSize.caption);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    let x = margin.left + 2;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x, y);
      x += colWidths[i];
    }
    y += 7;

    // Table rows
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');

    for (let i = 0; i < actionItems.length; i++) {
      const action = actionItems[i];
      
      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin.left, y - 4, contentWidth, 8, 'F');
      }

      x = margin.left + 2;
      doc.text(String(i + 1), x, y);
      x += colWidths[0];
      
      const descLines = doc.splitTextToSize(action.description, colWidths[1] - 2);
      doc.text(descLines[0] + (descLines.length > 1 ? '...' : ''), x, y);
      x += colWidths[1];
      
      doc.text(action.assignee.slice(0, 15), x, y);
      x += colWidths[2];
      
      doc.text(formatDate(action.dueDate).slice(0, 12), x, y);
      x += colWidths[3];
      
      // Priority with color
      const priorityColors: Record<string, [number, number, number]> = {
        urgent: [254, 202, 202],
        high: [254, 215, 170],
        medium: [254, 243, 199],
        low: [209, 250, 229],
      };
      doc.setFillColor(...(priorityColors[action.priority] || [243, 244, 246]));
      doc.rect(x - 1, y - 3, colWidths[4] - 2, 5, 'F');
      doc.text(action.priority, x, y);
      x += colWidths[4];
      
      doc.text(action.status, x, y);
      y += 7;
    }

    return y + 10;
  }

  private addConfidentialityNotice(
    doc: any,
    notice: string,
    y: number,
    margin: { left: number },
    contentWidth: number,
    styles: any
  ): number {
    y += 10;
    
    doc.setFillColor(254, 242, 242);
    const noticeLines = doc.splitTextToSize(notice, contentWidth - 10);
    const noticeHeight = noticeLines.length * 4 + 12;
    doc.rect(margin.left, y - 4, contentWidth, noticeHeight, 'F');
    
    doc.setDrawColor(254, 202, 202);
    doc.setLineWidth(0.5);
    doc.rect(margin.left, y - 4, contentWidth, noticeHeight, 'S');

    doc.setFontSize(styles.fontSize.caption);
    doc.setTextColor(127, 29, 29);
    doc.setFont('helvetica', 'bold');
    doc.text('Confidentiality Notice:', margin.left + 3, y + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.text(noticeLines, margin.left + 3, y + 8);

    return y + noticeHeight + 10;
  }

  private generateFilename(title: string, date: string): string {
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 50);
    const dateStr = date.split('T')[0] || new Date().toISOString().split('T')[0];
    return `${dateStr}_${sanitizedTitle}.pdf`;
  }
}

export const pdfFormatter = new PdfFormatter();
export default pdfFormatter;
