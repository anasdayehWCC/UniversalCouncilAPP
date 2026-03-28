/**
 * Export Templates Registry
 * 
 * Central registry for all export templates.
 * Templates are selected based on tenant configuration.
 */

import type { ExportTemplate } from '../types';
import { genericTemplate, createCustomTemplate } from './generic-template';
import { wccTemplate, wccSocialCareTemplate, wccAdultsTemplate } from './wcc-template';
import { rbkcTemplate, rbkcFamilyServicesTemplate, rbkcAdultSocialCareTemplate } from './rbkc-template';

// ============================================================================
// Template Registry
// ============================================================================

/**
 * All available export templates
 */
export const exportTemplates: Record<string, ExportTemplate> = {
  // Generic
  generic: genericTemplate,
  
  // Westminster City Council
  wcc: wccTemplate,
  'wcc-social-care': wccSocialCareTemplate,
  'wcc-adults': wccAdultsTemplate,
  
  // Royal Borough of Kensington and Chelsea
  rbkc: rbkcTemplate,
  'rbkc-family-services': rbkcFamilyServicesTemplate,
  'rbkc-adult-social-care': rbkcAdultSocialCareTemplate,
};

/**
 * Get template by ID
 */
export function getTemplate(id: string): ExportTemplate {
  return exportTemplates[id] ?? genericTemplate;
}

/**
 * Get template for tenant and domain
 */
export function getTemplateForTenant(
  tenantId: string,
  domain?: string
): ExportTemplate {
  // Try tenant + domain specific template
  if (domain) {
    const specificKey = `${tenantId}-${domain}`.toLowerCase();
    if (exportTemplates[specificKey]) {
      return exportTemplates[specificKey];
    }
  }
  
  // Try tenant-level template
  const tenantKey = tenantId.toLowerCase();
  if (exportTemplates[tenantKey]) {
    return exportTemplates[tenantKey];
  }
  
  // Fall back to generic
  return genericTemplate;
}

/**
 * Get all templates for a specific tenant
 */
export function getTemplatesForTenant(tenantId: string): ExportTemplate[] {
  const tenantKey = tenantId.toLowerCase();
  return Object.entries(exportTemplates)
    .filter(([key]) => key === tenantKey || key.startsWith(`${tenantKey}-`))
    .map(([, template]) => template);
}

/**
 * List all available templates
 */
export function listTemplates(): Array<{ id: string; name: string; organization: string }> {
  return Object.entries(exportTemplates).map(([id, template]) => ({
    id,
    name: template.name,
    organization: template.organization,
  }));
}

// ============================================================================
// Re-exports
// ============================================================================

export { genericTemplate, createCustomTemplate };
export { wccTemplate, wccSocialCareTemplate, wccAdultsTemplate };
export { rbkcTemplate, rbkcFamilyServicesTemplate, rbkcAdultSocialCareTemplate };
