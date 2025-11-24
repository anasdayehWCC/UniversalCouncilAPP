import Dexie, { Table } from 'dexie';
import { StorageAdapter } from '../interface';
import { OfflineRecording } from '../types';

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

export class DexieStorageAdapter implements StorageAdapter {
    private db: CareMinutesDB;

    constructor(db?: CareMinutesDB) {
        this.db = db || new CareMinutesDB();
    }

    async addRecording(recording: OfflineRecording): Promise<number> {
        return await this.db.recordings.add(recording) as number;
    }

    async listRecordings(): Promise<OfflineRecording[]> {
        return await this.db.recordings.orderBy('createdAt').toArray();
    }

    async removeRecording(id: number): Promise<void> {
        await this.db.recordings.delete(id);
    }

    async updateRecordingStatus(id: number, status: OfflineRecording['status'], error?: string): Promise<void> {
        await this.db.recordings.update(id, { status, error });
    }

    async getRecording(id: number): Promise<OfflineRecording | undefined> {
        return await this.db.recordings.get(id);
    }
}
