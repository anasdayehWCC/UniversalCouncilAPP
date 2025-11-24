export interface OfflineRecording {
  id?: number;
  blob?: Blob;
  fileUri?: string;
  fileName: string;
  mimeType: string;
  createdAt: Date;
  duration?: number;
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
  case_reference?: string;
  metadata?: {
    case_reference: string;
    service_domain_id?: string | null;
    template_name?: string | null;
    template_id?: string | null;
    agenda?: string | null;
    notes?: string | null;
    worker_team?: string | null;
    subject_initials?: string | null;
    subject_dob?: string | null;
    fast_path?: boolean;
    processing_mode?: "fast" | "economy";
    visit_type?: string | null;
    intended_outcomes?: string | null;
    risk_flags?: string | null;
  };
}

export type QueueMeta = NonNullable<OfflineRecording["metadata"]>;
