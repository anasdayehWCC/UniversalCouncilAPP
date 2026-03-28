// Form validation schemas
export {
  // Contact Information
  emailSchema,
  phoneSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  
  // Personal Details
  nameSchema,
  dateOfBirthSchema,
  futureDateSchema,
  
  // Address
  postcodeSchema,
  addressSchema,
  
  // Case/Record References
  caseReferenceSchema,
  recordIdSchema,
  optionalCaseReferenceSchema,
  
  // User/Auth Enums
  userRoleSchema,
  serviceDomainSchema,
  statusSchema,
  
  // Meeting/Recording Types
  meetingTypeSchema,
  templateIdSchema,
  recordingQualitySchema,
  
  // Recording Metadata
  attendeeSchema,
  recordingMetadataSchema,
  
  // Meeting Forms
  participantSchema,
  caseInfoSchema,
  meetingFormSchema,
  
  // User Profile
  notificationPreferencesSchema,
  accessibilityPreferencesSchema,
  userProfileSchema,
  
  // Admin Settings
  tenantSettingsSchema,
  securitySettingsSchema,
  integrationSettingsSchema,
  adminSettingsSchema,
  
  // Export Configuration
  exportFormatSchema,
  exportSectionsSchema,
  exportBrandingSchema,
  exportSecuritySchema,
  exportDestinationSchema,
  exportConfigSchema,
  
  // Legacy/Basic
  contactSchema,
  meetingSchema,
  
  // Utilities
  getErrorMessages,
  validateField,
  createPartialSchema,
  mergeSchemas,
  withCrossFieldValidation,
  getRequiredFields,
  getFieldMetadata,
  
  // Zod re-export
  zod,
} from './validation';

// Types
export type {
  RecordingMetadata,
  MeetingForm,
  CaseInfo,
  Participant,
  UserProfile,
  NotificationPreferences,
  AccessibilityPreferences,
  TenantSettings,
  SecuritySettings,
  IntegrationSettings,
  AdminSettings,
  ExportFormat,
  ExportSections,
  ExportBranding,
  ExportSecurity,
  ExportDestination,
  ExportConfig,
} from './validation';

// Form hooks
export {
  useFormValidation,
  useFieldValidation,
  useFormSubmission,
  useFormPersistence,
} from './hooks';

// Hook types
export type {
  FieldValidationState,
  FormValidationState,
  UseFormValidationOptions,
  UseFormValidationReturn,
  UseFieldValidationOptions,
  UseFieldValidationReturn,
  UseFormSubmissionOptions,
  UseFormSubmissionReturn,
  UseFormPersistenceOptions,
} from './hooks';
