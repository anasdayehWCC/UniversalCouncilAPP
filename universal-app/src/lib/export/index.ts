/**
 * Export Module Index
 * 
 * Central entry point for all export functionality.
 */

// Types
export * from './types';

// Formatters
export { getFormatter, isFormatSupported, getSupportedFormats } from './formatters';
export { docxFormatter } from './formatters/docx';
export { pdfFormatter } from './formatters/pdf';
export { txtFormatter } from './formatters/txt';
export { htmlFormatter } from './formatters/html';

// Templates
export { 
  exportTemplates, 
  getTemplate, 
  getTemplateForTenant, 
  getTemplatesForTenant,
  listTemplates,
  genericTemplate,
  createCustomTemplate,
  wccTemplate,
  wccSocialCareTemplate,
  wccAdultsTemplate,
  rbkcTemplate,
  rbkcFamilyServicesTemplate,
  rbkcAdultSocialCareTemplate,
} from './templates';
