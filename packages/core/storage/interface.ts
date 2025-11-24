import { OfflineRecording } from './types';

export interface StorageAdapter {
    addRecording(recording: OfflineRecording): Promise<number>;
    listRecordings(): Promise<OfflineRecording[]>;
    removeRecording(id: number): Promise<void>;
    updateRecordingStatus(id: number, status: OfflineRecording['status'], error?: string): Promise<void>;
    getRecording(id: number): Promise<OfflineRecording | undefined>;
}
