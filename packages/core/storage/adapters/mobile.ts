import * as SQLite from 'expo-sqlite';
import { StorageAdapter } from '../interface';
import { OfflineRecording } from '../types';

export class MobileStorageAdapter implements StorageAdapter {
    private dbPromise: Promise<SQLite.SQLiteDatabase>;

    constructor() {
        this.dbPromise = this.init();
    }

    private async init(): Promise<SQLite.SQLiteDatabase> {
        const db = await SQLite.openDatabaseAsync('careminutes.db');
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS recordings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileUri TEXT,
                fileName TEXT,
                mimeType TEXT,
                createdAt TEXT,
                duration INTEGER,
                status TEXT,
                error TEXT,
                case_reference TEXT,
                metadata TEXT
            );
        `);
        return db;
    }

    async addRecording(recording: OfflineRecording): Promise<number> {
        const db = await this.dbPromise;
        const result = await db.runAsync(
            `INSERT INTO recordings (fileUri, fileName, mimeType, createdAt, duration, status, error, case_reference, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                recording.fileUri || null,
                recording.fileName,
                recording.mimeType,
                recording.createdAt.toISOString(),
                recording.duration || null,
                recording.status,
                recording.error || null,
                recording.case_reference || null,
                JSON.stringify(recording.metadata || {})
            ]
        );
        return result.lastInsertRowId;
    }

    async listRecordings(): Promise<OfflineRecording[]> {
        const db = await this.dbPromise;
        const rows = await db.getAllAsync<any>('SELECT * FROM recordings ORDER BY createdAt DESC');
        return rows.map(row => ({
            id: row.id,
            fileUri: row.fileUri,
            fileName: row.fileName,
            mimeType: row.mimeType,
            createdAt: new Date(row.createdAt),
            duration: row.duration,
            status: row.status as OfflineRecording['status'],
            error: row.error,
            case_reference: row.case_reference,
            metadata: JSON.parse(row.metadata || '{}')
        }));
    }

    async removeRecording(id: number): Promise<void> {
        const db = await this.dbPromise;
        await db.runAsync('DELETE FROM recordings WHERE id = ?', [id]);
    }

    async updateRecordingStatus(id: number, status: OfflineRecording['status'], error?: string): Promise<void> {
        const db = await this.dbPromise;
        await db.runAsync(
            'UPDATE recordings SET status = ?, error = ? WHERE id = ?',
            [status, error || null, id]
        );
    }

    async getRecording(id: number): Promise<OfflineRecording | undefined> {
        const db = await this.dbPromise;
        const row = await db.getFirstAsync<any>('SELECT * FROM recordings WHERE id = ?', [id]);
        if (!row) return undefined;
        return {
            id: row.id,
            fileUri: row.fileUri,
            fileName: row.fileName,
            mimeType: row.mimeType,
            createdAt: new Date(row.createdAt),
            duration: row.duration,
            status: row.status as OfflineRecording['status'],
            error: row.error,
            case_reference: row.case_reference,
            metadata: JSON.parse(row.metadata || '{}')
        };
    }
}
