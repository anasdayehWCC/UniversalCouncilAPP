/**
 * HTML Formatter
 * 
 * Exports meeting minutes as styled HTML documents.
 * Includes embedded CSS for standalone viewing and printing.
 */

import type {
  ExportRequest,
  ExportResult,
  IExportFormatter,
  ExportFormat,
} from '../types';
import type { ActionItem, EvidenceLink, MinuteAttendee, MinuteSection } from '../../minutes/types';

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
 * Convert markdown to HTML
 */
function markdownToHtml(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Lists
    .replace(/^[-*+]\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Paragraphs
    .split('\n\n')
    .map(para => {
      if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<li')) {
        return para;
      }
      return `<p>${para}</p>`;
    })
    .join('\n')
    // Clean up
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(\s*<[hul])/g, '$1')
    .replace(/(<\/[hul][^>]*>)\s*<\/p>/g, '$1');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * HTML export formatter
 */
export class HtmlFormatter implements IExportFormatter {
  readonly format: ExportFormat = 'html';

  async generate(request: ExportRequest): Promise<ExportResult> {
    const { minute, options, template } = request;

    try {
      const html = this.buildHtml(minute, options, template);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const filename = this.generateFilename(minute.title, minute.date);

      return {
        success: true,
        blob,
        filename,
        mimeType: 'text/html',
        size: blob.size,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        filename: 'error.html',
        mimeType: 'text/html',
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to generate HTML export',
      };
    }
  }

  async generatePreview(request: ExportRequest): Promise<string> {
    const { minute, options, template } = request;
    return this.buildHtml(minute, options, template);
  }

  private buildHtml(
    minute: typeof arguments[0],
    options: typeof arguments[1],
    template: typeof arguments[2]
  ): string {
    const { styles } = template;
    const isDraft = minute.status === 'draft' || minute.status === 'pending_review';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(minute.title)}</title>
  <style>
    ${this.getStyles(styles, template.primaryColor)}
    ${isDraft && options.showDraftWatermark ? this.getDraftStyles() : ''}
  </style>
</head>
<body>
  <div class="document">
    ${options.includeBranding ? this.buildHeader(template, minute) : ''}
    
    <main class="content">
      <header class="document-header">
        <h1 class="title">${escapeHtml(options.customTitle || minute.title)}</h1>
        ${options.includeMetadata ? this.buildMetadata(minute) : ''}
      </header>

      ${options.includeAttendees && minute.attendees.length > 0 
        ? this.buildAttendees(minute.attendees) 
        : ''
      }

      ${options.includeTableOfContents 
        ? this.buildTableOfContents(minute.sections, options, minute.actionItems) 
        : ''
      }

      <div class="sections">
        ${this.buildSections(minute.sections, options)}
      </div>

      ${options.includeActionItems && minute.actionItems.length > 0 
        ? this.buildActionItems(minute.actionItems, options) 
        : ''
      }
    </main>

    ${options.includeBranding ? this.buildFooter(template, options.customFooter) : ''}
  </div>

  ${isDraft && options.showDraftWatermark ? '<div class="watermark">DRAFT</div>' : ''}
</body>
</html>`;
  }

  private getStyles(styles: typeof arguments[0], primaryColor: string): string {
    return `
    :root {
      --primary-color: ${styles.primaryColor};
      --accent-color: ${styles.accentColor};
      --heading-font: ${styles.headingFont}, sans-serif;
      --body-font: ${styles.bodyFont}, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--body-font);
      font-size: ${styles.fontSize.body}pt;
      line-height: ${styles.lineSpacing};
      color: #1f2937;
      background: #fff;
    }

    .document {
      max-width: 210mm;
      margin: 0 auto;
      padding: ${styles.margins.top}in ${styles.margins.right}in ${styles.margins.bottom}in ${styles.margins.left}in;
    }

    h1, h2, h3, h4 {
      font-family: var(--heading-font);
      color: var(--primary-color);
      margin-bottom: ${styles.paragraphSpacing}pt;
    }

    h1 { font-size: ${styles.fontSize.title}pt; }
    h2 { font-size: ${styles.fontSize.heading1}pt; }
    h3 { font-size: ${styles.fontSize.heading2}pt; }
    h4 { font-size: ${styles.fontSize.heading3}pt; }

    p {
      margin-bottom: ${styles.paragraphSpacing}pt;
    }

    .org-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid var(--primary-color);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .org-name {
      font-size: ${styles.fontSize.heading2}pt;
      font-weight: bold;
      color: var(--primary-color);
    }

    .org-logo {
      height: 60px;
      object-fit: contain;
    }

    .document-header {
      margin-bottom: 24px;
    }

    .title {
      margin-bottom: 16px;
    }

    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
    }

    .metadata-item {
      font-size: ${styles.fontSize.caption}pt;
    }

    .metadata-label {
      font-weight: 600;
      color: #6b7280;
    }

    .attendees {
      margin-bottom: 24px;
    }

    .attendees-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .attendee {
      font-size: ${styles.fontSize.body}pt;
    }

    .attendee-name {
      font-weight: 600;
    }

    .attendee-role {
      color: #6b7280;
      font-size: ${styles.fontSize.caption}pt;
    }

    .attendee.absent {
      opacity: 0.6;
    }

    .toc {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .toc-title {
      font-size: ${styles.fontSize.heading3}pt;
      margin-bottom: 12px;
    }

    .toc-list {
      list-style: none;
    }

    .toc-item {
      margin-bottom: 4px;
    }

    .toc-link {
      color: var(--primary-color);
      text-decoration: none;
    }

    .toc-link:hover {
      text-decoration: underline;
    }

    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .section-title {
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    .section-content {
      padding-left: 8px;
    }

    .evidence {
      margin-top: 16px;
      padding: 12px;
      background: #fffbeb;
      border-left: 4px solid #fbbf24;
      border-radius: 4px;
    }

    .evidence-title {
      font-size: ${styles.fontSize.caption}pt;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }

    .evidence-item {
      font-size: ${styles.fontSize.caption}pt;
      font-style: italic;
      margin-bottom: 6px;
    }

    .evidence-meta {
      font-size: ${styles.fontSize.caption - 1}pt;
      color: #6b7280;
    }

    .action-items {
      margin-top: 32px;
    }

    .action-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${styles.fontSize.body}pt;
    }

    .action-table th,
    .action-table td {
      padding: 10px;
      text-align: left;
      border: 1px solid #e5e7eb;
    }

    .action-table th {
      background: var(--primary-color);
      color: white;
      font-weight: 600;
    }

    .action-table tr:nth-child(even) {
      background: #f9fafb;
    }

    .priority-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: ${styles.fontSize.caption}pt;
      font-weight: 600;
    }

    .priority-urgent { background: #fecaca; color: #991b1b; }
    .priority-high { background: #fed7aa; color: #9a3412; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-low { background: #d1fae5; color: #065f46; }

    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: ${styles.fontSize.caption}pt;
      color: #6b7280;
    }

    .confidentiality {
      margin-top: 16px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-size: ${styles.fontSize.caption}pt;
    }

    @media print {
      .document {
        max-width: 100%;
        padding: 0;
      }

      .section {
        page-break-inside: avoid;
      }

      .action-items {
        page-break-before: always;
      }
    }
    `;
  }

  private getDraftStyles(): string {
    return `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120pt;
      font-weight: bold;
      color: rgba(239, 68, 68, 0.1);
      pointer-events: none;
      z-index: 1000;
    }
    `;
  }

  private buildHeader(template: typeof arguments[0], minute: typeof arguments[1]): string {
    const logoHtml = template.logoBase64 
      ? `<img src="${template.logoBase64}" alt="${escapeHtml(template.organization)}" class="org-logo" />`
      : '';

    return `
    <header class="org-header">
      <div class="org-name">${escapeHtml(template.organization)}</div>
      ${logoHtml}
    </header>
    `;
  }

  private buildMetadata(minute: typeof arguments[0]): string {
    const items = [
      { label: 'Date', value: formatDate(minute.date) },
      { label: 'Duration', value: minute.duration },
    ];

    if (minute.metadata.caseId) {
      items.push({ label: 'Case Reference', value: minute.metadata.caseId });
    }
    if (minute.metadata.domain) {
      items.push({ label: 'Service Area', value: minute.metadata.domain });
    }

    return `
    <div class="metadata">
      ${items.map(item => `
        <div class="metadata-item">
          <span class="metadata-label">${escapeHtml(item.label)}:</span>
          <span>${escapeHtml(item.value)}</span>
        </div>
      `).join('')}
    </div>
    `;
  }

  private buildAttendees(attendees: MinuteAttendee[]): string {
    return `
    <section class="attendees">
      <h3>Attendees</h3>
      <div class="attendees-grid">
        ${attendees.map(a => `
          <div class="attendee ${a.present ? '' : 'absent'}">
            <span class="attendee-name">${escapeHtml(a.name)}</span>
            <span class="attendee-role">${escapeHtml(a.role)}${a.present ? '' : ' (Absent)'}</span>
          </div>
        `).join('')}
      </div>
    </section>
    `;
  }

  private buildTableOfContents(
    sections: MinuteSection[], 
    options: typeof arguments[1],
    actionItems: ActionItem[]
  ): string {
    const includedSections = sections.filter(s => 
      options.includedSections.length === 0 || options.includedSections.includes(s.id)
    );

    return `
    <nav class="toc">
      <h3 class="toc-title">Table of Contents</h3>
      <ol class="toc-list">
        ${includedSections.map((s, i) => `
          <li class="toc-item">
            <a href="#section-${s.id}" class="toc-link">${i + 1}. ${escapeHtml(s.title)}</a>
          </li>
        `).join('')}
        ${options.includeActionItems && actionItems.length > 0 ? `
          <li class="toc-item">
            <a href="#action-items" class="toc-link">${includedSections.length + 1}. Action Items</a>
          </li>
        ` : ''}
      </ol>
    </nav>
    `;
  }

  private buildSections(sections: MinuteSection[], options: typeof arguments[1]): string {
    return sections
      .filter(s => options.includedSections.length === 0 || options.includedSections.includes(s.id))
      .map((section, index) => `
        <section class="section" id="section-${section.id}">
          <h2 class="section-title">${index + 1}. ${escapeHtml(section.title)}</h2>
          <div class="section-content">
            ${markdownToHtml(section.content)}
            ${options.includeEvidence && section.evidence.length > 0 ? this.buildEvidence(section.evidence, options) : ''}
          </div>
        </section>
      `).join('');
  }

  private buildEvidence(evidence: EvidenceLink[], options: typeof arguments[1]): string {
    return `
    <div class="evidence">
      <div class="evidence-title">Supporting Evidence</div>
      ${evidence.map(e => `
        <div class="evidence-item">
          "${escapeHtml(e.text)}"
          <div class="evidence-meta">
            ${options.includeSpeakers && e.speaker ? `${escapeHtml(e.speaker)} • ` : ''}
            ${options.includeTimestamps ? formatTimestamp(e.transcriptStart) : ''}
          </div>
        </div>
      `).join('')}
    </div>
    `;
  }

  private buildActionItems(actionItems: ActionItem[], options: typeof arguments[1]): string {
    return `
    <section class="action-items" id="action-items">
      <h2 class="section-title">Action Items</h2>
      <table class="action-table">
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 40%">Action</th>
            <th style="width: 20%">Assignee</th>
            <th style="width: 15%">Due Date</th>
            <th style="width: 10%">Priority</th>
            <th style="width: 10%">Status</th>
          </tr>
        </thead>
        <tbody>
          ${actionItems.map((action, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(action.description)}</td>
              <td>${escapeHtml(action.assignee)}</td>
              <td>${formatDate(action.dueDate)}</td>
              <td><span class="priority-badge priority-${action.priority}">${action.priority}</span></td>
              <td>${action.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
    `;
  }

  private buildFooter(template: typeof arguments[0], customFooter?: string): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    return `
    <footer class="footer">
      <p>${customFooter || `Document generated on ${currentDate}`}</p>
      ${template.confidentialityNotice ? `
        <div class="confidentiality">
          <strong>Confidentiality Notice:</strong><br>
          ${escapeHtml(template.confidentialityNotice)}
        </div>
      ` : ''}
    </footer>
    `;
  }

  private generateFilename(title: string, date: string): string {
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 50);
    const dateStr = date.split('T')[0] || new Date().toISOString().split('T')[0];
    return `${dateStr}_${sanitizedTitle}.html`;
  }
}

export const htmlFormatter = new HtmlFormatter();
export default htmlFormatter;
