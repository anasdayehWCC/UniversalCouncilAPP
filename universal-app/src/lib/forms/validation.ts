import { z } from 'zod';

// =============================================================================
// Common validation schemas for council app forms
// =============================================================================

// -----------------------------------------------------------------------------
// Contact Information
// -----------------------------------------------------------------------------
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(
  /^(\+44|0)[1-9]\d{8,9}$/,
  'Invalid UK phone number'
);
export const optionalEmailSchema = z.string().email('Invalid email address').optional().or(z.literal(''));
export const optionalPhoneSchema = z.string().regex(
  /^(\+44|0)[1-9]\d{8,9}$/,
  'Invalid UK phone number'
).optional().or(z.literal(''));

// -----------------------------------------------------------------------------
// Personal Details
// -----------------------------------------------------------------------------
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

export const dateOfBirthSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const d = new Date(date);
    return d <= new Date();
  }, 'Date cannot be in the future');

export const futureDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }, 'Date must be today or in the future');

// -----------------------------------------------------------------------------
// Address
// -----------------------------------------------------------------------------
export const postcodeSchema = z.string()
  .regex(
    /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i,
    'Invalid UK postcode'
  );

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: postcodeSchema,
  country: z.string().default('United Kingdom'),
});

// -----------------------------------------------------------------------------
// Case/Record References
// -----------------------------------------------------------------------------
export const caseReferenceSchema = z.string()
  .regex(/^[A-Z]{2,4}-\d{6,10}$/, 'Invalid case reference format');

export const recordIdSchema = z.string().uuid('Invalid record ID');

export const optionalCaseReferenceSchema = caseReferenceSchema
  .optional()
  .or(z.literal(''));

// -----------------------------------------------------------------------------
// User/Auth Enums
// -----------------------------------------------------------------------------
export const userRoleSchema = z.enum([
  'admin',
  'manager',
  'social_worker',
  'housing_officer',
  'senior_practitioner',
  'team_leader',
]);

export const serviceDomainSchema = z.enum([
  'children',
  'adults',
  'housing',
  'corporate',
]);

export const statusSchema = z.enum(['active', 'inactive', 'pending', 'archived']);

// -----------------------------------------------------------------------------
// Meeting/Recording Types
// -----------------------------------------------------------------------------
export const meetingTypeSchema = z.enum([
  'home_visit',
  'office_meeting',
  'case_conference',
  'review_meeting',
  'strategy_meeting',
  'supervision',
  'other',
]);

export const templateIdSchema = z.string().min(1, 'Template is required');

export const recordingQualitySchema = z.enum(['low', 'medium', 'high']);

// =============================================================================
// RECORDING METADATA SCHEMA
// =============================================================================
export const attendeeSchema = z.object({
  id: z.string().optional(),
  name: nameSchema,
  role: z.string().min(1, 'Role is required'),
  email: optionalEmailSchema,
  isExternal: z.boolean().default(false),
});

export const recordingMetadataSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  templateId: templateIdSchema,
  meetingType: meetingTypeSchema,
  caseReference: optionalCaseReferenceSchema,
  attendees: z.array(attendeeSchema).min(1, 'At least one attendee is required'),
  location: z.string().optional(),
  scheduledDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().default(false),
  quality: recordingQualitySchema.default('medium'),
});

export type RecordingMetadata = z.infer<typeof recordingMetadataSchema>;

// =============================================================================
// MEETING FORMS SCHEMA
// =============================================================================
export const participantSchema = z.object({
  id: z.string().optional(),
  name: nameSchema,
  role: z.string().min(1, 'Role is required'),
  organisation: z.string().optional(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  attendance: z.enum(['present', 'absent', 'apologies']).default('present'),
  notes: z.string().optional(),
});

export const caseInfoSchema = z.object({
  caseReference: caseReferenceSchema,
  clientName: nameSchema,
  dateOfBirth: dateOfBirthSchema.optional(),
  address: addressSchema.optional(),
  primaryWorker: z.string().optional(),
  team: z.string().optional(),
  status: z.enum(['open', 'closed', 'under_review', 'pending']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  safeguardingConcerns: z.boolean().default(false),
  consentObtained: z.boolean().default(false),
});

export const meetingFormSchema = z.object({
  // Meeting details
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: meetingTypeSchema,
  date: z.string().datetime({ offset: true }),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url('Invalid URL').optional(),
  
  // Case information
  caseInfo: caseInfoSchema.optional(),
  
  // Participants
  participants: z.array(participantSchema).min(1, 'At least one participant required'),
  
  // Agenda and notes
  agenda: z.array(z.string()).optional(),
  objectives: z.string().optional(),
  notes: z.string().optional(),
  
  // Recording settings
  recordAudio: z.boolean().default(true),
  transcribe: z.boolean().default(true),
  templateId: templateIdSchema.optional(),
}).refine(
  (data) => !data.isVirtual || data.virtualLink,
  {
    message: 'Virtual link is required for virtual meetings',
    path: ['virtualLink'],
  }
);

export type MeetingForm = z.infer<typeof meetingFormSchema>;
export type CaseInfo = z.infer<typeof caseInfoSchema>;
export type Participant = z.infer<typeof participantSchema>;

// =============================================================================
// USER PROFILE FORMS SCHEMA
// =============================================================================
export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
  digest: z.enum(['daily', 'weekly', 'never']).default('daily'),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
});

export const accessibilityPreferencesSchema = z.object({
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  fontSize: z.enum(['small', 'medium', 'large', 'xl']).default('medium'),
  screenReader: z.boolean().default(false),
});

export const userProfileSchema = z.object({
  // Basic info
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters').optional(),
  
  // Role and organization
  role: userRoleSchema,
  domain: serviceDomainSchema,
  team: z.string().min(2, 'Team name must be at least 2 characters'),
  manager: z.string().optional(),
  
  // Status
  status: statusSchema,
  
  // Preferences
  language: z.string().default('en-GB'),
  timezone: z.string().default('Europe/London'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: notificationPreferencesSchema.optional(),
  accessibility: accessibilityPreferencesSchema.optional(),
  
  // Profile
  avatarUrl: z.string().url('Invalid URL').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type AccessibilityPreferences = z.infer<typeof accessibilityPreferencesSchema>;

// =============================================================================
// ADMIN SETTINGS FORMS SCHEMA
// =============================================================================
export const tenantSettingsSchema = z.object({
  // Basic tenant info
  tenantId: z.string().uuid('Invalid tenant ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  domain: z.string().regex(/^[a-z0-9-]+$/, 'Domain must be lowercase alphanumeric with hyphens'),
  
  // Branding
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  faviconUrl: z.string().url('Invalid URL').optional(),
  
  // Features
  enabledModules: z.array(z.string()),
  enabledDomains: z.array(serviceDomainSchema),
  
  // Settings
  defaultLanguage: z.string().default('en-GB'),
  defaultTimezone: z.string().default('Europe/London'),
  sessionTimeout: z.number().min(5, 'Session timeout must be at least 5 minutes').default(30),
  maxFileSize: z.number().min(1, 'Max file size must be at least 1 MB').default(50),
  retentionDays: z.number().min(30, 'Retention must be at least 30 days').default(365),
});

export const securitySettingsSchema = z.object({
  // Authentication
  requireMfa: z.boolean().default(true),
  allowedAuthProviders: z.array(z.enum(['azure_ad', 'google', 'email'])),
  passwordMinLength: z.number().min(8, 'Minimum password length must be at least 8').default(12),
  passwordRequireSpecial: z.boolean().default(true),
  passwordRequireNumbers: z.boolean().default(true),
  passwordRequireUppercase: z.boolean().default(true),
  passwordExpiryDays: z.number().min(0, 'Password expiry cannot be negative').default(90),
  
  // Session
  maxConcurrentSessions: z.number().min(1).default(3),
  sessionTimeoutMinutes: z.number().min(5).default(30),
  idleTimeoutMinutes: z.number().min(5).default(15),
  
  // IP restrictions
  ipWhitelist: z.array(z.string()).optional(),
  ipBlacklist: z.array(z.string()).optional(),
  
  // Audit
  enableAuditLog: z.boolean().default(true),
  auditRetentionDays: z.number().min(30).default(365),
});

export const integrationSettingsSchema = z.object({
  // Microsoft 365
  enableSharePoint: z.boolean().default(false),
  sharePointSiteUrl: z.string().url('Invalid URL').optional(),
  enableOneDrive: z.boolean().default(false),
  enableTeams: z.boolean().default(false),
  
  // Email
  enableEmailNotifications: z.boolean().default(true),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  fromEmail: emailSchema.optional(),
  fromName: z.string().optional(),
  
  // Webhooks
  webhookUrl: z.string().url('Invalid URL').optional(),
  webhookSecret: z.string().optional(),
  webhookEvents: z.array(z.string()).optional(),
}).refine(
  (data) => !data.enableSharePoint || data.sharePointSiteUrl,
  {
    message: 'SharePoint site URL is required when SharePoint is enabled',
    path: ['sharePointSiteUrl'],
  }
);

export const adminSettingsSchema = z.object({
  tenant: tenantSettingsSchema,
  security: securitySettingsSchema,
  integrations: integrationSettingsSchema,
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type IntegrationSettings = z.infer<typeof integrationSettingsSchema>;
export type AdminSettings = z.infer<typeof adminSettingsSchema>;

// =============================================================================
// EXPORT CONFIGURATION SCHEMA
// =============================================================================
export const exportFormatSchema = z.enum(['pdf', 'docx', 'txt', 'html', 'json']);

export const exportSectionsSchema = z.object({
  header: z.boolean().default(true),
  summary: z.boolean().default(true),
  attendees: z.boolean().default(true),
  transcript: z.boolean().default(false),
  actions: z.boolean().default(true),
  notes: z.boolean().default(true),
  appendices: z.boolean().default(false),
  signatures: z.boolean().default(false),
});

export const exportBrandingSchema = z.object({
  includeHeader: z.boolean().default(true),
  includeLogo: z.boolean().default(true),
  includeFooter: z.boolean().default(true),
  customHeaderText: z.string().optional(),
  customFooterText: z.string().optional(),
  useCouncilBranding: z.boolean().default(true),
});

export const exportSecuritySchema = z.object({
  watermark: z.boolean().default(false),
  watermarkText: z.string().optional(),
  passwordProtect: z.boolean().default(false),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  classification: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
  redactPii: z.boolean().default(false),
  includeMetadata: z.boolean().default(true),
}).refine(
  (data) => !data.passwordProtect || data.password,
  {
    message: 'Password is required when password protection is enabled',
    path: ['password'],
  }
).refine(
  (data) => !data.watermark || data.watermarkText,
  {
    message: 'Watermark text is required when watermark is enabled',
    path: ['watermarkText'],
  }
);

export const exportDestinationSchema = z.object({
  type: z.enum(['download', 'email', 'sharepoint', 'onedrive']),
  emailRecipients: z.array(emailSchema).optional(),
  sharePointPath: z.string().optional(),
  oneDrivePath: z.string().optional(),
}).refine(
  (data) => data.type !== 'email' || (data.emailRecipients && data.emailRecipients.length > 0),
  {
    message: 'At least one email recipient is required',
    path: ['emailRecipients'],
  }
);

export const exportConfigSchema = z.object({
  format: exportFormatSchema,
  filename: z.string().min(1, 'Filename is required'),
  sections: exportSectionsSchema,
  branding: exportBrandingSchema,
  security: exportSecuritySchema,
  destination: exportDestinationSchema,
  dateRange: z.object({
    start: z.string().datetime({ offset: true }).optional(),
    end: z.string().datetime({ offset: true }).optional(),
  }).optional(),
  locale: z.string().default('en-GB'),
  timezone: z.string().default('Europe/London'),
});

export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type ExportSections = z.infer<typeof exportSectionsSchema>;
export type ExportBranding = z.infer<typeof exportBrandingSchema>;
export type ExportSecurity = z.infer<typeof exportSecuritySchema>;
export type ExportDestination = z.infer<typeof exportDestinationSchema>;
export type ExportConfig = z.infer<typeof exportConfigSchema>;

// =============================================================================
// LEGACY/BASIC SCHEMAS (preserved for backwards compatibility)
// =============================================================================
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  relationship: z.string().optional(),
}).refine(
  (data) => data.email || data.phone,
  'Either email or phone is required'
);

export const meetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: meetingTypeSchema,
  date: z.string().datetime({ offset: true }),
  caseReference: caseReferenceSchema.optional(),
  attendees: z.array(z.string()).min(1, 'At least one attendee required'),
  notes: z.string().optional(),
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract all error messages from a ZodError into a flat Record
 */
export function getErrorMessages(error: z.ZodError): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!messages[path]) {
      messages[path] = issue.message;
    }
  }
  return messages;
}

/**
 * Validate a single field against a schema
 */
export function validateField<T>(
  schema: z.ZodType<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0].message };
}

/**
 * Create a partial schema from an existing schema (all fields optional)
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  return schema.partial();
}

/**
 * Merge multiple Zod schemas into one
 */
export function mergeSchemas<
  T extends z.ZodRawShape,
  U extends z.ZodRawShape
>(
  schema1: z.ZodObject<T>,
  schema2: z.ZodObject<U>
){
  return schema1.merge(schema2);
}

/**
 * Create a schema that validates cross-field dependencies
 */
export function withCrossFieldValidation<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  validations: Array<{
    fields: (keyof T)[];
    validate: (data: z.infer<z.ZodObject<T>>) => boolean;
    message: string;
    path?: string[];
  }>
): z.ZodEffects<z.ZodObject<T>> {
  let result: z.ZodEffects<z.ZodObject<T>> | z.ZodObject<T> = schema;
  
  for (const validation of validations) {
    result = (result as z.ZodObject<T>).refine(
      validation.validate,
      {
        message: validation.message,
        path: validation.path ?? [validation.fields[0] as string],
      }
    );
  }
  
  return result as z.ZodEffects<z.ZodObject<T>>;
}

/**
 * Get a list of required field names from a schema
 */
export function getRequiredFields<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): (keyof T)[] {
  const required: (keyof T)[] = [];
  
  for (const [key, value] of Object.entries(schema.shape)) {
    if (!value.isOptional()) {
      required.push(key as keyof T);
    }
  }
  
  return required;
}

/**
 * Extract field metadata from schema for form generation
 */
export function getFieldMetadata<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  fieldName: keyof T
): {
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  enumValues?: string[];
  min?: number;
  max?: number;
} {
  const field = schema.shape[fieldName as string] as z.ZodTypeAny;
  const metadata: ReturnType<typeof getFieldMetadata<T>> = {
    type: 'string',
    required: !field.isOptional(),
  };
  
  // Unwrap optional types
  let unwrapped = field;
  if (unwrapped instanceof z.ZodOptional) {
    unwrapped = unwrapped.unwrap();
  }
  if (unwrapped instanceof z.ZodDefault) {
    metadata.defaultValue = unwrapped._def.defaultValue();
    unwrapped = unwrapped.removeDefault();
  }
  
  // Determine type
  if (unwrapped instanceof z.ZodString) {
    metadata.type = 'string';
  } else if (unwrapped instanceof z.ZodNumber) {
    metadata.type = 'number';
    const checks = unwrapped._def.checks;
    for (const check of checks) {
      if (check.kind === 'min') metadata.min = check.value;
      if (check.kind === 'max') metadata.max = check.value;
    }
  } else if (unwrapped instanceof z.ZodBoolean) {
    metadata.type = 'boolean';
  } else if (unwrapped instanceof z.ZodEnum) {
    metadata.type = 'enum';
    metadata.enumValues = unwrapped._def.values;
  } else if (unwrapped instanceof z.ZodArray) {
    metadata.type = 'array';
  } else if (unwrapped instanceof z.ZodObject) {
    metadata.type = 'object';
  }
  
  // Get description if available
  if (field.description) {
    metadata.description = field.description;
  }
  
  return metadata;
}

export type { z };
export { z as zod };
