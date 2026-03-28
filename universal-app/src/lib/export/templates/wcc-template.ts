/**
 * Westminster City Council Export Template
 * 
 * Official branding template for Westminster City Council documents.
 * Includes WCC colors, fonts, and official styling guidelines.
 */

import type { ExportTemplate } from '../types';

export const wccTemplate: ExportTemplate = {
  id: 'wcc',
  name: 'Westminster City Council',
  organization: 'Westminster City Council',
  organizationShort: 'WCC',
  // WCC logo as base64 placeholder - in production, this would be the actual logo
  logoBase64: undefined, // Would be populated with actual logo
  logoDimensions: {
    width: 180,
    height: 60,
  },
  styles: {
    // WCC corporate green
    primaryColor: '#00703C',
    // WCC secondary color
    accentColor: '#003D21',
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
      left: 1.25,
      right: 1,
    },
  },
  headerTemplate: 'Westminster City Council - {{department}}',
  footerTemplate: 'Page {{page}} of {{totalPages}} | Westminster City Council | {{classification}}',
  confidentialityNotice: 
    'This document is the property of Westminster City Council and contains confidential information. ' +
    'It is intended only for the use of the named recipient(s). Unauthorized use, disclosure, or ' +
    'distribution is prohibited. If you have received this document in error, please contact the sender immediately.',
  dataProtectionNotice:
    'Westminster City Council processes personal data in accordance with the UK General Data Protection ' +
    'Regulation (UK GDPR) and Data Protection Act 2018. For more information about how we handle your data, ' +
    'please visit westminster.gov.uk/privacy-policy',
  classification: 'official-sensitive',
};

/**
 * WCC Social Care specific template
 */
export const wccSocialCareTemplate: ExportTemplate = {
  ...wccTemplate,
  id: 'wcc-social-care',
  name: 'WCC Social Care',
  headerTemplate: 'Westminster City Council - Children\'s Services',
  confidentialityNotice:
    'CONFIDENTIAL - SOCIAL CARE RECORD\n\n' +
    'This document contains sensitive personal information relating to children and families. ' +
    'It must be handled in accordance with Westminster City Council\'s Information Governance policies ' +
    'and the Children Act 1989/2004. Unauthorized disclosure may constitute a criminal offence.',
  classification: 'official-sensitive',
};

/**
 * WCC Adults Social Care template
 */
export const wccAdultsTemplate: ExportTemplate = {
  ...wccTemplate,
  id: 'wcc-adults',
  name: 'WCC Adults Services',
  headerTemplate: 'Westminster City Council - Adults Social Care',
  confidentialityNotice:
    'CONFIDENTIAL - ADULTS SOCIAL CARE RECORD\n\n' +
    'This document contains sensitive personal information relating to adults receiving care and support. ' +
    'It must be handled in accordance with Westminster City Council\'s Information Governance policies ' +
    'and the Care Act 2014. Unauthorized disclosure may constitute a criminal offence.',
  classification: 'official-sensitive',
};

export default wccTemplate;
