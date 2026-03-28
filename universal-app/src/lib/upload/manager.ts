/**
 * Upload Manager
 *
 * Comprehensive file upload manager with:
 * - Chunked upload support for large files
 * - Resume capability for interrupted uploads
 * - Progress tracking
 * - Parallel uploads with queue management
 * - File validation integration
 *
 * @module lib/upload/manager
 */

import Dexie, { type Table } from 'dexie';
import {
  type UploadItem,
  type UploadStatus,
  type UploadPriority,
  type UploadProgress,
  type UploadOptions,
  type UploadResult,
  type UploadError,
  type UploadErrorCode,
  type UploadEvent,
  type UploadEventType,
  type UploadEventHandler,
  type UploadManagerConfig,
  type ChunkState,
  type QueueStats,
  type PersistedUploadState,
  type ValidationResult,
  DEFAULT_UPLOAD_CONFIG,
} from './types';
import { validateFile, quickValidateFile, formatFileSize } from './validation';

// ============================================================================
// IndexedDB Store for Resumable Uploads
// ============================================================================

interface UploadChunkRecord {
  id?: number;
  uploadId: string;
  chunkIndex: number;
  data: ArrayBuffer;
  size: number;
  uploaded: boolean;
  createdAt: Date;
}

interface UploadSessionRecord {
  id?: number;
  uploadId: string;
  sessionUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

class UploadDatabase extends Dexie {
  uploads!: Table<PersistedUploadState, string>;
  chunks!: Table<UploadChunkRecord, number>;
  sessions!: Table<UploadSessionRecord, number>;

  constructor() {
    super('UniversalAppUploads');
    this.version(1).stores({
      uploads: 'id, status, createdAt',
      chunks: '++id, uploadId, chunkIndex',
      sessions: '++id, uploadId',
    });
  }
}

// ============================================================================
// Upload Manager Class
// ============================================================================

export class UploadManager {
  private config: UploadManagerConfig;
  private queue: Map<string, UploadItem> = new Map();
  private activeUploads: Set<string> = new Set();
  private eventHandlers: Map<UploadEventType, Set<UploadEventHandler>> = new Map();
  private db: UploadDatabase | null = null;
  private getAuthToken: () => Promise<string | null>;
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  constructor(
    getAuthToken: () => Promise<string | null>,
    config: Partial<UploadManagerConfig> = {}
  ) {
    this.config = { ...DEFAULT_UPLOAD_CONFIG, ...config };
    this.getAuthToken = getAuthToken;

    if (this.config.persistQueue && typeof window !== 'undefined') {
      this.db = new UploadDatabase();
      this.restoreQueue();
    }
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Subscribe to upload events
   */
  on(type: UploadEventType, handler: UploadEventHandler): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    this.eventHandlers.get(type)!.add(handler);

    return () => {
      this.eventHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Emit an upload event
   */
  private emit(event: UploadEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (e) {
          console.error('Upload event handler error:', e);
        }
      });
    }
  }

  // ==========================================================================
  // Queue Management
  // ==========================================================================

  /**
   * Generate unique upload ID
   */
  private generateId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Add file to upload queue
   */
  async add(file: File, options: UploadOptions = {}): Promise<string> {
    const id = this.generateId();
    const now = new Date();

    // Quick validation first
    let validation: ValidationResult | undefined;
    if (!options.skipValidation) {
      validation = options.skipValidation
        ? undefined
        : await validateFile(file, this.config.validation);

      if (!validation.valid) {
        const error = this.createError(
          'VALIDATION_FAILED',
          validation.failed.map((f) => f.message).join('; '),
          false
        );
        options.onError?.(error);
        throw new Error(error.message);
      }
    }

    const shouldChunk =
      options.forceChunked || file.size > this.config.chunkThreshold;

    const item: UploadItem = {
      id,
      file,
      status: 'pending',
      progress: {
        uploadId: id,
        fileName: file.name,
        bytesUploaded: 0,
        totalBytes: file.size,
        percentage: 0,
        status: 'pending',
      },
      priority: options.priority ?? 'normal',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      validation,
      metadata: options.metadata,
      destination: options.destination,
      uploadUrl: options.uploadUrl,
      createdAt: now,
      updatedAt: now,
      resumable: shouldChunk && this.config.enableResumable,
    };

    // Setup callbacks
    if (options.onProgress) {
      this.on('progress', (event) => {
        if (event.item?.id === id && event.progress) {
          options.onProgress!(event.progress);
        }
      });
    }

    if (options.onComplete) {
      this.on('complete', (event) => {
        if (event.item?.id === id) {
          options.onComplete!({
            uploadId: id,
            fileName: file.name,
            fileSize: file.size,
            duration: now.getTime() - item.createdAt.getTime(),
            averageSpeed: file.size / ((now.getTime() - item.createdAt.getTime()) / 1000),
          });
        }
      });
    }

    if (options.onError) {
      this.on('error', (event) => {
        if (event.item?.id === id && event.error) {
          options.onError!(event.error);
        }
      });
    }

    this.queue.set(id, item);
    await this.persistUpload(item);

    this.emit({
      type: 'add',
      item,
      queueStats: this.getQueueStats(),
      timestamp: now,
    });

    if (this.config.autoStart) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Add multiple files to queue
   */
  async addMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const file of files) {
      try {
        const id = await this.add(file, options);
        ids.push(id);
      } catch (e) {
        console.error(`Failed to add file ${file.name}:`, e);
      }
    }
    return ids;
  }

  /**
   * Start or resume an upload
   */
  async start(uploadId: string): Promise<void> {
    const item = this.queue.get(uploadId);
    if (!item) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    if (item.status === 'uploading') {
      return; // Already uploading
    }

    this.updateItemStatus(item, 'pending');
    this.processQueue();
  }

  /**
   * Pause an upload
   */
  pause(uploadId: string): void {
    const item = this.queue.get(uploadId);
    if (!item || item.status !== 'uploading') {
      return;
    }

    item.abortController?.abort();
    this.updateItemStatus(item, 'paused');
    this.activeUploads.delete(uploadId);

    this.emit({
      type: 'pause',
      item,
      queueStats: this.getQueueStats(),
      timestamp: new Date(),
    });
  }

  /**
   * Resume a paused upload
   */
  async resume(uploadId: string): Promise<void> {
    const item = this.queue.get(uploadId);
    if (!item || item.status !== 'paused') {
      return;
    }

    this.updateItemStatus(item, 'pending');

    this.emit({
      type: 'resume',
      item,
      queueStats: this.getQueueStats(),
      timestamp: new Date(),
    });

    this.processQueue();
  }

  /**
   * Cancel an upload
   */
  cancel(uploadId: string): void {
    const item = this.queue.get(uploadId);
    if (!item) {
      return;
    }

    item.abortController?.abort();
    this.updateItemStatus(item, 'cancelled');
    this.activeUploads.delete(uploadId);
    this.queue.delete(uploadId);
    this.removePersistedUpload(uploadId);

    this.emit({
      type: 'cancel',
      item,
      queueStats: this.getQueueStats(),
      timestamp: new Date(),
    });

    this.processQueue();
  }

  /**
   * Retry a failed upload
   */
  async retry(uploadId: string): Promise<void> {
    const item = this.queue.get(uploadId);
    if (!item || item.status !== 'failed') {
      return;
    }

    item.retryCount++;
    item.error = undefined;
    item.errorCode = undefined;
    this.updateItemStatus(item, 'pending');

    this.emit({
      type: 'retry',
      item,
      queueStats: this.getQueueStats(),
      timestamp: new Date(),
    });

    this.processQueue();
  }

  /**
   * Remove an upload from queue
   */
  remove(uploadId: string): void {
    const item = this.queue.get(uploadId);
    if (item) {
      item.abortController?.abort();
      this.activeUploads.delete(uploadId);
    }
    this.queue.delete(uploadId);
    this.removePersistedUpload(uploadId);

    this.emit({
      type: 'queue-change',
      queueStats: this.getQueueStats(),
      timestamp: new Date(),
    });
  }

  /**
   * Clear completed or failed uploads
   */
  clearFinished(): void {
    for (const [id, item] of this.queue) {
      if (item.status === 'completed' || item.status === 'failed') {
        this.queue.delete(id);
        this.removePersistedUpload(id);
      }
    }

    this.emit({
      type: 'queue-change',
      queueStats: this.getQueueStats(),
      timestamp: new Date(),
    });
  }

  /**
   * Get upload item by ID
   */
  getUpload(uploadId: string): UploadItem | undefined {
    return this.queue.get(uploadId);
  }

  /**
   * Get all uploads
   */
  getAllUploads(): UploadItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    let pending = 0;
    let uploading = 0;
    let completed = 0;
    let failed = 0;
    let paused = 0;
    let totalBytes = 0;
    let uploadedBytes = 0;

    for (const item of this.queue.values()) {
      totalBytes += item.file.size;
      uploadedBytes += item.progress.bytesUploaded;

      switch (item.status) {
        case 'pending':
        case 'validating':
        case 'preparing':
          pending++;
          break;
        case 'uploading':
          uploading++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'paused':
          paused++;
          break;
      }
    }

    return {
      total: this.queue.size,
      pending,
      uploading,
      completed,
      failed,
      paused,
      totalBytes,
      uploadedBytes,
      overallProgress: totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0,
      activeUploads: this.activeUploads.size,
    };
  }

  // ==========================================================================
  // Queue Processing
  // ==========================================================================

  /**
   * Process pending uploads in queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.activeUploads.size < this.config.maxConcurrentUploads) {
        const nextItem = this.getNextPendingItem();
        if (!nextItem) {
          break;
        }

        this.activeUploads.add(nextItem.id);
        this.uploadItem(nextItem).catch((e) => {
          console.error(`Upload failed for ${nextItem.id}:`, e);
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get next pending item by priority
   */
  private getNextPendingItem(): UploadItem | undefined {
    const priorityOrder: UploadPriority[] = ['critical', 'high', 'normal', 'low'];

    for (const priority of priorityOrder) {
      for (const item of this.queue.values()) {
        if (
          item.status === 'pending' &&
          item.priority === priority &&
          !this.activeUploads.has(item.id)
        ) {
          return item;
        }
      }
    }

    return undefined;
  }

  /**
   * Upload a single item
   */
  private async uploadItem(item: UploadItem): Promise<void> {
    const abortController = new AbortController();
    item.abortController = abortController;

    try {
      // Update status to uploading
      this.updateItemStatus(item, 'uploading');
      item.progress.startedAt = new Date();

      this.emit({
        type: 'start',
        item,
        progress: item.progress,
        queueStats: this.getQueueStats(),
        timestamp: new Date(),
      });

      // Determine upload method
      if (item.resumable && item.file.size > this.config.chunkThreshold) {
        await this.chunkedUpload(item, abortController.signal);
      } else {
        await this.simpleUpload(item, abortController.signal);
      }

      // Mark as completed
      this.updateItemStatus(item, 'completed');
      item.progress.percentage = 100;
      item.progress.bytesUploaded = item.file.size;

      this.emit({
        type: 'complete',
        item,
        progress: item.progress,
        queueStats: this.getQueueStats(),
        timestamp: new Date(),
      });
    } catch (error) {
      if (abortController.signal.aborted) {
        // Upload was cancelled or paused
        return;
      }

      const uploadError = this.parseError(error);
      item.error = uploadError.message;
      item.errorCode = uploadError.code;

      // Retry if retryable and under limit
      if (uploadError.retryable && item.retryCount < item.maxRetries) {
        item.retryCount++;
        this.updateItemStatus(item, 'pending');

        // Exponential backoff
        const delay =
          this.config.retryDelayBase * Math.pow(2, item.retryCount - 1);
        await new Promise((r) => setTimeout(r, delay));

        this.emit({
          type: 'retry',
          item,
          error: uploadError,
          queueStats: this.getQueueStats(),
          timestamp: new Date(),
        });

        // Requeue for processing
        this.activeUploads.delete(item.id);
        this.processQueue();
        return;
      }

      this.updateItemStatus(item, 'failed');

      this.emit({
        type: 'error',
        item,
        error: uploadError,
        queueStats: this.getQueueStats(),
        timestamp: new Date(),
      });
    } finally {
      this.activeUploads.delete(item.id);
      item.abortController = undefined;

      // Continue processing queue
      this.processQueue();
    }
  }

  // ==========================================================================
  // Simple Upload (Small Files)
  // ==========================================================================

  /**
   * Simple single-request upload for small files
   */
  private async simpleUpload(
    item: UploadItem,
    signal: AbortSignal
  ): Promise<void> {
    const token = await this.getAuthToken();

    // Get upload URL if not provided
    let uploadUrl = item.uploadUrl;
    if (!uploadUrl) {
      uploadUrl = await this.getUploadUrl(item, token, signal);
    }

    // Track progress with XHR for better progress events
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.updateProgress(item, event.loaded, event.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));

      signal.addEventListener('abort', () => xhr.abort());

      xhr.open('PUT', uploadUrl);
      xhr.timeout = this.config.timeout;

      // Set headers
      if (item.file.type) {
        xhr.setRequestHeader('Content-Type', item.file.type);
      }

      // Azure Blob Storage header
      if (uploadUrl.includes('blob.core.windows.net')) {
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
      }

      xhr.send(item.file);
    });
  }

  // ==========================================================================
  // Chunked Upload (Large Files)
  // ==========================================================================

  /**
   * Chunked upload for large files with resume capability
   */
  private async chunkedUpload(
    item: UploadItem,
    signal: AbortSignal
  ): Promise<void> {
    const token = await this.getAuthToken();
    const chunkSize = this.config.chunkSize;
    const totalChunks = Math.ceil(item.file.size / chunkSize);

    // Initialize or restore chunk state
    if (!item.chunkState) {
      item.chunkState = {
        totalChunks,
        uploadedChunks: [],
        chunkSize,
        currentChunk: 0,
      };
    }

    // Get or create upload session
    let sessionUrl = item.chunkState.sessionUrl;
    if (
      !sessionUrl ||
      (item.chunkState.sessionExpiresAt &&
        item.chunkState.sessionExpiresAt < new Date())
    ) {
      sessionUrl = await this.createUploadSession(item, token, signal);
      item.chunkState.sessionUrl = sessionUrl;
      item.chunkState.sessionExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
      await this.persistUpload(item);
    }

    item.progress.chunkState = item.chunkState;

    // Upload remaining chunks
    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      // Skip already uploaded chunks
      if (item.chunkState.uploadedChunks.includes(i)) {
        continue;
      }

      item.chunkState.currentChunk = i;
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, item.file.size);
      const chunk = item.file.slice(start, end);

      await this.uploadChunk(
        sessionUrl,
        chunk,
        start,
        end - 1,
        item.file.size,
        signal
      );

      // Mark chunk as uploaded
      item.chunkState.uploadedChunks.push(i);
      await this.persistUpload(item);

      // Update progress
      const bytesUploaded = item.chunkState.uploadedChunks.length * chunkSize;
      this.updateProgress(
        item,
        Math.min(bytesUploaded, item.file.size),
        item.file.size
      );
    }

    // Finalize upload if needed
    await this.finalizeUploadSession(sessionUrl, token, signal);

    // Clean up session
    item.chunkState.sessionUrl = undefined;
    await this.removeUploadSession(item.id);
  }

  /**
   * Create an upload session for chunked upload
   */
  private async createUploadSession(
    item: UploadItem,
    token: string | null,
    signal: AbortSignal
  ): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/api/v1/recordings/upload-session`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filename: item.file.name,
          fileSize: item.file.size,
          mimeType: item.file.type,
          metadata: item.metadata,
          destination: item.destination,
        }),
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create upload session: ${response.status}`);
    }

    const data = await response.json();
    return data.upload_url || data.session_url;
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(
    sessionUrl: string,
    chunk: Blob,
    rangeStart: number,
    rangeEnd: number,
    totalSize: number,
    signal: AbortSignal
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Range': `bytes ${rangeStart}-${rangeEnd}/${totalSize}`,
      'Content-Length': chunk.size.toString(),
    };

    if (chunk.type) {
      headers['Content-Type'] = chunk.type;
    }

    const response = await fetch(sessionUrl, {
      method: 'PUT',
      headers,
      body: chunk,
      signal,
    });

    // 308 is expected for incomplete uploads (resume protocol)
    if (!response.ok && response.status !== 308) {
      throw new Error(`Chunk upload failed: ${response.status}`);
    }
  }

  /**
   * Finalize upload session
   */
  private async finalizeUploadSession(
    _sessionUrl: string,
    _token: string | null,
    _signal: AbortSignal
  ): Promise<void> {
    // Some APIs require explicit completion, others auto-complete
    // Implement based on backend requirements
  }

  // ==========================================================================
  // Upload URL Management
  // ==========================================================================

  /**
   * Get pre-signed upload URL from backend
   */
  private async getUploadUrl(
    item: UploadItem,
    token: string | null,
    signal: AbortSignal
  ): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/api/v1/recordings`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filename: item.file.name,
          file_size: item.file.size,
          mime_type: item.file.type,
          ...(item.metadata || {}),
        }),
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.status}`);
    }

    const data = await response.json();
    return data.upload_url;
  }

  // ==========================================================================
  // Progress & State Management
  // ==========================================================================

  /**
   * Update upload progress
   */
  private updateProgress(
    item: UploadItem,
    bytesUploaded: number,
    totalBytes: number
  ): void {
    const now = new Date();
    const startTime = item.progress.startedAt?.getTime() || now.getTime();
    const elapsedMs = now.getTime() - startTime;
    const speed = elapsedMs > 0 ? (bytesUploaded / elapsedMs) * 1000 : 0;
    const remaining = totalBytes - bytesUploaded;
    const estimatedTimeRemaining = speed > 0 ? remaining / speed : undefined;

    item.progress = {
      ...item.progress,
      bytesUploaded,
      totalBytes,
      percentage: (bytesUploaded / totalBytes) * 100,
      speed,
      estimatedTimeRemaining,
      updatedAt: now,
      status: 'uploading',
    };

    this.emit({
      type: 'progress',
      item,
      progress: item.progress,
      queueStats: this.getQueueStats(),
      timestamp: now,
    });
  }

  /**
   * Update item status
   */
  private updateItemStatus(item: UploadItem, status: UploadStatus): void {
    item.status = status;
    item.progress.status = status;
    item.updatedAt = new Date();
    this.persistUpload(item);
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  /**
   * Persist upload state to IndexedDB
   */
  private async persistUpload(item: UploadItem): Promise<void> {
    if (!this.db) return;

    const persisted: PersistedUploadState = {
      id: item.id,
      fileInfo: {
        name: item.file.name,
        size: item.file.size,
        type: item.file.type,
        lastModified: item.file.lastModified,
      },
      status: item.status,
      progress: item.progress,
      chunkState: item.chunkState,
      metadata: item.metadata,
      destination: item.destination,
      retryCount: item.retryCount,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };

    await this.db.uploads.put(persisted);
  }

  /**
   * Remove persisted upload
   */
  private async removePersistedUpload(uploadId: string): Promise<void> {
    if (!this.db) return;
    await this.db.uploads.delete(uploadId);
    await this.db.chunks.where('uploadId').equals(uploadId).delete();
    await this.db.sessions.where('uploadId').equals(uploadId).delete();
  }

  /**
   * Remove upload session
   */
  private async removeUploadSession(uploadId: string): Promise<void> {
    if (!this.db) return;
    await this.db.sessions.where('uploadId').equals(uploadId).delete();
  }

  /**
   * Restore queue from IndexedDB on startup
   */
  private async restoreQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const persisted = await this.db.uploads.toArray();

      for (const state of persisted) {
        // Only restore pending/paused uploads
        if (
          state.status !== 'pending' &&
          state.status !== 'paused' &&
          state.status !== 'uploading'
        ) {
          continue;
        }

        // Note: We can't restore the actual File object
        // User needs to re-select the file for resumable uploads
        // Store minimal state for UI display
        console.log(
          `Found incomplete upload: ${state.fileInfo.name} (${formatFileSize(state.fileInfo.size)})`
        );
      }
    } catch (e) {
      console.error('Failed to restore upload queue:', e);
    }
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  /**
   * Create upload error
   */
  private createError(
    code: UploadErrorCode,
    message: string,
    retryable: boolean,
    suggestion?: string,
    originalError?: Error
  ): UploadError {
    return {
      code,
      message,
      retryable,
      suggestion,
      originalError,
    };
  }

  /**
   * Parse error to UploadError
   */
  private parseError(error: unknown): UploadError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('timeout')) {
        return this.createError(
          'TIMEOUT',
          'Upload timed out',
          true,
          'Try again with a smaller file or better connection'
        );
      }

      if (message.includes('network') || message.includes('fetch')) {
        return this.createError(
          'NETWORK_ERROR',
          'Network error occurred',
          true,
          'Check your internet connection and try again'
        );
      }

      if (message.includes('abort') || message.includes('cancel')) {
        return this.createError('CANCELLED', 'Upload was cancelled', false);
      }

      if (message.includes('413') || message.includes('too large')) {
        return this.createError(
          'FILE_TOO_LARGE',
          'File exceeds server size limit',
          false,
          'Try uploading a smaller file'
        );
      }

      if (message.includes('401') || message.includes('403')) {
        return this.createError(
          'SERVER_ERROR',
          'Authentication error',
          false,
          'Please sign in again'
        );
      }

      if (message.includes('5') && message.match(/\d{3}/)) {
        return this.createError(
          'SERVER_ERROR',
          'Server error occurred',
          true,
          'Please try again later'
        );
      }

      return this.createError('UNKNOWN', error.message, false);
    }

    return this.createError('UNKNOWN', 'An unexpected error occurred', false);
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Destroy the upload manager
   */
  destroy(): void {
    // Cancel all active uploads
    for (const item of this.queue.values()) {
      item.abortController?.abort();
    }

    this.queue.clear();
    this.activeUploads.clear();
    this.eventHandlers.clear();
    this.db?.close();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create upload manager instance
 */
export function createUploadManager(
  getAuthToken: () => Promise<string | null>,
  config?: Partial<UploadManagerConfig>
): UploadManager {
  return new UploadManager(getAuthToken, config);
}
