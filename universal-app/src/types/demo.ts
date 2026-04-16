import { ServiceDomain, UserRole } from '@/config/domains';

export type MeetingStatus = 'draft' | 'processing' | 'ready' | 'approved' | 'flagged';
export type ProcessingMode = 'fast' | 'economy';

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  assigneeId: string;
  dueDate: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  attendees: string[];
  templateId: string;
  status: MeetingStatus;
  domain: ServiceDomain;
  summary: string;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  tasks: Task[];
  tags: string[];
  riskScore?: 'low' | 'medium' | 'high';
  processingMode?: ProcessingMode;
  uploadedAt?: string;
  submittedById?: string;
  submittedBy?: string;
  submittedAt?: string;
  lastAction?: 'approved' | 'returned';
  lastActionAt?: string;
  lastActionBy?: string;
  consentGiven?: boolean;
  consentTimestamp?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: string[];
  domain: ServiceDomain;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  domain: ServiceDomain;
  team: string;
  functionLabel?: string;
  authorityLabel?: string;
  focusArea?: string;
}

export interface PersonaHistoryEntry {
  id: string;
  switchedAt: string;
}
