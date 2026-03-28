import { Template } from '@/types/templates'

export type TranscriptionForm = {
  file: Blob | File | null
  template: Template
  agenda?: string
  recordingId?: string
  case_reference: string
  worker_team?: string
  subject_initials?: string
  subject_dob?: string
  processing_mode?: 'fast' | 'economy'
  visit_type?: string
  intended_outcomes?: string
  risk_flags?: string
  meeting_mode?: 'in_person' | 'online'
  consent_ack?: boolean
}
