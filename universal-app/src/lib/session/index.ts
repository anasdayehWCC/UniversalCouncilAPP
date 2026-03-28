/**
 * Session Management Module
 *
 * Provides comprehensive session management for the Universal Council App,
 * including secure storage, cross-tab sync, and idle timeout handling.
 *
 * @module lib/session
 *
 * @example
 * ```tsx
 * // In your component
 * import { useSession } from '@/hooks/useSession';
 * 
 * function MyComponent() {
 *   const { isActive, timeUntilExpiry, extendSession, logout } = useSession();
 *   
 *   if (!isActive) {
 *     return <Login />;
 *   }
 *   
 *   return <App />;
 * }
 * ```
 */

// Types
export type {
  SessionData,
  SessionStatus,
  SessionConfig,
  SessionManagerState,
  SessionEventCallbacks,
  ActivityEventType,
  CrossTabMessage,
  CrossTabMessageType,
  ISessionStorage,
} from './types';

export { DEFAULT_SESSION_CONFIG } from './types';

// Storage
export {
  SecureSessionStorage,
  CrossTabChannel,
  getSessionStorage,
  getCrossTabChannel,
  getDeviceId,
} from './storage';

// Manager
export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from './manager';
