/**
 * Word Document (DOCX) Formatter
 * 
 * Exports meeting minutes as Microsoft Word documents using the docx library.
 * Includes council branding, professional styling, and action item tables.
 */

import type {
  ExportRequest,
  ExportResult,
  IExportFormatter,
  ExportFormat,
} from '../types';
import type { MinuteSection, ActionItem, MinuteAttendee } from '../../minutes/types';

// Note: The docx library needs to be added to package.json
// This formatter is designed to work with the 'docx' npm package

/**
 * Check if docx library is available
 */
async function getDocxModule() {
  try {
    const docx = await import('docx');
    return docx;
  } catch {
    return null;
  }
}

/**
 * Convert hex color to docx-compatible format
 */
function hexToDocxColor(hex: string): string {
  return hex.replace('#', '').toUpperCase();
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
 * Format timestamp in seconds to MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
 * Word document export formatter
 */
export class DocxFormatter implements IExportFormatter {
  readonly format: ExportFormat = 'docx';

  async generate(request: ExportRequest): Promise<ExportResult> {
    const docx = await getDocxModule();
    
    if (!docx) {
      return {
        success: false,
        filename: 'error.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        generatedAt: new Date().toISOString(),
        error: 'Word export requires the docx library. Please install it with: npm install docx',
      };
    }

    const { minute, options, template } = request;
    const { styles } = template;
    const primaryColor = hexToDocxColor(styles.primaryColor);
    const accentColor = hexToDocxColor(styles.accentColor);

    try {
      const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        WidthType,
        AlignmentType,
        BorderStyle,
        HeadingLevel,
        TableOfContents,
        PageNumber,
        NumberFormat,
        Header,
        Footer,
        ShadingType,
      } = docx;

      // Build document sections
      const children: typeof Paragraph[] = [];

      // Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: options.customTitle || minute.title,
              bold: true,
              size: styles.fontSize.title * 2, // Convert pt to half-points
              color: primaryColor,
            }),
          ],
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );

      // Metadata
      if (options.includeMetadata) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Date: ', bold: true }),
              new TextRun({ text: formatDate(minute.date) }),
              new TextRun({ text: '  |  ' }),
              new TextRun({ text: 'Duration: ', bold: true }),
              new TextRun({ text: minute.duration }),
            ],
            spacing: { after: 200 },
          })
        );

        if (minute.metadata.caseId) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Case Reference: ', bold: true }),
                new TextRun({ text: minute.metadata.caseId }),
              ],
              spacing: { after: 200 },
            })
          );
        }

        if (minute.status === 'draft' || minute.status === 'pending_review') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ 
                  text: 'STATUS: DRAFT - NOT FOR OFFICIAL USE', 
                  bold: true,
                  color: 'FF0000',
                }),
              ],
              spacing: { after: 400 },
            })
          );
        }
      }

      // Attendees
      if (options.includeAttendees && minute.attendees.length > 0) {
        children.push(
          new Paragraph({
            text: 'Attendees',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );

        children.push(this.buildAttendeesTable(docx, minute.attendees, primaryColor));
        children.push(new Paragraph({ spacing: { after: 400 } }));
      }

      // Table of Contents
      if (options.includeTableOfContents) {
        children.push(
          new Paragraph({
            text: 'Contents',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );

        children.push(
          new TableOfContents('Table of Contents', {
            hyperlink: true,
            headingStyleRange: '1-3',
          })
        );
        children.push(new Paragraph({ pageBreakBefore: true }));
      }

      // Sections
      const includedSections = minute.sections.filter(s =>
        options.includedSections.length === 0 || options.includedSections.includes(s.id)
      );

      for (const section of includedSections) {
        children.push(...this.buildSection(docx, section, options, primaryColor, accentColor, styles));
      }

      // Action Items
      if (options.includeActionItems && minute.actionItems.length > 0) {
        children.push(
          new Paragraph({
            text: 'Action Items',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          })
        );

        children.push(this.buildActionItemsTable(docx, minute.actionItems, primaryColor));
      }

      // Confidentiality Notice
      if (options.includeBranding && template.confidentialityNotice) {
        children.push(new Paragraph({ spacing: { before: 800 } }));
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Confidentiality Notice', bold: true }),
            ],
            spacing: { after: 100 },
          })
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: template.confidentialityNotice, 
                size: styles.fontSize.caption * 2,
                italics: true,
              }),
            ],
            shading: { type: ShadingType.SOLID, color: 'FFFBEB' },
            border: {
              left: { style: BorderStyle.SINGLE, size: 20, color: 'FBBF24' },
            },
          })
        );
      }

      // Build document
      const doc = new Document({
        creator: template.organization,
        title: minute.title,
        description: `Meeting minutes generated by ${template.organization}`,
        styles: {
          default: {
            heading1: {
              run: {
                font: styles.headingFont,
                size: styles.fontSize.heading1 * 2,
                bold: true,
                color: primaryColor,
              },
              paragraph: {
                spacing: { before: 400, after: 200 },
              },
            },
            heading2: {
              run: {
                font: styles.headingFont,
                size: styles.fontSize.heading2 * 2,
                bold: true,
                color: accentColor,
              },
            },
            document: {
              run: {
                font: styles.bodyFont,
                size: styles.fontSize.body * 2,
              },
              paragraph: {
                spacing: { line: Math.round(styles.lineSpacing * 240) },
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: styles.margins.top * 1440, // Convert inches to twips
                  bottom: styles.margins.bottom * 1440,
                  left: styles.margins.left * 1440,
                  right: styles.margins.right * 1440,
                },
              },
            },
            headers: options.includeBranding ? {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: template.organization, size: 18, color: primaryColor }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            } : undefined,
            footers: options.includePageNumbers ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Page ' }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                      }),
                      new TextRun({ text: ' of ' }),
                      new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                      }),
                      new TextRun({ text: `  |  ${template.organizationShort}` }),
                    ],
                    alignment: AlignmentType.CENTER,
                    size: styles.fontSize.caption * 2,
                  }),
                ],
              }),
            } : undefined,
            children,
          },
        ],
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);
      const filename = this.generateFilename(minute.title, minute.date);

      return {
        success: true,
        blob,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: blob.size,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filename: 'error.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to generate Word document',
      };
    }
  }

  private buildAttendeesTable(docx: any, attendees: MinuteAttendee[], primaryColor: string): any {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, ShadingType } = docx;

    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true, color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: primaryColor },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Role', bold: true, color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: primaryColor },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: primaryColor },
        }),
      ],
    });

    const rows = attendees.map((attendee, index) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: attendee.name })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({ text: attendee.role })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({ text: attendee.present ? 'Present' : 'Absent' })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
        ],
      })
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...rows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      },
    });
  }

  private buildSection(
    docx: any,
    section: MinuteSection,
    options: any,
    primaryColor: string,
    accentColor: string,
    styles: any
  ): any[] {
    const { Paragraph, TextRun, HeadingLevel, BorderStyle, ShadingType } = docx;
    const children: any[] = [];

    // Section title
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 20, color: accentColor },
        },
      })
    );

    // Section content - split into paragraphs
    const contentParagraphs = stripMarkdown(section.content).split('\n\n');
    for (const para of contentParagraphs) {
      if (para.trim()) {
        const isBullet = para.trim().startsWith('•');
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para.trim() })],
            spacing: { after: 200 },
            bullet: isBullet ? { level: 0 } : undefined,
          })
        );
      }
    }

    // Evidence
    if (options.includeEvidence && section.evidence.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Supporting Evidence:', bold: true, size: styles.fontSize.caption * 2 })],
          spacing: { before: 200, after: 100 },
          shading: { type: ShadingType.SOLID, color: 'FFFBEB' },
        })
      );

      for (const evidence of section.evidence) {
        const speakerText = options.includeSpeakers && evidence.speaker ? `${evidence.speaker}: ` : '';
        const timestampText = options.includeTimestamps ? ` [${formatTimestamp(evidence.transcriptStart)}]` : '';
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `"${speakerText}${evidence.text}"`, italics: true, size: styles.fontSize.caption * 2 }),
              new TextRun({ text: timestampText, size: styles.fontSize.caption * 2, color: '6B7280' }),
            ],
            spacing: { after: 100 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 20, color: 'FBBF24' },
            },
            indent: { left: 200 },
          })
        );
      }
    }

    return children;
  }

  private buildActionItemsTable(docx: any, actionItems: ActionItem[], primaryColor: string): any {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, ShadingType } = docx;

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent': return 'FECACA';
        case 'high': return 'FED7AA';
        case 'medium': return 'FEF3C7';
        case 'low': return 'D1FAE5';
        default: return 'F3F4F6';
      }
    };

    const headerRow = new TableRow({
      children: ['#', 'Action', 'Assignee', 'Due Date', 'Priority', 'Status'].map(header =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: primaryColor },
        })
      ),
    });

    const rows = actionItems.map((action, index) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: String(index + 1) })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({ text: action.description })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({ text: action.assignee })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({ text: formatDate(action.dueDate) })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: action.priority.toUpperCase(), bold: true, size: 18 })],
              }),
            ],
            shading: { type: ShadingType.SOLID, color: getPriorityColor(action.priority) },
          }),
          new TableCell({
            children: [new Paragraph({ text: action.status })],
            shading: index % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: 'F9FAFB' },
          }),
        ],
      })
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...rows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      },
    });
  }

  private generateFilename(title: string, date: string): string {
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 50);
    const dateStr = date.split('T')[0] || new Date().toISOString().split('T')[0];
    return `${dateStr}_${sanitizedTitle}.docx`;
  }
}

export const docxFormatter = new DocxFormatter();
export default docxFormatter;
