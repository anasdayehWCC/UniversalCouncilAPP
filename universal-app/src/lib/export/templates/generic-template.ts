/**
 * Generic Export Template
 * 
 * Default template for councils without specific branding.
 * Provides clean, professional formatting suitable for any organization.
 */

import type { ExportTemplate } from '../types';

export const genericTemplate: ExportTemplate = {
  id: 'generic',
  name: 'Generic Template',
  organization: 'Council',
  organizationShort: 'Council',
  styles: {
    primaryColor: '#1e40af', // Professional blue
    accentColor: '#3b82f6',
    headingFont: 'Arial',
    bodyFont: 'Arial',
    fontSize: {
      title: 24,
      heading1: 18,
      heading2: 14,
      heading3: 12,
      body: 11,
      caption: 9,
    },
    lineSpacing: 1.15,
    paragraphSpacing: 8,
    margins: {
      top: 1,
      bottom: 1,
      left: 1,
      right: 1,
    },
  },
  headerTemplate: '',
  footerTemplate: 'Page {{page}} | Generated on {{date}} | {{classification}}',
  confidentialityNotice: 'This document contains confidential information and is intended only for the use of the named recipient(s). If you have received this document in error, please notify the sender immediately.',
  dataProtectionNotice: 'This document may contain personal data processed in accordance with the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018.',
  classification: 'official',
};

/**
 * Create a custom template based on generic
 */
export function createCustomTemplate(
  overrides: Partial<ExportTemplate>
): ExportTemplate {
  return {
    ...genericTemplate,
    ...overrides,
    styles: {
      ...genericTemplate.styles,
      ...overrides.styles,
      fontSize: {
        ...genericTemplate.styles.fontSize,
        ...overrides.styles?.fontSize,
      },
      margins: {
        ...genericTemplate.styles.margins,
        ...overrides.styles?.margins,
      },
    },
  };
}

export default genericTemplate;
