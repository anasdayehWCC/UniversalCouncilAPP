/**
 * Minute Generation Types
 * 
 * Types for structured meeting minutes in the social care context.
 * After transcription, AI generates these structured minutes which
 * users review, edit, and approve before they become official case notes.
 */

export type MinuteStatus = 'draft' | 'pending_review' | 'approved' | 'published';

export type SectionType = 
  | 'summary' 
  | 'keyPoints' 
  | 'actionItems' 
  | 'decisions' 
  | 'attendees' 
  | 'risks'
  | 'safeguarding'
  | 'nextSteps';

export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Link to evidence in the original transcript
 */
export interface EvidenceLink {
  id: string;
  /** The quoted text from the transcript */
  text: string;
  /** Start time in transcript (seconds) */
  transcriptStart: number;
  /** End time in transcript (seconds) */
  transcriptEnd: number;
  /** ISO timestamp of when this was spoken */
  timestamp: string;
  /** Speaker who said this */
  speaker?: string;
}

/**
 * Action item extracted or added to minutes
 */
export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  assigneeId?: string;
  dueDate: string;
  priority: ActionPriority;
  status: ActionStatus;
  /** Evidence from transcript supporting this action */
  evidence?: EvidenceLink[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual section within minutes
 */
export interface MinuteSection {
  id: string;
  type: SectionType;
  title: string;
  /** Markdown content */
  content: string;
  /** Order within the minute document */
  order: number;
  /** Evidence links for citations */
  evidence: EvidenceLink[];
  /** Is this section collapsed in the editor */
  isCollapsed?: boolean;
}

/**
 * Attendee record
 */
export interface MinuteAttendee {
  id: string;
  name: string;
  role: string;
  organization?: string;
  email?: string;
  present: boolean;
}

/**
 * Minute document metadata
 */
export interface MinuteMetadata {
  transcriptionId: string;
  templateId?: string;
  templateName?: string;
  caseId?: string;
  caseName?: string;
  domain: string;
  aiModel?: string;
  generatedAt: string;
  lastEditedAt: string;
  lastEditedBy?: string;
  wordCount: number;
  estimatedReadTime: number;
}

/**
 * Version history entry
 */
export interface MinuteVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
  snapshot: string; // JSON snapshot of the minute at this version
}

/**
 * Main Minute document
 */
export interface Minute {
  id: string;
  title: string;
  date: string;
  duration: string;
  status: MinuteStatus;
  sections: MinuteSection[];
  actionItems: ActionItem[];
  attendees: MinuteAttendee[];
  metadata: MinuteMetadata;
  versions?: MinuteVersion[];
  /** Approval workflow */
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  /** If changes were requested */
  changesRequestedAt?: string;
  changesRequestedBy?: string;
  changesRequestedReason?: string;
}

/**
 * Available section types with metadata
 */
export const SECTION_TYPES: Record<SectionType, { label: string; icon: string; description: string }> = {
  summary: {
    label: 'Summary',
    icon: 'FileText',
    description: 'Executive summary of the meeting'
  },
  keyPoints: {
    label: 'Key Points',
    icon: 'ListChecks',
    description: 'Main discussion points and highlights'
  },
  actionItems: {
    label: 'Action Items',
    icon: 'CheckSquare',
    description: 'Tasks and follow-up items'
  },
  decisions: {
    label: 'Decisions',
    icon: 'Gavel',
    description: 'Decisions made during the meeting'
  },
  attendees: {
    label: 'Attendees',
    icon: 'Users',
    description: 'Meeting participants'
  },
  risks: {
    label: 'Risks & Concerns',
    icon: 'AlertTriangle',
    description: 'Identified risks and safeguarding concerns'
  },
  safeguarding: {
    label: 'Safeguarding',
    icon: 'Shield',
    description: 'Safeguarding observations and requirements'
  },
  nextSteps: {
    label: 'Next Steps',
    icon: 'ArrowRight',
    description: 'Planned follow-up activities'
  }
};

/**
 * Status configuration
 */
export const MINUTE_STATUS_CONFIG: Record<MinuteStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  draft: {
    label: 'Draft',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: 'Edit3'
  },
  pending_review: {
    label: 'Pending Review',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'Clock'
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: 'CheckCircle'
  },
  published: {
    label: 'Published',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    icon: 'Globe'
  }
};

/**
 * Priority configuration
 */
export const ACTION_PRIORITY_CONFIG: Record<ActionPriority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  high: {
    label: 'High',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

/**
 * Action status configuration
 */
export const ACTION_STATUS_CONFIG: Record<ActionStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-slate-400',
    bgColor: 'bg-slate-50'
  }
};
