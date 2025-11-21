import Dexie, { Table } from 'dexie';

export interface OfflineRecording {
    id?: number;
    blob: Blob;
    fileName: string;
    mimeType: string;
    createdAt: Date;
    duration?: number;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
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
        processing_mode?: 'fast' | 'economy';
        visit_type?: string | null;
        intended_outcomes?: string | null;
        risk_flags?: string | null;
    };
}

export class CareMinutesDB extends Dexie {
    recordings!: Table<OfflineRecording>;

    constructor() {
        super('CareMinutesDB');
        this.version(1).stores({
            recordings: '++id, status, createdAt' // Primary key and indexed props
        });
        this.version(2).stores({
            recordings: '++id, status, createdAt, case_reference'
        }).upgrade((tx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return tx.table('recordings').toCollection().modify((recording: any) => {
                recording.metadata = recording.metadata || {};
                recording.case_reference = recording.case_reference || recording.metadata?.case_reference;
            });
        });
    }
}

export const db = new CareMinutesDB();
