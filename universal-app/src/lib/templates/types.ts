/**
 * Template Types
 * 
 * Type definitions for meeting minute templates in the Universal Council App.
 * Templates define the structure, sections, and prompts used to generate
 * meeting minutes for different types of social care interactions.
 * 
 * @module lib/templates/types
 */

import { ServiceDomain } from '@/config/domains';

// ============================================================================
// Core Enums
// ============================================================================

/**
 * Categories for organizing templates
 */
export type TemplateCategory = 
  | 'home_visits'
  | 'reviews'
  | 'meetings'
  | 'conferences'
  | 'assessments'
  | 'supervision';

/**
 * Specific meeting types that templates support
 */
export type TemplateMeetingType =
  | 'homeVisit'           // Home visit to family
  | 'TAF'                 // Team Around the Family
  | 'LAC'                 // Looked After Children review
  | 'CP'                  // Child Protection conference
  | 'CIN'                 // Child in Need meeting
  | 'corePlanning'        // Core planning meeting
  | 'casePlanning'        // Case planning session
  | 'supervision'         // Staff supervision
  | 'strategy'            // Strategy meeting
  | 'discharge'           // Hospital discharge planning
  | 'assessment'          // Assessment session
  | 'review'              // General review
  | 'multiAgency'         // Multi-agency meeting
  | 'housingInspection'   // Housing inspection
  | 'tenantMeeting'       // Tenant meeting
  | 'custom';             // Custom template

/**
 * Types of content a section can contain
 */
export type SectionContentType =
  | 'summary'           // Executive summary
  | 'narrative'         // Free-form narrative
  | 'keyPoints'         // Bullet point list
  | 'decisions'         // Decisions made
  | 'actionItems'       // Tasks/actions
  | 'risks'             // Risk assessment
  | 'safeguarding'      // Safeguarding concerns
  | 'attendance'        // Attendance record
  | 'childView'         // Child's voice/views
  | 'familyView'        // Family's perspective
  | 'professionalView'  // Professional observations
  | 'recommendations'   // Recommendations
  | 'nextSteps'         // Next steps
  | 'timeline'          // Timeline of events
  | 'outcomes'          // Outcomes achieved
  | 'custom';           // Custom section type

// ============================================================================
// Section Types
// ============================================================================

/**
 * Individual section within a template
 */
export interface TemplateSection {
  /** Unique identifier for the section */
  id: string;
  /** Content type of the section */
  type: SectionContentType;
  /** Display title for the section */
  title: string;
  /** AI prompt to generate content for this section */
  prompt: string;
  /** Placeholder text shown when empty */
  placeholder?: string;
  /** Whether this section is required */
  required: boolean;
  /** Display order (1-based) */
  order: number;
  /** Icon name (lucide icon) */
  icon?: string;
  /** Max suggested word count */
  maxWords?: number;
  /** Min suggested word count */
  minWords?: number;
  /** Help text for editors */
  helpText?: string;
  /** Default content if AI doesn't generate */
  defaultContent?: string;
  /** Whether section can be deleted by users */
  locked?: boolean;
  /** Visibility conditions */
  visibleWhen?: SectionVisibilityCondition;
}

/**
 * Conditions for section visibility
 */
export interface SectionVisibilityCondition {
  /** Section only visible for certain roles */
  roles?: string[];
  /** Section only visible when feature flag enabled */
  featureFlag?: string;
  /** Section only visible for certain domains */
  domains?: ServiceDomain[];
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Complete template definition
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Long description/guidance */
  longDescription?: string;
  /** Template category */
  category: TemplateCategory;
  /** Specific meeting type */
  meetingType: TemplateMeetingType;
  /** Service domain this template is for */
  domain: ServiceDomain | 'all';
  /** Sections included in this template */
  sections: TemplateSection[];
  /** Icon name (lucide icon) */
  icon: string;
  /** Version for tracking changes */
  version: string;
  /** Whether this is the default for its meeting type */
  isDefault?: boolean;
  /** Whether this is a system template (not user-editable) */
  isSystem?: boolean;
  /** Tags for filtering/search */
  tags?: string[];
  /** Color theme for visual distinction */
  color?: string;
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Created by user ID */
  createdBy?: string;
  /** Last updated by user ID */
  updatedBy?: string;
  /** Usage count */
  usageCount?: number;
  /** Average rating */
  rating?: number;
  /** Estimated duration in minutes */
  estimatedDuration?: number;
}

/**
 * User-specific template preferences
 */
export interface TemplatePreference {
  /** User ID */
  userId: string;
  /** Template ID */
  templateId: string;
  /** Is this a favorite */
  isFavorite: boolean;
  /** Last used timestamp */
  lastUsed?: string;
  /** Usage count for this user */
  usageCount: number;
  /** Custom section order overrides */
  sectionOrder?: string[];
  /** Hidden sections */
  hiddenSections?: string[];
}

/**
 * Template with user-specific data merged in
 */
export interface TemplateWithPreferences extends Template {
  /** User's favorite status */
  isFavorite: boolean;
  /** User's last used date */
  lastUsed?: string;
  /** User's usage count */
  userUsageCount: number;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Request to create a new template
 */
export interface CreateTemplateRequest {
  name: string;
  description: string;
  longDescription?: string;
  category: TemplateCategory;
  meetingType: TemplateMeetingType;
  domain: ServiceDomain | 'all';
  sections: Omit<TemplateSection, 'id'>[];
  icon?: string;
  tags?: string[];
  color?: string;
  estimatedDuration?: number;
}

/**
 * Request to update an existing template
 */
export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  longDescription?: string;
  category?: TemplateCategory;
  meetingType?: TemplateMeetingType;
  domain?: ServiceDomain | 'all';
  sections?: TemplateSection[];
  icon?: string;
  tags?: string[];
  color?: string;
  isDefault?: boolean;
  estimatedDuration?: number;
}

/**
 * Query parameters for filtering templates
 */
export interface TemplateFilters {
  domain?: ServiceDomain | 'all';
  category?: TemplateCategory;
  meetingType?: TemplateMeetingType;
  search?: string;
  tags?: string[];
  favoritesOnly?: boolean;
  includeSystem?: boolean;
}

/**
 * Response from template list endpoint
 */
export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Category metadata for UI display
 */
export interface CategoryMeta {
  id: TemplateCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Meeting type metadata for UI display
 */
export interface MeetingTypeMeta {
  id: TemplateMeetingType;
  label: string;
  shortLabel: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  domains: (ServiceDomain | 'all')[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Category metadata lookup
 */
export const CATEGORY_META: Record<TemplateCategory, CategoryMeta> = {
  home_visits: {
    id: 'home_visits',
    label: 'Home Visits',
    description: 'Templates for home visit documentation',
    icon: 'Home',
    color: '#22c55e',
  },
  reviews: {
    id: 'reviews',
    label: 'Reviews',
    description: 'Periodic review meeting templates',
    icon: 'ClipboardCheck',
    color: '#3b82f6',
  },
  meetings: {
    id: 'meetings',
    label: 'Meetings',
    description: 'General meeting templates',
    icon: 'Users',
    color: '#8b5cf6',
  },
  conferences: {
    id: 'conferences',
    label: 'Conferences',
    description: 'Formal conference templates',
    icon: 'Building2',
    color: '#ef4444',
  },
  assessments: {
    id: 'assessments',
    label: 'Assessments',
    description: 'Assessment session templates',
    icon: 'FileSearch',
    color: '#f59e0b',
  },
  supervision: {
    id: 'supervision',
    label: 'Supervision',
    description: 'Staff supervision templates',
    icon: 'GraduationCap',
    color: '#06b6d4',
  },
};

/**
 * Meeting type metadata lookup
 */
export const MEETING_TYPE_META: Record<TemplateMeetingType, MeetingTypeMeta> = {
  homeVisit: {
    id: 'homeVisit',
    label: 'Home Visit',
    shortLabel: 'Visit',
    description: 'Documentation for home visits to families',
    category: 'home_visits',
    icon: 'Home',
    domains: ['children', 'adults'],
  },
  TAF: {
    id: 'TAF',
    label: 'Team Around the Family',
    shortLabel: 'TAF',
    description: 'Multi-agency TAF meeting documentation',
    category: 'meetings',
    icon: 'Users',
    domains: ['children'],
  },
  LAC: {
    id: 'LAC',
    label: 'LAC Review',
    shortLabel: 'LAC',
    description: 'Looked After Children statutory reviews',
    category: 'reviews',
    icon: 'ClipboardCheck',
    domains: ['children'],
  },
  CP: {
    id: 'CP',
    label: 'Child Protection Conference',
    shortLabel: 'CP',
    description: 'Initial or review child protection conferences',
    category: 'conferences',
    icon: 'Shield',
    domains: ['children'],
  },
  CIN: {
    id: 'CIN',
    label: 'Child in Need Meeting',
    shortLabel: 'CIN',
    description: 'Child in Need planning meetings',
    category: 'meetings',
    icon: 'Heart',
    domains: ['children'],
  },
  corePlanning: {
    id: 'corePlanning',
    label: 'Core Planning Meeting',
    shortLabel: 'Core',
    description: 'Core group planning sessions',
    category: 'meetings',
    icon: 'Target',
    domains: ['children'],
  },
  casePlanning: {
    id: 'casePlanning',
    label: 'Case Planning',
    shortLabel: 'Case',
    description: 'General case planning sessions',
    category: 'meetings',
    icon: 'Briefcase',
    domains: ['children', 'adults'],
  },
  supervision: {
    id: 'supervision',
    label: 'Supervision Session',
    shortLabel: 'Supervision',
    description: 'Staff supervision documentation',
    category: 'supervision',
    icon: 'GraduationCap',
    domains: ['all'],
  },
  strategy: {
    id: 'strategy',
    label: 'Strategy Meeting',
    shortLabel: 'Strategy',
    description: 'Multi-agency strategy discussions',
    category: 'meetings',
    icon: 'Compass',
    domains: ['children', 'adults'],
  },
  discharge: {
    id: 'discharge',
    label: 'Discharge Planning',
    shortLabel: 'Discharge',
    description: 'Hospital discharge planning meetings',
    category: 'meetings',
    icon: 'LogOut',
    domains: ['adults'],
  },
  assessment: {
    id: 'assessment',
    label: 'Assessment',
    shortLabel: 'Assessment',
    description: 'Formal assessment sessions',
    category: 'assessments',
    icon: 'FileSearch',
    domains: ['children', 'adults'],
  },
  review: {
    id: 'review',
    label: 'General Review',
    shortLabel: 'Review',
    description: 'General review meetings',
    category: 'reviews',
    icon: 'RefreshCw',
    domains: ['all'],
  },
  multiAgency: {
    id: 'multiAgency',
    label: 'Multi-Agency Meeting',
    shortLabel: 'Multi-Agency',
    description: 'Cross-agency coordination meetings',
    category: 'meetings',
    icon: 'Network',
    domains: ['all'],
  },
  housingInspection: {
    id: 'housingInspection',
    label: 'Housing Inspection',
    shortLabel: 'Inspection',
    description: 'Property inspection documentation',
    category: 'assessments',
    icon: 'Building',
    domains: ['housing'],
  },
  tenantMeeting: {
    id: 'tenantMeeting',
    label: 'Tenant Meeting',
    shortLabel: 'Tenant',
    description: 'Tenant engagement meetings',
    category: 'meetings',
    icon: 'UserCircle',
    domains: ['housing'],
  },
  custom: {
    id: 'custom',
    label: 'Custom Template',
    shortLabel: 'Custom',
    description: 'User-defined custom template',
    category: 'meetings',
    icon: 'Pencil',
    domains: ['all'],
  },
};

/**
 * Section type metadata
 */
export const SECTION_TYPE_META: Record<SectionContentType, { label: string; icon: string; description: string }> = {
  summary: { label: 'Summary', icon: 'FileText', description: 'Executive summary of the meeting' },
  narrative: { label: 'Narrative', icon: 'AlignLeft', description: 'Detailed narrative account' },
  keyPoints: { label: 'Key Points', icon: 'List', description: 'Important points discussed' },
  decisions: { label: 'Decisions', icon: 'CheckSquare', description: 'Decisions made during meeting' },
  actionItems: { label: 'Action Items', icon: 'ListTodo', description: 'Tasks and actions assigned' },
  risks: { label: 'Risks', icon: 'AlertTriangle', description: 'Risk assessment and concerns' },
  safeguarding: { label: 'Safeguarding', icon: 'Shield', description: 'Safeguarding observations' },
  attendance: { label: 'Attendance', icon: 'Users', description: 'Meeting attendees' },
  childView: { label: 'Child\'s Voice', icon: 'MessageCircle', description: 'Child\'s views and wishes' },
  familyView: { label: 'Family Views', icon: 'Home', description: 'Family perspective' },
  professionalView: { label: 'Professional View', icon: 'Briefcase', description: 'Professional observations' },
  recommendations: { label: 'Recommendations', icon: 'ThumbsUp', description: 'Formal recommendations' },
  nextSteps: { label: 'Next Steps', icon: 'ArrowRight', description: 'Planned next steps' },
  timeline: { label: 'Timeline', icon: 'Clock', description: 'Timeline of events' },
  outcomes: { label: 'Outcomes', icon: 'Trophy', description: 'Outcomes achieved' },
  custom: { label: 'Custom', icon: 'Edit', description: 'Custom section content' },
};
