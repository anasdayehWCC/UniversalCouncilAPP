/**
 * Royal Borough of Kensington and Chelsea Export Template
 * 
 * Official branding template for RBKC documents.
 * Includes RBKC colors, fonts, and official styling guidelines.
 */

import type { ExportTemplate } from '../types';

export const rbkcTemplate: ExportTemplate = {
  id: 'rbkc',
  name: 'Royal Borough of Kensington and Chelsea',
  organization: 'Royal Borough of Kensington and Chelsea',
  organizationShort: 'RBKC',
  // RBKC logo placeholder - in production, this would be the actual logo
  logoBase64: undefined, // Would be populated with actual logo
  logoDimensions: {
    width: 200,
    height: 70,
  },
  styles: {
    // RBKC corporate purple/maroon
    primaryColor: '#6B2346',
    // RBKC secondary color
    accentColor: '#8B3366',
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
  headerTemplate: 'Royal Borough of Kensington and Chelsea - {{department}}',
  footerTemplate: 'Page {{page}} of {{totalPages}} | RBKC | {{classification}}',
  confidentialityNotice: 
    'This document is the property of the Royal Borough of Kensington and Chelsea and contains confidential ' +
    'information. It is intended only for the use of the named recipient(s). Unauthorized use, disclosure, or ' +
    'distribution is prohibited. If you have received this document in error, please contact the sender immediately.',
  dataProtectionNotice:
    'The Royal Borough of Kensington and Chelsea processes personal data in accordance with the UK General Data ' +
    'Protection Regulation (UK GDPR) and Data Protection Act 2018. For more information about how we handle ' +
    'your data, please visit rbkc.gov.uk/privacy',
  classification: 'official-sensitive',
};

/**
 * RBKC Family Services template
 */
export const rbkcFamilyServicesTemplate: ExportTemplate = {
  ...rbkcTemplate,
  id: 'rbkc-family-services',
  name: 'RBKC Family Services',
  headerTemplate: 'Royal Borough of Kensington and Chelsea - Family Services',
  confidentialityNotice:
    'CONFIDENTIAL - FAMILY SERVICES RECORD\n\n' +
    'This document contains sensitive personal information relating to children and families. ' +
    'It must be handled in accordance with RBKC\'s Information Governance policies ' +
    'and the Children Act 1989/2004. Unauthorized disclosure may constitute a criminal offence.',
  classification: 'official-sensitive',
};

/**
 * RBKC Adult Social Care template
 */
export const rbkcAdultSocialCareTemplate: ExportTemplate = {
  ...rbkcTemplate,
  id: 'rbkc-adult-social-care',
  name: 'RBKC Adult Social Care',
  headerTemplate: 'Royal Borough of Kensington and Chelsea - Adult Social Care',
  confidentialityNotice:
    'CONFIDENTIAL - ADULT SOCIAL CARE RECORD\n\n' +
    'This document contains sensitive personal information relating to adults receiving care and support. ' +
    'It must be handled in accordance with RBKC\'s Information Governance policies ' +
    'and the Care Act 2014. Unauthorized disclosure may constitute a criminal offence.',
  classification: 'official-sensitive',
};

export default rbkcTemplate;
