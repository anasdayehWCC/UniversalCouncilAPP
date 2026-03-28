/**
 * Session Management Types
 *
 * Type definitions for the session management system.
 *
 * @module lib/session/types
 */

/**
 * Session status states
 */
export type SessionStatus =
  | 'active' // Session is active and valid
  | 'idle' // User is inactive, session still valid
  | 'expiring' // Session about to expire, warning shown
  | 'expired' // Session has expired
  | 'refreshing' // Session is being refreshed
  | 'error'; // Session error occurred

/**
 * Session activity event types
 */
export type ActivityEventType =
  | 'mouse_move'
  | 'mouse_click'
  | 'key_press'
  | 'scroll'
  | 'touch'
  | 'focus'
  | 'visibility_change'
  | 'api_request';

/**
 * Session data stored in secure storage
 */
export interface SessionData {
  /** Unique session identifier */
  sessionId: string;
  /** User identifier (from Azure AD / MSAL) */
  userId: string;
  /** Organisation ID */
  organisationId: string;
  /** Timestamp when session was created */
  createdAt: number;
  /** Timestamp of last activity */
  lastActivityAt: number;
  /** Timestamp when session expires */
  expiresAt: number;
  /** User's display name */
  userName?: string;
  /** User's email */
  userEmail?: string;
  /** User roles */
  roles?: string[];
  /** Active service domain ID */
  serviceDomainId?: string;
  /** Device/browser fingerprint (not PII, for multi-tab sync) */
  deviceId: string;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session configuration options
 */
export interface SessionConfig {
  /** Session timeout in milliseconds (default: 30 minutes) */
  sessionTimeoutMs: number;
  /** Idle timeout in milliseconds (default: 15 minutes) */
  idleTimeoutMs: number;
  /** Warning before expiry in milliseconds (default: 2 minutes) */
  warningBeforeExpiryMs: number;
  /** Activity check interval in milliseconds (default: 1 minute) */
  activityCheckIntervalMs: number;
  /** Whether to enable cross-tab synchronization (default: true) */
  enableCrossTabSync: boolean;
  /** Events that count as activity */
  activityEvents: ActivityEventType[];
  /** Whether to extend session on activity (default: true) */
  extendOnActivity: boolean;
  /** Maximum session duration regardless of activity (default: 8 hours) */
  maxSessionDurationMs: number;
  /** Storage key prefix */
  storageKeyPrefix: string;
}

/**
 * Cross-tab message types
 */
export type CrossTabMessageType =
  | 'session_started'
  | 'session_refreshed'
  | 'session_extended'
  | 'session_expiring'
  | 'session_expired'
  | 'session_ended'
  | 'activity_detected'
  | 'logout_requested'
  | 'heartbeat';

/**
 * Cross-tab synchronization message
 */
export interface CrossTabMessage {
  type: CrossTabMessageType;
  sessionId: string;
  timestamp: number;
  data?: Record<string, unknown>;
  source: string; // Tab ID
}

/**
 * Session manager state
 */
export interface SessionManagerState {
  /** Current session data */
  session: SessionData | null;
  /** Current session status */
  status: SessionStatus;
  /** Whether session is loading */
  isLoading: boolean;
  /** Last error */
  error: Error | null;
  /** Time until session expires (ms) */
  timeUntilExpiry: number | null;
  /** Whether warning should be shown */
  showWarning: boolean;
}

/**
 * Session event callbacks
 */
export interface SessionEventCallbacks {
  /** Called when session is created */
  onSessionCreated?: (session: SessionData) => void;
  /** Called when session is refreshed */
  onSessionRefreshed?: (session: SessionData) => void;
  /** Called when session is about to expire */
  onSessionExpiring?: (timeRemaining: number) => void;
  /** Called when session has expired */
  onSessionExpired?: () => void;
  /** Called when user activity is detected */
  onActivity?: (eventType: ActivityEventType) => void;
  /** Called when session error occurs */
  onError?: (error: Error) => void;
  /** Called when user logs out */
  onLogout?: () => void;
}

/**
 * Session storage interface
 */
export interface ISessionStorage {
  /** Save session data */
  save(session: SessionData): Promise<void>;
  /** Load session data */
  load(): Promise<SessionData | null>;
  /** Clear session data */
  clear(): Promise<void>;
  /** Update specific session fields */
  update(updates: Partial<SessionData>): Promise<SessionData | null>;
  /** Check if session exists */
  exists(): Promise<boolean>;
}

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  idleTimeoutMs: 15 * 60 * 1000, // 15 minutes
  warningBeforeExpiryMs: 2 * 60 * 1000, // 2 minutes
  activityCheckIntervalMs: 60 * 1000, // 1 minute
  enableCrossTabSync: true,
  activityEvents: [
    'mouse_move',
    'mouse_click',
    'key_press',
    'scroll',
    'touch',
    'focus',
    'api_request',
  ],
  extendOnActivity: true,
  maxSessionDurationMs: 8 * 60 * 60 * 1000, // 8 hours
  storageKeyPrefix: 'uca_session_',
};
