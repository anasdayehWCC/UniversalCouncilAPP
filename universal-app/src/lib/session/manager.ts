/**
 * Session Manager
 *
 * Core session management functionality including:
 * - Session creation and validation
 * - Idle timeout handling
 * - Session refresh logic
 * - Multi-tab synchronization
 * - Activity tracking
 *
 * @module lib/session/manager
 */

import {
  SessionData,
  SessionStatus,
  SessionConfig,
  SessionManagerState,
  SessionEventCallbacks,
  ActivityEventType,
  CrossTabMessage,
  DEFAULT_SESSION_CONFIG,
} from './types';
import {
  SecureSessionStorage,
  getSessionStorage,
  getDeviceId,
} from './storage';

// ============================================================================
// Session ID Generation
// ============================================================================

/**
 * Generate a cryptographically secure session ID
 */
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// Session Manager Class
// ============================================================================

/**
 * Session Manager
 * 
 * Manages user sessions with activity tracking, idle timeout,
 * and cross-tab synchronization. Integrates with MSAL authentication.
 * 
 * @example
 * ```ts
 * const manager = new SessionManager({
 *   onSessionExpiring: (timeRemaining) => showWarning(timeRemaining),
 *   onSessionExpired: () => logout(),
 * });
 * 
 * // Start session after MSAL login
 * await manager.createSession({
 *   userId: account.localAccountId,
 *   userName: account.name,
 *   userEmail: account.username,
 *   organisationId: idTokenClaims.organisation_id,
 * });
 * 
 * // Check session status
 * const { status, timeUntilExpiry } = manager.getState();
 * ```
 */
export class SessionManager {
  private config: SessionConfig;
  private storage: SecureSessionStorage;
  private callbacks: SessionEventCallbacks;
  private state: SessionManagerState;
  
  // Timers
  private activityCheckTimer: ReturnType<typeof setInterval> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Activity tracking
  private lastActivityTime: number = 0;
  private activityListenersAttached = false;
  private throttledActivityHandler: (() => void) | null = null;

  // Cross-tab unsubscribe
  private crossTabUnsubscribe: (() => void) | null = null;

  // State change listeners
  private stateListeners: Set<(state: SessionManagerState) => void> = new Set();

  constructor(
    callbacks: SessionEventCallbacks = {},
    config: Partial<SessionConfig> = {}
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.callbacks = callbacks;
    this.storage = getSessionStorage();
    
    this.state = {
      session: null,
      status: 'expired',
      isLoading: true,
      error: null,
      timeUntilExpiry: null,
      showWarning: false,
    };

    // Initialize on client side only
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize the session manager
   */
  private async initialize(): Promise<void> {
    try {
      // Try to restore existing session
      const session = await this.storage.load();
      
      if (session) {
        this.setSession(session);
        this.setupTimers();
      }
      
      this.updateState({ isLoading: false });
      
      // Setup cross-tab synchronization
      if (this.config.enableCrossTabSync) {
        this.setupCrossTabSync();
      }
      
      // Setup activity tracking
      this.setupActivityTracking();
    } catch (error) {
      this.updateState({
        isLoading: false,
        status: 'error',
        error: error as Error,
      });
      this.callbacks.onError?.(error as Error);
    }
  }

  // ============================================================================
  // Session Lifecycle
  // ============================================================================

  /**
   * Create a new session
   */
  async createSession(params: {
    userId: string;
    organisationId: string;
    userName?: string;
    userEmail?: string;
    roles?: string[];
    serviceDomainId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SessionData> {
    const now = Date.now();
    
    const session: SessionData = {
      sessionId: generateSessionId(),
      userId: params.userId,
      organisationId: params.organisationId,
      userName: params.userName,
      userEmail: params.userEmail,
      roles: params.roles,
      serviceDomainId: params.serviceDomainId,
      metadata: params.metadata,
      deviceId: getDeviceId(),
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + this.config.sessionTimeoutMs,
    };

    await this.storage.save(session);
    this.setSession(session);
    this.setupTimers();
    
    this.callbacks.onSessionCreated?.(session);
    this.storage.broadcast('session_started', { sessionId: session.sessionId });
    
    return session;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<SessionData | null> {
    if (!this.state.session) return null;
    
    this.updateState({ status: 'refreshing' });
    
    const now = Date.now();
    const maxExpiry = this.state.session.createdAt + this.config.maxSessionDurationMs;
    const newExpiry = Math.min(now + this.config.sessionTimeoutMs, maxExpiry);
    
    const updated = await this.storage.update({
      lastActivityAt: now,
      expiresAt: newExpiry,
    });
    
    if (updated) {
      this.setSession(updated);
      this.setupTimers();
      this.callbacks.onSessionRefreshed?.(updated);
      this.storage.broadcast('session_refreshed', { sessionId: updated.sessionId });
    }
    
    return updated;
  }

  /**
   * Extend session on user activity (if configured)
   */
  async extendSession(): Promise<void> {
    if (!this.config.extendOnActivity || !this.state.session) return;
    
    const now = Date.now();
    const timeSinceLastExtension = now - this.state.session.lastActivityAt;
    
    // Only extend if significant time has passed (at least activity check interval)
    if (timeSinceLastExtension < this.config.activityCheckIntervalMs) return;
    
    await this.refreshSession();
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    const sessionId = this.state.session?.sessionId;
    
    this.clearTimers();
    await this.storage.clear();
    
    this.updateState({
      session: null,
      status: 'expired',
      timeUntilExpiry: null,
      showWarning: false,
    });
    
    if (sessionId) {
      this.storage.broadcast('session_ended', { sessionId });
    }
    
    this.callbacks.onLogout?.();
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    const session = await this.storage.load();
    
    if (!session) {
      this.updateState({ session: null, status: 'expired' });
      return false;
    }
    
    const now = Date.now();
    
    // Check if session has expired
    if (session.expiresAt < now) {
      await this.handleSessionExpired();
      return false;
    }
    
    // Check if max duration exceeded
    if (now - session.createdAt > this.config.maxSessionDurationMs) {
      await this.handleSessionExpired();
      return false;
    }
    
    // Session is valid
    this.setSession(session);
    return true;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  private setSession(session: SessionData): void {
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    
    let status: SessionStatus = 'active';
    let showWarning = false;
    
    if (timeUntilExpiry <= 0) {
      status = 'expired';
    } else if (timeUntilExpiry <= this.config.warningBeforeExpiryMs) {
      status = 'expiring';
      showWarning = true;
    } else if (now - this.lastActivityTime > this.config.idleTimeoutMs) {
      status = 'idle';
    }
    
    this.updateState({
      session,
      status,
      timeUntilExpiry,
      showWarning,
      error: null,
    });
  }

  private updateState(updates: Partial<SessionManagerState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateListeners();
  }

  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('[SessionManager] State listener error:', err);
      }
    });
  }

  /**
   * Get current session state
   */
  getState(): SessionManagerState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: SessionManagerState) => void): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  // ============================================================================
  // Timers
  // ============================================================================

  private setupTimers(): void {
    this.clearTimers();
    
    if (!this.state.session) return;
    
    const now = Date.now();
    const timeUntilExpiry = this.state.session.expiresAt - now;
    const timeUntilWarning = timeUntilExpiry - this.config.warningBeforeExpiryMs;
    
    // Warning timer
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        this.handleSessionExpiring();
      }, timeUntilWarning);
    } else if (timeUntilExpiry > 0) {
      // Already in warning period
      this.handleSessionExpiring();
    }
    
    // Expiry timer
    if (timeUntilExpiry > 0) {
      this.expiryTimer = setTimeout(() => {
        this.handleSessionExpired();
      }, timeUntilExpiry);
    }
    
    // Activity check timer
    this.activityCheckTimer = setInterval(() => {
      this.checkActivity();
    }, this.config.activityCheckIntervalMs);
  }

  private clearTimers(): void {
    if (this.activityCheckTimer) {
      clearInterval(this.activityCheckTimer);
      this.activityCheckTimer = null;
    }
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private handleSessionExpiring(): void {
    const timeRemaining = this.state.session
      ? this.state.session.expiresAt - Date.now()
      : 0;
      
    this.updateState({ status: 'expiring', showWarning: true });
    this.callbacks.onSessionExpiring?.(timeRemaining);
    this.storage.broadcast('session_expiring', {
      sessionId: this.state.session?.sessionId,
      timeRemaining,
    });
  }

  private async handleSessionExpired(): Promise<void> {
    this.clearTimers();
    
    const sessionId = this.state.session?.sessionId;
    await this.storage.clear();
    
    this.updateState({
      session: null,
      status: 'expired',
      timeUntilExpiry: null,
      showWarning: false,
    });
    
    this.callbacks.onSessionExpired?.();
    
    if (sessionId) {
      this.storage.broadcast('session_expired', { sessionId });
    }
  }

  // ============================================================================
  // Activity Tracking
  // ============================================================================

  private setupActivityTracking(): void {
    if (typeof window === 'undefined' || this.activityListenersAttached) return;
    
    // Throttle activity handler to prevent excessive calls
    let lastCall = 0;
    const throttleMs = 5000; // 5 seconds
    
    this.throttledActivityHandler = () => {
      const now = Date.now();
      if (now - lastCall < throttleMs) return;
      lastCall = now;
      this.recordActivity();
    };

    // Map activity events to DOM events
    const eventMap: Record<ActivityEventType, keyof WindowEventMap> = {
      mouse_move: 'mousemove',
      mouse_click: 'click',
      key_press: 'keydown',
      scroll: 'scroll',
      touch: 'touchstart',
      focus: 'focus',
      visibility_change: 'visibilitychange',
      api_request: 'focus', // Placeholder, API activity tracked separately
    };

    for (const eventType of this.config.activityEvents) {
      if (eventType === 'api_request') continue; // Skip, handled separately
      
      const domEvent = eventMap[eventType];
      if (domEvent) {
        window.addEventListener(domEvent, this.throttledActivityHandler, { passive: true });
      }
    }

    // Special handling for visibility change
    if (this.config.activityEvents.includes('visibility_change')) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.throttledActivityHandler?.();
        }
      });
    }

    this.activityListenersAttached = true;
  }

  private removeActivityTracking(): void {
    if (typeof window === 'undefined' || !this.throttledActivityHandler) return;

    const events = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart', 'focus'];
    for (const event of events) {
      window.removeEventListener(event, this.throttledActivityHandler);
    }

    this.activityListenersAttached = false;
  }

  /**
   * Record user activity (can be called externally for API activity)
   */
  recordActivity(eventType: ActivityEventType = 'api_request'): void {
    this.lastActivityTime = Date.now();
    this.callbacks.onActivity?.(eventType);
    
    // Notify other tabs of activity
    if (this.config.enableCrossTabSync) {
      this.storage.broadcast('activity_detected', {
        sessionId: this.state.session?.sessionId,
        eventType,
      });
    }

    // Hide warning if shown and extend session
    if (this.state.showWarning) {
      this.updateState({ showWarning: false, status: 'active' });
      this.extendSession();
    }
  }

  private checkActivity(): void {
    if (!this.state.session) return;
    
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    
    // Update time until expiry
    const timeUntilExpiry = this.state.session.expiresAt - now;
    this.updateState({ timeUntilExpiry });
    
    // Check for idle timeout
    if (idleTime > this.config.idleTimeoutMs && this.state.status === 'active') {
      this.updateState({ status: 'idle' });
    }
    
    // Extend session on activity if not already expiring
    if (this.config.extendOnActivity && idleTime < this.config.activityCheckIntervalMs) {
      if (this.state.status === 'active' || this.state.status === 'idle') {
        this.extendSession();
      }
    }
  }

  // ============================================================================
  // Cross-Tab Synchronization
  // ============================================================================

  private setupCrossTabSync(): void {
    this.crossTabUnsubscribe = this.storage.onCrossTabMessage(this.handleCrossTabMessage);
  }

  private handleCrossTabMessage = async (message: CrossTabMessage): Promise<void> => {
    switch (message.type) {
      case 'session_started':
      case 'session_refreshed':
        // Another tab started or refreshed session, reload our copy
        await this.validateSession();
        break;
        
      case 'session_expired':
      case 'session_ended':
        // Another tab ended the session
        this.clearTimers();
        this.updateState({
          session: null,
          status: 'expired',
          timeUntilExpiry: null,
          showWarning: false,
        });
        this.callbacks.onSessionExpired?.();
        break;
        
      case 'logout_requested':
        // Another tab requested logout
        await this.endSession();
        break;
        
      case 'activity_detected':
        // Another tab detected activity, update our last activity time
        this.lastActivityTime = message.timestamp;
        if (this.state.showWarning) {
          this.updateState({ showWarning: false, status: 'active' });
        }
        break;
        
      case 'session_expiring':
        // Another tab showed warning, show it here too
        if (this.state.session && !this.state.showWarning) {
          this.handleSessionExpiring();
        }
        break;
        
      case 'heartbeat':
        // Heartbeat for tab presence detection (optional feature)
        break;
    }
  };

  /**
   * Request logout across all tabs
   */
  requestLogout(): void {
    this.storage.broadcast('logout_requested', {
      sessionId: this.state.session?.sessionId,
    });
    this.endSession();
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearTimers();
    this.removeActivityTracking();
    
    if (this.crossTabUnsubscribe) {
      this.crossTabUnsubscribe();
      this.crossTabUnsubscribe = null;
    }
    
    this.stateListeners.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sessionManagerInstance: SessionManager | null = null;

/**
 * Get the session manager singleton
 */
export function getSessionManager(
  callbacks?: SessionEventCallbacks,
  config?: Partial<SessionConfig>
): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(callbacks, config);
  } else if (callbacks) {
    // Update callbacks on existing instance
    // This is a simplified approach - a more robust solution would
    // allow merging callbacks
    console.warn(
      '[SessionManager] Manager already exists. Use subscribe() to listen for state changes.'
    );
  }
  return sessionManagerInstance;
}

/**
 * Reset the session manager singleton (mainly for testing)
 */
export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.destroy();
    sessionManagerInstance = null;
  }
}

export { SessionManager };
