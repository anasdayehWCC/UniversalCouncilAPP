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
    metadata?: {
        patientId?: string;
        visitType?: string;
        notes?: string;
    };
}

export class CareMinutesDB extends Dexie {
    recordings!: Table<OfflineRecording>;

    constructor() {
        super('CareMinutesDB');
        this.version(1).stores({
            recordings: '++id, status, createdAt' // Primary key and indexed props
        });
    }
}

export const db = new CareMinutesDB();
