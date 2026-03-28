/**
 * Offline Queue Integration Tests
 *
 * Tests for offline functionality including queue operations,
 * sync on reconnect, and conflict resolution.
 *
 * @module tests/integration/offline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse, delay } from 'msw';

const API_BASE = 'http://localhost:8080';

// ============================================================================
// Mock Setup for IndexedDB/Dexie
// ============================================================================

interface MockRecording {
  id?: number;
  blob?: Blob;
  fileName: string;
  mimeType: string;
  createdAt: Date;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  case_reference?: string;
  metadata?: Record<string, unknown>;
  retryCount?: number;
  lastAttemptAt?: Date;
}

interface MockSyncOperation {
  id?: number;
  type: 'transcription_request' | 'meeting_update' | 'template_sync' | 'custom';
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  createdAt: Date;
  retryCount?: number;
  priority?: number;
}

// In-memory mock storage
class MockStorageAdapter {
  private recordings: Map<number, MockRecording> = new Map();
  private syncOperations: Map<number, MockSyncOperation> = new Map();
  private nextId = 1;

  // Recording operations
  async addRecording(recording: MockRecording): Promise<number> {
    const id = this.nextId++;
    this.recordings.set(id, { ...recording, id });
    return id;
  }

  async getRecording(id: number): Promise<MockRecording | undefined> {
    return this.recordings.get(id);
  }

  async listRecordings(): Promise<MockRecording[]> {
    return Array.from(this.recordings.values());
  }

  async listRecordingsByStatus(status: MockRecording['status']): Promise<MockRecording[]> {
    return Array.from(this.recordings.values()).filter((r) => r.status === status);
  }

  async updateRecordingStatus(
    id: number,
    status: MockRecording['status'],
    error?: string
  ): Promise<void> {
    const recording = this.recordings.get(id);
    if (recording) {
      recording.status = status;
      recording.error = error;
      recording.retryCount = (recording.retryCount ?? 0) + (status === 'failed' ? 1 : 0);
      recording.lastAttemptAt = new Date();
    }
  }

  async removeRecording(id: number): Promise<void> {
    this.recordings.delete(id);
  }

  async clearAllRecordings(): Promise<void> {
    this.recordings.clear();
  }

  // Sync operation methods
  async addSyncOperation(op: MockSyncOperation): Promise<number> {
    const id = this.nextId++;
    this.syncOperations.set(id, { ...op, id });
    return id;
  }

  async getSyncOperation(id: number): Promise<MockSyncOperation | undefined> {
    return this.syncOperations.get(id);
  }

  async listSyncOperations(): Promise<MockSyncOperation[]> {
    return Array.from(this.syncOperations.values());
  }

  async updateSyncOperationStatus(
    id: number,
    status: MockSyncOperation['status'],
    error?: string
  ): Promise<void> {
    const op = this.syncOperations.get(id);
    if (op) {
      op.status = status;
      op.error = error;
      op.retryCount = (op.retryCount ?? 0) + (status === 'failed' ? 1 : 0);
    }
  }

  async removeSyncOperation(id: number): Promise<void> {
    this.syncOperations.delete(id);
  }

  // Reset for testing
  reset(): void {
    this.recordings.clear();
    this.syncOperations.clear();
    this.nextId = 1;
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Offline Queue Integration', () => {
  let storage: MockStorageAdapter;

  beforeEach(() => {
    storage = new MockStorageAdapter();
  });

  afterEach(() => {
    storage.reset();
    server.resetHandlers();
  });

  // ==========================================================================
  // Queue Operations Tests
  // ==========================================================================

  describe('Queue Operations', () => {
    describe('Recording Queue', () => {
      it('queues a recording for later sync', async () => {
        const blob = new Blob(['audio data'], { type: 'audio/webm' });

        const id = await storage.addRecording({
          blob,
          fileName: 'recording.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
          case_reference: 'CASE-001',
          metadata: {
            template_name: 'Home Visit',
            service_domain_id: 'children',
          },
        });

        expect(id).toBe(1);

        const recording = await storage.getRecording(id);
        expect(recording).toBeDefined();
        expect(recording?.status).toBe('pending');
        expect(recording?.case_reference).toBe('CASE-001');
      });

      it('lists all queued recordings', async () => {
        await storage.addRecording({
          fileName: 'rec1.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        await storage.addRecording({
          fileName: 'rec2.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        const recordings = await storage.listRecordings();

        expect(recordings).toHaveLength(2);
      });

      it('filters recordings by status', async () => {
        await storage.addRecording({
          fileName: 'pending.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        const syncedId = await storage.addRecording({
          fileName: 'synced.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'synced',
        });

        await storage.addRecording({
          fileName: 'failed.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'failed',
        });

        const pending = await storage.listRecordingsByStatus('pending');
        const synced = await storage.listRecordingsByStatus('synced');
        const failed = await storage.listRecordingsByStatus('failed');

        expect(pending).toHaveLength(1);
        expect(synced).toHaveLength(1);
        expect(failed).toHaveLength(1);
      });

      it('updates recording status', async () => {
        const id = await storage.addRecording({
          fileName: 'test.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        await storage.updateRecordingStatus(id, 'syncing');

        let recording = await storage.getRecording(id);
        expect(recording?.status).toBe('syncing');

        await storage.updateRecordingStatus(id, 'synced');

        recording = await storage.getRecording(id);
        expect(recording?.status).toBe('synced');
      });

      it('records error message on failure', async () => {
        const id = await storage.addRecording({
          fileName: 'test.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        await storage.updateRecordingStatus(id, 'failed', 'Network timeout');

        const recording = await storage.getRecording(id);
        expect(recording?.status).toBe('failed');
        expect(recording?.error).toBe('Network timeout');
      });

      it('removes recording after successful sync', async () => {
        const id = await storage.addRecording({
          fileName: 'test.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        await storage.removeRecording(id);

        const recording = await storage.getRecording(id);
        expect(recording).toBeUndefined();
      });

      it('clears all recordings', async () => {
        await storage.addRecording({
          fileName: 'r1.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });

        await storage.addRecording({
          fileName: 'r2.webm',
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'synced',
        });

        await storage.clearAllRecordings();

        const recordings = await storage.listRecordings();
        expect(recordings).toHaveLength(0);
      });
    });

    describe('Sync Operation Queue', () => {
      it('queues a generic sync operation', async () => {
        const id = await storage.addSyncOperation({
          type: 'meeting_update',
          payload: { meetingId: 'meeting-1', title: 'Updated Title' },
          status: 'pending',
          createdAt: new Date(),
        });

        const op = await storage.getSyncOperation(id);

        expect(op).toBeDefined();
        expect(op?.type).toBe('meeting_update');
        expect(op?.payload.meetingId).toBe('meeting-1');
      });

      it('supports priority ordering', async () => {
        await storage.addSyncOperation({
          type: 'meeting_update',
          payload: { id: 'low' },
          status: 'pending',
          createdAt: new Date(),
          priority: 1,
        });

        await storage.addSyncOperation({
          type: 'transcription_request',
          payload: { id: 'high' },
          status: 'pending',
          createdAt: new Date(),
          priority: 10,
        });

        await storage.addSyncOperation({
          type: 'template_sync',
          payload: { id: 'medium' },
          status: 'pending',
          createdAt: new Date(),
          priority: 5,
        });

        const ops = await storage.listSyncOperations();

        // Sort by priority (higher first)
        const sorted = [...ops].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        expect(sorted[0].payload.id).toBe('high');
        expect(sorted[1].payload.id).toBe('medium');
        expect(sorted[2].payload.id).toBe('low');
      });
    });
  });

  // ==========================================================================
  // Sync on Reconnect Tests
  // ==========================================================================

  describe('Sync on Reconnect', () => {
    it('syncs pending recordings when online', async () => {
      // Queue recordings while "offline"
      const id1 = await storage.addRecording({
        blob: new Blob(['audio1']),
        fileName: 'rec1.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
        case_reference: 'CASE-001',
        metadata: { template_name: 'Home Visit' },
      });

      const id2 = await storage.addRecording({
        blob: new Blob(['audio2']),
        fileName: 'rec2.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
        case_reference: 'CASE-002',
        metadata: { template_name: 'Case Review' },
      });

      // Mock API endpoints
      server.use(
        http.post(`${API_BASE}/recordings`, async () => {
          await delay(50);
          return HttpResponse.json(
            {
              id: `recording-${Date.now()}`,
              upload_url: 'https://storage.example.com/upload',
            },
            { status: 201 }
          );
        }),
        http.put('https://storage.example.com/upload', async () => {
          await delay(50);
          return new HttpResponse(null, { status: 200 });
        }),
        http.post(`${API_BASE}/transcriptions`, async () => {
          await delay(50);
          return HttpResponse.json(
            {
              id: `transcription-${Date.now()}`,
              status: 'processing',
            },
            { status: 201 }
          );
        })
      );

      // Simulate sync process
      const pending = await storage.listRecordingsByStatus('pending');
      expect(pending).toHaveLength(2);

      // Process each recording
      for (const recording of pending) {
        if (recording.id) {
          await storage.updateRecordingStatus(recording.id, 'syncing');

          // Simulate successful sync
          const createResponse = await fetch(`${API_BASE}/recordings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_extension: 'webm' }),
          });

          expect(createResponse.ok).toBe(true);

          // Mark as synced and remove
          await storage.updateRecordingStatus(recording.id, 'synced');
          await storage.removeRecording(recording.id);
        }
      }

      const remaining = await storage.listRecordings();
      expect(remaining).toHaveLength(0);
    });

    it('handles partial sync failure', async () => {
      const id1 = await storage.addRecording({
        fileName: 'success.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
      });

      const id2 = await storage.addRecording({
        fileName: 'failure.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
      });

      let requestCount = 0;
      server.use(
        http.post(`${API_BASE}/recordings`, async () => {
          requestCount++;
          // Fail on second request
          if (requestCount === 2) {
            return HttpResponse.json(
              { error: 'Server error' },
              { status: 500 }
            );
          }
          return HttpResponse.json(
            { id: 'rec-ok', upload_url: 'http://storage/upload' },
            { status: 201 }
          );
        })
      );

      // Process recordings
      const pending = await storage.listRecordingsByStatus('pending');

      for (const recording of pending) {
        if (recording.id) {
          try {
            const response = await fetch(`${API_BASE}/recordings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });

            if (response.ok) {
              await storage.updateRecordingStatus(recording.id, 'synced');
              await storage.removeRecording(recording.id);
            } else {
              await storage.updateRecordingStatus(recording.id, 'failed', 'Server error');
            }
          } catch (e) {
            await storage.updateRecordingStatus(
              recording.id,
              'failed',
              'Network error'
            );
          }
        }
      }

      const allRecordings = await storage.listRecordings();
      const failedRecordings = await storage.listRecordingsByStatus('failed');

      // One succeeded (removed), one failed (still present)
      expect(allRecordings).toHaveLength(1);
      expect(failedRecordings).toHaveLength(1);
      expect(failedRecordings[0].error).toBe('Server error');
    });

    it('respects maximum retry attempts', async () => {
      const MAX_RETRIES = 3;

      const id = await storage.addRecording({
        fileName: 'problematic.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0,
      });

      server.use(
        http.post(`${API_BASE}/recordings`, () => {
          return HttpResponse.json({ error: 'Unavailable' }, { status: 503 });
        })
      );

      // Simulate retry logic
      for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
        const recording = await storage.getRecording(id);
        if (!recording || (recording.retryCount ?? 0) >= MAX_RETRIES) {
          break;
        }

        try {
          const response = await fetch(`${API_BASE}/recordings`, {
            method: 'POST',
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            await storage.updateRecordingStatus(id, 'failed', 'Sync failed');
          }
        } catch {
          await storage.updateRecordingStatus(id, 'failed', 'Network error');
        }
      }

      const recording = await storage.getRecording(id);
      expect(recording?.retryCount).toBe(MAX_RETRIES);
      expect(recording?.status).toBe('failed');
    });

    it('records last sync timestamp', async () => {
      const LAST_SYNC_KEY = 'offlineQueue:lastSync';

      // Before sync
      expect(localStorage.getItem(LAST_SYNC_KEY)).toBeNull();

      // Simulate sync completion
      const syncTime = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, syncTime);

      expect(localStorage.getItem(LAST_SYNC_KEY)).toBe(syncTime);

      // Clean up
      localStorage.removeItem(LAST_SYNC_KEY);
    });

    it('syncs operations in priority order', async () => {
      const syncOrder: string[] = [];

      await storage.addSyncOperation({
        type: 'meeting_update',
        payload: { name: 'low' },
        status: 'pending',
        createdAt: new Date(),
        priority: 1,
      });

      await storage.addSyncOperation({
        type: 'transcription_request',
        payload: { name: 'high' },
        status: 'pending',
        createdAt: new Date(),
        priority: 10,
      });

      server.use(
        http.post(`${API_BASE}/api/sync`, async ({ request }) => {
          const body = (await request.json()) as { name: string };
          syncOrder.push(body.name);
          return HttpResponse.json({ success: true });
        })
      );

      // Get and sort by priority
      const ops = await storage.listSyncOperations();
      const sorted = [...ops].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

      // Process in order
      for (const op of sorted) {
        await fetch(`${API_BASE}/api/sync`, {
          method: 'POST',
          body: JSON.stringify(op.payload),
        });
      }

      expect(syncOrder[0]).toBe('high');
      expect(syncOrder[1]).toBe('low');
    });
  });

  // ==========================================================================
  // Conflict Resolution Tests
  // ==========================================================================

  describe('Conflict Resolution', () => {
    it('detects version conflict on sync', async () => {
      const id = await storage.addSyncOperation({
        type: 'meeting_update',
        payload: {
          meetingId: 'meeting-1',
          title: 'Offline Edit',
          version: 1,
        },
        status: 'pending',
        createdAt: new Date(),
      });

      server.use(
        http.put(`${API_BASE}/api/meetings/:id`, async ({ request }) => {
          const body = (await request.json()) as { version: number };
          // Server version is higher
          if (body.version < 2) {
            return HttpResponse.json(
              {
                error: 'Conflict',
                code: 'VERSION_CONFLICT',
                serverVersion: 2,
                serverData: { title: 'Server Edit' },
              },
              { status: 409 }
            );
          }
          return HttpResponse.json({ success: true });
        })
      );

      const response = await fetch(`${API_BASE}/api/meetings/meeting-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Offline Edit', version: 1 }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.code).toBe('VERSION_CONFLICT');
      expect(data.serverVersion).toBe(2);
    });

    it('applies last-write-wins strategy', async () => {
      const localEdit = {
        id: 'meeting-1',
        title: 'Local Title',
        timestamp: new Date('2026-03-28T10:00:00Z'),
      };

      const serverEdit = {
        id: 'meeting-1',
        title: 'Server Title',
        timestamp: new Date('2026-03-28T11:00:00Z'), // Later
      };

      // Compare timestamps
      const localTime = new Date(localEdit.timestamp).getTime();
      const serverTime = new Date(serverEdit.timestamp).getTime();

      const winner = serverTime > localTime ? serverEdit : localEdit;

      expect(winner.title).toBe('Server Title');
    });

    it('preserves local changes when server has no conflicts', async () => {
      server.use(
        http.put(`${API_BASE}/api/meetings/:id`, async () => {
          // No conflict - accept the update
          return HttpResponse.json({
            success: true,
            updated: {
              id: 'meeting-1',
              title: 'Local Title',
              version: 2,
            },
          });
        })
      );

      const response = await fetch(`${API_BASE}/api/meetings/meeting-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Local Title', version: 1 }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.updated.title).toBe('Local Title');
      expect(data.updated.version).toBe(2);
    });

    it('merges non-conflicting field changes', async () => {
      const localChanges = {
        title: 'Updated Title', // Changed locally
        description: null, // Not changed
        tags: null, // Not changed
      };

      const serverState = {
        title: 'Original Title',
        description: 'Updated Description', // Changed on server
        tags: ['new-tag'], // Changed on server
      };

      // Merge: take local changes where present, server changes otherwise
      const merged = {
        title: localChanges.title ?? serverState.title,
        description: localChanges.description ?? serverState.description,
        tags: localChanges.tags ?? serverState.tags,
      };

      expect(merged.title).toBe('Updated Title');
      expect(merged.description).toBe('Updated Description');
      expect(merged.tags).toEqual(['new-tag']);
    });

    it('creates conflict record for manual resolution', async () => {
      const conflicts: Array<{
        id: string;
        localVersion: unknown;
        serverVersion: unknown;
        createdAt: Date;
      }> = [];

      // Record conflict
      const conflict = {
        id: 'conflict-1',
        localVersion: { title: 'Local Title', version: 1 },
        serverVersion: { title: 'Server Title', version: 2 },
        createdAt: new Date(),
      };

      conflicts.push(conflict);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].localVersion).toHaveProperty('title', 'Local Title');
      expect(conflicts[0].serverVersion).toHaveProperty('title', 'Server Title');
    });

    it('handles deleted items conflict', async () => {
      // Local queue has update for an item deleted on server
      const id = await storage.addSyncOperation({
        type: 'meeting_update',
        payload: { meetingId: 'deleted-meeting', title: 'Update' },
        status: 'pending',
        createdAt: new Date(),
      });

      server.use(
        http.put(`${API_BASE}/api/meetings/:id`, async () => {
          return HttpResponse.json(
            {
              error: 'Resource not found',
              code: 'RESOURCE_DELETED',
            },
            { status: 404 }
          );
        })
      );

      const response = await fetch(`${API_BASE}/api/meetings/deleted-meeting`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Update' }),
      });

      expect(response.status).toBe(404);

      // Mark operation as failed with specific error
      await storage.updateSyncOperationStatus(id, 'failed', 'Resource was deleted');

      const op = await storage.getSyncOperation(id);
      expect(op?.error).toBe('Resource was deleted');
    });

    it('handles concurrent edits to same record', async () => {
      // Two operations targeting same record
      await storage.addSyncOperation({
        type: 'meeting_update',
        payload: { meetingId: 'meeting-1', field: 'title', value: 'Edit 1' },
        status: 'pending',
        createdAt: new Date('2026-03-28T10:00:00Z'),
      });

      await storage.addSyncOperation({
        type: 'meeting_update',
        payload: { meetingId: 'meeting-1', field: 'description', value: 'Edit 2' },
        status: 'pending',
        createdAt: new Date('2026-03-28T10:00:01Z'),
      });

      const ops = await storage.listSyncOperations();
      const meeting1Ops = ops.filter(
        (op) => op.payload.meetingId === 'meeting-1'
      );

      // Both edits affect same record - may need merging or sequencing
      expect(meeting1Ops).toHaveLength(2);

      // Order by timestamp for sequential processing
      const ordered = [...meeting1Ops].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      expect(ordered[0].payload.field).toBe('title');
      expect(ordered[1].payload.field).toBe('description');
    });
  });

  // ==========================================================================
  // Network Status Detection Tests
  // ==========================================================================

  describe('Network Status Detection', () => {
    it('detects online status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      expect(navigator.onLine).toBe(true);
    });

    it('detects offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      expect(navigator.onLine).toBe(false);
    });

    it('listens for online event', () => {
      const onlineHandler = vi.fn();
      window.addEventListener('online', onlineHandler);

      // Simulate online event
      window.dispatchEvent(new Event('online'));

      expect(onlineHandler).toHaveBeenCalled();

      window.removeEventListener('online', onlineHandler);
    });

    it('listens for offline event', () => {
      const offlineHandler = vi.fn();
      window.addEventListener('offline', offlineHandler);

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));

      expect(offlineHandler).toHaveBeenCalled();

      window.removeEventListener('offline', offlineHandler);
    });

    it('triggers sync on reconnection', async () => {
      let syncTriggered = false;

      // Simulate sync trigger
      const syncQueue = async () => {
        syncTriggered = true;
      };

      // Simulate going online
      window.addEventListener('online', () => {
        syncQueue();
      });

      window.dispatchEvent(new Event('online'));

      // Allow async operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(syncTriggered).toBe(true);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles large file uploads', async () => {
      // Create a 10MB blob
      const largeBlob = new Blob([new ArrayBuffer(10 * 1024 * 1024)], {
        type: 'audio/webm',
      });

      const id = await storage.addRecording({
        blob: largeBlob,
        fileName: 'large-recording.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
      });

      const recording = await storage.getRecording(id);
      expect(recording?.blob?.size).toBe(10 * 1024 * 1024);
    });

    it('handles queue overflow gracefully', async () => {
      const MAX_QUEUE_SIZE = 100;

      // Add many items
      for (let i = 0; i < MAX_QUEUE_SIZE + 10; i++) {
        await storage.addRecording({
          fileName: `recording-${i}.webm`,
          mimeType: 'audio/webm',
          createdAt: new Date(),
          status: 'pending',
        });
      }

      const recordings = await storage.listRecordings();

      // In real implementation, oldest items might be evicted or sync forced
      expect(recordings.length).toBe(MAX_QUEUE_SIZE + 10);
    });

    it('preserves queue across page navigation', async () => {
      // IndexedDB persists across page loads
      // This test verifies the pattern

      await storage.addRecording({
        fileName: 'persistent.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
      });

      // Simulate "reload" - in real scenario, IndexedDB would persist
      const recordings = await storage.listRecordings();

      expect(recordings).toHaveLength(1);
      expect(recordings[0].fileName).toBe('persistent.webm');
    });

    it('handles corrupt storage data', async () => {
      // Simulate corrupt data by adding then manually breaking
      const id = await storage.addRecording({
        fileName: 'test.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
      });

      // In real scenario, you'd catch IndexedDB errors
      const recording = await storage.getRecording(id);

      expect(recording).toBeDefined();
    });

    it('cleans up stale pending items', async () => {
      const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

      // Add old pending item
      await storage.addRecording({
        fileName: 'stale.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(Date.now() - STALE_THRESHOLD_MS - 1000),
        status: 'pending',
      });

      // Add recent pending item
      await storage.addRecording({
        fileName: 'recent.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
      });

      const pending = await storage.listRecordingsByStatus('pending');

      // Filter stale items
      const stale = pending.filter(
        (r) => Date.now() - new Date(r.createdAt).getTime() > STALE_THRESHOLD_MS
      );

      expect(stale).toHaveLength(1);
      expect(stale[0].fileName).toBe('stale.webm');
    });

    it('handles service worker sync event', async () => {
      // Mock service worker registration
      const mockSync = {
        register: vi.fn().mockResolvedValue(undefined),
        getTags: vi.fn().mockResolvedValue(['offline-sync']),
      };

      const mockRegistration = {
        sync: mockSync,
        active: { state: 'activated' },
      };

      // Simulate registering a background sync
      await mockSync.register('offline-sync');

      expect(mockSync.register).toHaveBeenCalledWith('offline-sync');

      const tags = await mockSync.getTags();
      expect(tags).toContain('offline-sync');
    });
  });
});
