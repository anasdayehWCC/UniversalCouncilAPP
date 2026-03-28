/**
 * Secure Session Storage
 *
 * Provides encrypted localStorage for session data with cross-tab communication.
 * Uses subtle crypto for encryption when available, with graceful fallback.
 *
 * @module lib/session/storage
 */

import {
  SessionData,
  ISessionStorage,
  CrossTabMessage,
  CrossTabMessageType,
  DEFAULT_SESSION_CONFIG,
} from './types';

// ============================================================================
// Encryption Utilities
// ============================================================================

/**
 * Generate a device-specific encryption key
 * This is NOT true security - it's obfuscation to prevent casual inspection.
 * Real security comes from HTTPS, secure cookies, and server-side validation.
 */
async function deriveKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return null;
  }

  try {
    // Use a combination of browser fingerprint elements
    const keyMaterial = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      'universal-council-app-session-v1',
    ].join('|');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);

    // Import as raw key material
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive an AES-GCM key
    const salt = encoder.encode('uca-session-salt');
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    console.warn('[SessionStorage] Crypto not available, using fallback');
    return null;
  }
}

/**
 * Encrypt data using AES-GCM
 */
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-GCM
 */
async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Simple obfuscation fallback when crypto is not available
 */
function obfuscate(data: string): string {
  return btoa(encodeURIComponent(data).split('').reverse().join(''));
}

/**
 * Deobfuscate data
 */
function deobfuscate(data: string): string {
  return decodeURIComponent(atob(data).split('').reverse().join(''));
}

// ============================================================================
// Cross-Tab Communication
// ============================================================================

type MessageHandler = (message: CrossTabMessage) => void;

/**
 * Cross-tab communication channel using BroadcastChannel API
 * Falls back to localStorage events when BroadcastChannel is not available.
 */
export class CrossTabChannel {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private tabId: string;
  private storageKey: string;

  constructor(channelName: string = 'uca-session-channel') {
    this.tabId = this.generateTabId();
    this.storageKey = `${channelName}_fallback`;

    if (typeof window === 'undefined') return;

    // Try BroadcastChannel first
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = this.handleChannelMessage;
      } catch {
        console.warn('[CrossTabChannel] BroadcastChannel failed, using localStorage');
      }
    }

    // Fallback to storage events
    if (!this.channel) {
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private handleChannelMessage = (event: MessageEvent): void => {
    const message = event.data as CrossTabMessage;
    // Ignore messages from self
    if (message.source === this.tabId) return;
    this.notifyHandlers(message);
  };

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== this.storageKey || !event.newValue) return;
    
    try {
      const message = JSON.parse(event.newValue) as CrossTabMessage;
      // Ignore messages from self
      if (message.source === this.tabId) return;
      this.notifyHandlers(message);
    } catch {
      // Ignore parse errors
    }
  };

  private notifyHandlers(message: CrossTabMessage): void {
    this.handlers.forEach(handler => {
      try {
        handler(message);
      } catch (err) {
        console.error('[CrossTabChannel] Handler error:', err);
      }
    });
  }

  /**
   * Send a message to all other tabs
   */
  send(type: CrossTabMessageType, data?: Record<string, unknown>): void {
    const message: CrossTabMessage = {
      type,
      sessionId: data?.sessionId as string || '',
      timestamp: Date.now(),
      data,
      source: this.tabId,
    };

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (typeof localStorage !== 'undefined') {
      // Use localStorage fallback
      localStorage.setItem(this.storageKey, JSON.stringify(message));
      // Clear it immediately so the event fires again for the same message type
      setTimeout(() => localStorage.removeItem(this.storageKey), 100);
    }
  }

  /**
   * Subscribe to cross-tab messages
   */
  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Get this tab's ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.handlers.clear();
  }
}

// Singleton instance
let crossTabChannelInstance: CrossTabChannel | null = null;

/**
 * Get the cross-tab channel singleton
 */
export function getCrossTabChannel(): CrossTabChannel {
  if (!crossTabChannelInstance) {
    crossTabChannelInstance = new CrossTabChannel();
  }
  return crossTabChannelInstance;
}

// ============================================================================
// Session Storage Implementation
// ============================================================================

/**
 * Secure session storage implementation
 * 
 * Features:
 * - Encrypted localStorage with AES-GCM (when available)
 * - Graceful fallback to obfuscation
 * - Cross-tab synchronization
 * - Automatic expiry checking
 */
export class SecureSessionStorage implements ISessionStorage {
  private key: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey | null> | null = null;
  private storageKey: string;
  private crossTab: CrossTabChannel;

  constructor(prefix: string = DEFAULT_SESSION_CONFIG.storageKeyPrefix) {
    this.storageKey = `${prefix}data`;
    this.crossTab = getCrossTabChannel();
    
    // Initialize encryption key asynchronously
    if (typeof window !== 'undefined') {
      this.keyPromise = deriveKey().then(k => {
        this.key = k;
        return k;
      });
    }
  }

  /**
   * Ensure encryption key is ready
   */
  private async ensureKey(): Promise<CryptoKey | null> {
    if (this.key) return this.key;
    if (this.keyPromise) {
      this.key = await this.keyPromise;
    }
    return this.key;
  }

  /**
   * Serialize and encrypt session data
   */
  private async serialize(session: SessionData): Promise<string> {
    const json = JSON.stringify(session);
    const key = await this.ensureKey();
    
    if (key) {
      return await encrypt(json, key);
    }
    return obfuscate(json);
  }

  /**
   * Decrypt and deserialize session data
   */
  private async deserialize(data: string): Promise<SessionData | null> {
    try {
      const key = await this.ensureKey();
      
      let json: string;
      if (key) {
        try {
          json = await decrypt(data, key);
        } catch {
          // Try obfuscation fallback (migration from non-encrypted)
          json = deobfuscate(data);
        }
      } else {
        json = deobfuscate(data);
      }
      
      return JSON.parse(json) as SessionData;
    } catch {
      console.warn('[SessionStorage] Failed to deserialize session data');
      return null;
    }
  }

  /**
   * Save session data to storage
   */
  async save(session: SessionData): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    
    const encrypted = await this.serialize(session);
    localStorage.setItem(this.storageKey, encrypted);
    
    // Notify other tabs
    this.crossTab.send('session_started', { sessionId: session.sessionId });
  }

  /**
   * Load session data from storage
   */
  async load(): Promise<SessionData | null> {
    if (typeof localStorage === 'undefined') return null;
    
    const data = localStorage.getItem(this.storageKey);
    if (!data) return null;
    
    const session = await this.deserialize(data);
    
    // Check if session has expired
    if (session && session.expiresAt < Date.now()) {
      await this.clear();
      return null;
    }
    
    return session;
  }

  /**
   * Clear session data from storage
   */
  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Update specific session fields
   */
  async update(updates: Partial<SessionData>): Promise<SessionData | null> {
    const session = await this.load();
    if (!session) return null;
    
    const updated = { ...session, ...updates };
    await this.save(updated);
    
    // Notify other tabs of refresh
    this.crossTab.send('session_refreshed', { sessionId: updated.sessionId });
    
    return updated;
  }

  /**
   * Check if session exists in storage
   */
  async exists(): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Subscribe to cross-tab session events
   */
  onCrossTabMessage(handler: MessageHandler): () => void {
    return this.crossTab.subscribe(handler);
  }

  /**
   * Broadcast a message to other tabs
   */
  broadcast(type: CrossTabMessageType, data?: Record<string, unknown>): void {
    this.crossTab.send(type, data);
  }

  /**
   * Get the current tab ID
   */
  getTabId(): string {
    return this.crossTab.getTabId();
  }
}

// ============================================================================
// Device ID Generation
// ============================================================================

const DEVICE_ID_KEY = 'uca_device_id';

/**
 * Get or generate a stable device ID
 * This is NOT a fingerprint for tracking - it's for session sync
 */
export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return 'ssr_device';
  }
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Default storage instance
 */
let defaultStorage: SecureSessionStorage | null = null;

/**
 * Get the default session storage instance
 */
export function getSessionStorage(): SecureSessionStorage {
  if (!defaultStorage) {
    defaultStorage = new SecureSessionStorage();
  }
  return defaultStorage;
}
