/**
 * Offline Queue Management
 *
 * Handles queuing, syncing, and retry logic for offline recordings
 * and transcription requests. Designed for offline-first PWA usage.
 *
 * @module lib/offline-queue
 */

import {
  getStorage,
  type OfflineRecording,
  type QueueMeta,
  type RecordingStatus,
  type SyncOperation,
} from './storage-adapter';

// Re-export types used by consumers
export type { OfflineRecording, QueueMeta } from './storage-adapter';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_HOST ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080';

/** Maximum number of retry attempts before giving up */
const MAX_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff (ms) */
const BACKOFF_BASE_MS = 500;

/** LocalStorage key for last sync timestamp */
const LAST_SYNC_KEY = 'offlineQueue:lastSync';

// ============================================================================
// Queue Operations
// ============================================================================

/**
 * Queue a recording for later sync when offline
 */
export async function queueRecording(
  blob: Blob,
  meta: QueueMeta,
  fileName?: string
): Promise<number> {
  const derivedName =
    fileName ||
    (blob instanceof File ? blob.name : null) ||
    (meta.template_name ? `${meta.template_name}.webm` : 'recording.webm');

  const record: OfflineRecording = {
    blob,
    fileName: derivedName,
    mimeType: blob.type || 'audio/webm',
    createdAt: new Date(),
    status: 'pending',
    case_reference: meta.case_reference,
    metadata: meta,
    retryCount: 0,
  };

  return getStorage().addRecording(record);
}

/**
 * Queue a generic sync operation (e.g., meeting update, template sync)
 */
export async function queueSyncOperation(
  type: SyncOperation['type'],
  payload: Record<string, unknown>,
  priority?: number
): Promise<number> {
  return getStorage().addSyncOperation({
    type,
    payload,
    status: 'pending',
    createdAt: new Date(),
    retryCount: 0,
    priority,
  });
}

/**
 * List all queued recordings
 */
export async function listQueued(): Promise<OfflineRecording[]> {
  return getStorage().listRecordings();
}

/**
 * List recordings by status
 */
export async function listQueuedByStatus(
  status: RecordingStatus
): Promise<OfflineRecording[]> {
  return getStorage().listRecordingsByStatus(status);
}

/**
 * Remove a recording from the queue
 */
export async function clearQueued(id: number): Promise<void> {
  return getStorage().removeRecording(id);
}

/**
 * Update recording status
 */
export async function markStatus(
  id: number,
  status: RecordingStatus,
  error?: string
): Promise<void> {
  return getStorage().updateRecordingStatus(id, status, error);
}

// ============================================================================
// Sync Logic
// ============================================================================

/**
 * Exponential backoff retry wrapper
 */
async function withBackoff<T>(
  fn: () => Promise<T>,
  attempts = MAX_RETRY_ATTEMPTS,
  base = BACKOFF_BASE_MS
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = base * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Upload blob to a pre-signed URL
 */
async function uploadBlob(uploadUrl: string, blob: Blob): Promise<void> {
  const headers: Record<string, string> = {};

  // Azure Blob Storage requires x-ms-blob-type header
  if (uploadUrl.includes('blob.core.windows.net')) {
    headers['x-ms-blob-type'] = 'BlockBlob';
  }

  if (blob.type) {
    headers['Content-Type'] = blob.type;
  }

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

/**
 * Extract file extension from filename
 */
function getExtension(fileName: string): string {
  if (!fileName.includes('.')) return 'webm';
  return fileName.split('.').pop() || 'webm';
}

/**
 * Sync a single offline recording to the backend
 */
export async function syncQueuedRecording(
  recording: OfflineRecording,
  token?: string | null
): Promise<{ id: string; transcription_id?: string }> {
  if (!recording.metadata) {
    throw new Error('Missing metadata on offline recording');
  }

  if (!recording.blob) {
    throw new Error('Missing blob content for offline recording');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Step 1: Create recording entry and get upload URL
  const recordingResp = await withBackoff(async () => {
    const resp = await fetch(`${API_BASE}/recordings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        file_extension: getExtension(recording.fileName),
        captured_offline: true,
      }),
    });

    if (!resp.ok) {
      throw new Error(`Failed to create recording: ${resp.statusText}`);
    }

    return resp;
  });

  const recordingJson = await recordingResp.json();

  // Step 2: Upload the audio blob
  await withBackoff(() => uploadBlob(recordingJson.upload_url, recording.blob!));

  // Step 3: Create transcription request
  const transcriptionBody = {
    recording_id: recordingJson.id,
    template_name: recording.metadata.template_name || 'General',
    template_id: recording.metadata.template_id,
    agenda: recording.metadata.agenda,
    case_reference: recording.metadata.case_reference,
    worker_team: recording.metadata.worker_team,
    subject_initials: recording.metadata.subject_initials,
    subject_dob: recording.metadata.subject_dob,
    processing_mode: recording.metadata.processing_mode || 'fast',
    visit_type: recording.metadata.visit_type,
    intended_outcomes: recording.metadata.intended_outcomes,
    risk_flags: recording.metadata.risk_flags,
  };

  const transcriptionResp = await withBackoff(async () => {
    const resp = await fetch(`${API_BASE}/transcriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transcriptionBody),
    });

    if (!resp.ok) {
      throw new Error(`Failed to create transcription: ${resp.statusText}`);
    }

    return resp;
  });

  return transcriptionResp.json();
}

/**
 * Sync all pending recordings
 * Returns summary of sync results
 */
export async function syncAllQueued(token?: string | null): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ id: number; error: string }>;
}> {
  const storage = getStorage();
  const all = await storage.listRecordings();
  const queued = all.filter(
    (r) => r.status === 'pending' || (r.status === 'failed' && (r.retryCount ?? 0) < MAX_RETRY_ATTEMPTS)
  );

  const results = {
    synced: 0,
    failed: 0,
    errors: [] as Array<{ id: number; error: string }>,
  };

  for (const recording of queued) {
    if (!recording.id) continue;

    try {
      await markStatus(recording.id, 'syncing');
      await syncQueuedRecording(recording, token);
      await clearQueued(recording.id);
      results.synced++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await markStatus(recording.id, 'failed', message);
      results.failed++;
      results.errors.push({ id: recording.id, error: message });
    }
  }

  // Record sync timestamp
  try {
    recordLastSync();
  } catch (err) {
    console.warn('Unable to record last sync time', err);
  }

  return results;
}

/**
 * Retry failed recordings (up to max attempts)
 */
export async function retryFailed(token?: string | null): Promise<{
  retried: number;
  stillFailed: number;
}> {
  const storage = getStorage();
  const failed = await storage.listRecordingsByStatus('failed');
  const retriable = failed.filter((r) => (r.retryCount ?? 0) < MAX_RETRY_ATTEMPTS);

  let retried = 0;
  let stillFailed = 0;

  for (const recording of retriable) {
    if (!recording.id) continue;

    try {
      await markStatus(recording.id, 'syncing');
      await syncQueuedRecording(recording, token);
      await clearQueued(recording.id);
      retried++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await markStatus(recording.id, 'failed', message);
      stillFailed++;
    }
  }

  return { retried, stillFailed };
}

// ============================================================================
// Sync Timestamp Tracking
// ============================================================================

/**
 * Record the current time as the last successful sync
 */
export function recordLastSync(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Unable to persist last sync', err);
  }
}

/**
 * Get the timestamp of the last successful sync
 */
export function getLastSync(): Date | null {
  if (typeof localStorage === 'undefined') return null;

  const value = localStorage.getItem(LAST_SYNC_KEY);
  if (!value) return null;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get human-readable time since last sync
 */
export function getTimeSinceLastSync(): string | null {
  const lastSync = getLastSync();
  if (!lastSync) return null;

  const diffMs = Date.now() - lastSync.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ============================================================================
// Queue Stats
// ============================================================================

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  total: number;
  failedPermanently: number;
}> {
  const all = await listQueued();

  const pending = all.filter((r) => r.status === 'pending').length;
  const syncing = all.filter((r) => r.status === 'syncing').length;
  const failed = all.filter((r) => r.status === 'failed').length;
  const failedPermanently = all.filter(
    (r) => r.status === 'failed' && (r.retryCount ?? 0) >= MAX_RETRY_ATTEMPTS
  ).length;

  return {
    pending,
    syncing,
    failed,
    total: all.length,
    failedPermanently,
  };
}

/**
 * Check if there are items waiting to sync
 */
export async function hasPendingItems(): Promise<boolean> {
  const storage = getStorage();
  const count = await storage.getPendingCount();
  return count > 0;
}

/**
 * Clear all synced recordings (cleanup)
 */
export async function clearSynced(): Promise<number> {
  const storage = getStorage();
  const all = await storage.listRecordings();
  const synced = all.filter((r) => r.status === 'synced');

  for (const recording of synced) {
    if (recording.id) {
      await storage.removeRecording(recording.id);
    }
  }

  return synced.length;
}
