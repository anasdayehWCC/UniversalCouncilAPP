/**
 * Storage Adapter for Universal App
 *
 * Provides IndexedDB storage via Dexie for offline-first operations.
 * Supports queuing recordings, transcription requests, and sync operations.
 *
 * @module lib/storage-adapter
 */

import Dexie, { type Table } from 'dexie';

// ============================================================================
// Types
// ============================================================================

/**
 * Status of an offline recording in the queue
 */
export type RecordingStatus = 'pending' | 'syncing' | 'synced' | 'failed';

/**
 * Metadata associated with an offline recording
 */
export interface QueueMeta {
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
  meeting_mode?: 'in_person' | 'online';
  visit_type?: string | null;
  intended_outcomes?: string | null;
  risk_flags?: string | null;
  consent_ack?: boolean;
}

/**
 * A recording stored offline for later sync
 */
export interface OfflineRecording {
  id?: number;
  blob?: Blob;
  fileUri?: string;
  fileName: string;
  mimeType: string;
  createdAt: Date;
  duration?: number;
  status: RecordingStatus;
  error?: string;
  case_reference?: string;
  metadata?: QueueMeta;
  /** Number of sync retry attempts */
  retryCount?: number;
  /** Timestamp of last sync attempt */
  lastAttemptAt?: Date;
}

/**
 * Generic sync operation for non-recording data
 */
export interface SyncOperation {
  id?: number;
  type: 'transcription_request' | 'meeting_update' | 'template_sync' | 'custom';
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  createdAt: Date;
  retryCount?: number;
  lastAttemptAt?: Date;
  /** Priority: higher numbers sync first */
  priority?: number;
}

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Abstract interface for storage operations
 * Allows swapping implementations (Dexie, React Native AsyncStorage, etc.)
 */
export interface StorageAdapter {
  // Recording operations
  addRecording(recording: OfflineRecording): Promise<number>;
  getRecording(id: number): Promise<OfflineRecording | undefined>;
  listRecordings(): Promise<OfflineRecording[]>;
  listRecordingsByStatus(status: RecordingStatus): Promise<OfflineRecording[]>;
  updateRecordingStatus(
    id: number,
    status: RecordingStatus,
    error?: string
  ): Promise<void>;
  removeRecording(id: number): Promise<void>;
  clearAllRecordings(): Promise<void>;

  // Generic sync operations
  addSyncOperation(operation: Omit<SyncOperation, 'id'>): Promise<number>;
  getSyncOperation(id: number): Promise<SyncOperation | undefined>;
  listSyncOperations(): Promise<SyncOperation[]>;
  listPendingSyncOperations(): Promise<SyncOperation[]>;
  updateSyncOperationStatus(
    id: number,
    status: SyncOperation['status'],
    error?: string
  ): Promise<void>;
  removeSyncOperation(id: number): Promise<void>;

  // Stats
  getPendingCount(): Promise<number>;
  getFailedCount(): Promise<number>;
}

// ============================================================================
// Dexie Database
// ============================================================================

/**
 * Universal App IndexedDB database using Dexie
 */
class UniversalAppDB extends Dexie {
  recordings!: Table<OfflineRecording>;
  syncOperations!: Table<SyncOperation>;

  constructor() {
    super('UniversalAppDB');

    // Version 1: Initial schema
    this.version(1).stores({
      recordings: '++id, status, createdAt, case_reference',
      syncOperations: '++id, type, status, createdAt, priority',
    });

    // Version 2: Add retry tracking
    this.version(2)
      .stores({
        recordings: '++id, status, createdAt, case_reference, retryCount',
        syncOperations: '++id, type, status, createdAt, priority, retryCount',
      })
      .upgrade((tx) => {
        return Promise.all([
          tx
            .table('recordings')
            .toCollection()
            .modify((rec: OfflineRecording) => {
              rec.retryCount = rec.retryCount ?? 0;
            }),
          tx
            .table('syncOperations')
            .toCollection()
            .modify((op: SyncOperation) => {
              op.retryCount = op.retryCount ?? 0;
            }),
        ]);
      });
  }
}

// ============================================================================
// Dexie Storage Adapter Implementation
// ============================================================================

/**
 * Dexie-based storage adapter for web browsers
 */
export class DexieStorageAdapter implements StorageAdapter {
  private db: UniversalAppDB;

  constructor(db?: UniversalAppDB) {
    this.db = db ?? new UniversalAppDB();
  }

  // ---------------------------------------------------------------------------
  // Recording Operations
  // ---------------------------------------------------------------------------

  async addRecording(recording: OfflineRecording): Promise<number> {
    const rec = {
      ...recording,
      createdAt: recording.createdAt ?? new Date(),
      retryCount: recording.retryCount ?? 0,
    };
    return (await this.db.recordings.add(rec)) as number;
  }

  async getRecording(id: number): Promise<OfflineRecording | undefined> {
    return this.db.recordings.get(id);
  }

  async listRecordings(): Promise<OfflineRecording[]> {
    return this.db.recordings.orderBy('createdAt').toArray();
  }

  async listRecordingsByStatus(status: RecordingStatus): Promise<OfflineRecording[]> {
    return this.db.recordings.where('status').equals(status).toArray();
  }

  async updateRecordingStatus(
    id: number,
    status: RecordingStatus,
    error?: string
  ): Promise<void> {
    await this.db.recordings.update(id, {
      status,
      error,
      lastAttemptAt: new Date(),
      ...(status === 'failed' && { retryCount: (await this.getRecording(id))?.retryCount ?? 0 + 1 }),
    });
  }

  async removeRecording(id: number): Promise<void> {
    await this.db.recordings.delete(id);
  }

  async clearAllRecordings(): Promise<void> {
    await this.db.recordings.clear();
  }

  // ---------------------------------------------------------------------------
  // Sync Operations
  // ---------------------------------------------------------------------------

  async addSyncOperation(operation: Omit<SyncOperation, 'id'>): Promise<number> {
    const op = {
      ...operation,
      createdAt: operation.createdAt ?? new Date(),
      retryCount: operation.retryCount ?? 0,
      priority: operation.priority ?? 0,
    };
    return (await this.db.syncOperations.add(op)) as number;
  }

  async getSyncOperation(id: number): Promise<SyncOperation | undefined> {
    return this.db.syncOperations.get(id);
  }

  async listSyncOperations(): Promise<SyncOperation[]> {
    return this.db.syncOperations.orderBy('createdAt').toArray();
  }

  async listPendingSyncOperations(): Promise<SyncOperation[]> {
    return this.db.syncOperations
      .where('status')
      .equals('pending')
      .sortBy('priority')
      .then((ops) => ops.reverse()); // Higher priority first
  }

  async updateSyncOperationStatus(
    id: number,
    status: SyncOperation['status'],
    error?: string
  ): Promise<void> {
    const op = await this.getSyncOperation(id);
    await this.db.syncOperations.update(id, {
      status,
      error,
      lastAttemptAt: new Date(),
      ...(status === 'failed' && { retryCount: (op?.retryCount ?? 0) + 1 }),
    });
  }

  async removeSyncOperation(id: number): Promise<void> {
    await this.db.syncOperations.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async getPendingCount(): Promise<number> {
    const [pendingRecordings, pendingSyncOps] = await Promise.all([
      this.db.recordings.where('status').equals('pending').count(),
      this.db.syncOperations.where('status').equals('pending').count(),
    ]);
    return pendingRecordings + pendingSyncOps;
  }

  async getFailedCount(): Promise<number> {
    const [failedRecordings, failedSyncOps] = await Promise.all([
      this.db.recordings.where('status').equals('failed').count(),
      this.db.syncOperations.where('status').equals('failed').count(),
    ]);
    return failedRecordings + failedSyncOps;
  }
}

// ============================================================================
// Singleton Storage Instance
// ============================================================================

let storageInstance: StorageAdapter | null = null;

/**
 * Set a custom storage adapter (useful for testing or React Native)
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  storageInstance = adapter;
}

/**
 * Get the storage adapter instance
 * Creates a DexieStorageAdapter if none is set
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    if (typeof window === 'undefined') {
      throw new Error(
        'Storage adapter not available in server context. ' +
          'Ensure offline queue operations are client-side only.'
      );
    }
    storageInstance = new DexieStorageAdapter();
  }
  return storageInstance;
}

/**
 * Get the raw Dexie database instance for advanced queries
 * Used by useLiveQuery hooks for reactive data
 */
export function getDatabase(): UniversalAppDB | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return new UniversalAppDB();
}

// Export the DB class for direct use in hooks
export { UniversalAppDB };
