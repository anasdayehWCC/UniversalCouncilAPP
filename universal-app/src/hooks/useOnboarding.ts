/**
 * useOnboarding Hook
 *
 * Manages onboarding tour state including completion tracking,
 * per-feature tours, and reset capabilities.
 *
 * @module hooks/useOnboarding
 */

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import type { TourStep } from '@/components/help/OnboardingTour';

// ============================================================================
// Types
// ============================================================================

export interface OnboardingState {
  /** Whether this onboarding has been completed */
  completed: boolean;
  /** Timestamp of last completion */
  completedAt?: string;
  /** Whether user skipped this onboarding */
  skipped: boolean;
  /** Last step viewed (for resuming) */
  lastStepIndex?: number;
  /** Number of times tour was started */
  startCount: number;
  /** Version of the tour (for re-triggering after updates) */
  version: number;
}

export interface OnboardingConfig {
  /** Unique ID for this onboarding flow */
  id: string;
  /** Tour steps */
  steps: TourStep[];
  /** Current version - increment to re-trigger tour for existing users */
  version?: number;
  /** Show once per session instead of persisting indefinitely */
  sessionOnly?: boolean;
  /** Delay before showing tour (ms) */
  showDelay?: number;
  /** Require specific feature flag to be enabled */
  featureFlag?: string;
  /** Only show if user matches role */
  requiredRole?: string;
}

export interface UseOnboardingReturn {
  /** Whether the tour should be shown */
  isActive: boolean;
  /** Current onboarding state */
  state: OnboardingState;
  /** Start the onboarding tour */
  start: () => void;
  /** Mark onboarding as complete */
  complete: () => void;
  /** Mark onboarding as skipped */
  skip: () => void;
  /** Reset onboarding state (show again) */
  reset: () => void;
  /** Update progress to specific step */
  setStep: (stepIndex: number) => void;
  /** The tour steps */
  steps: TourStep[];
  /** Current step index */
  currentStep: number;
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = 'onboarding_state';
const SESSION_STORAGE_KEY = 'onboarding_session_state';

interface StoredOnboarding {
  [id: string]: OnboardingState;
}

function getStorage(sessionOnly = false): Storage | null {
  if (typeof window === 'undefined') return null;
  return sessionOnly ? sessionStorage : localStorage;
}

function getStoredState(id: string, sessionOnly = false): OnboardingState | null {
  const storage = getStorage(sessionOnly);
  if (!storage) return null;

  try {
    const key = sessionOnly ? SESSION_STORAGE_KEY : STORAGE_KEY;
    const stored = storage.getItem(key);
    if (!stored) return null;
    const parsed: StoredOnboarding = JSON.parse(stored);
    return parsed[id] || null;
  } catch {
    return null;
  }
}

function setStoredState(
  id: string,
  state: OnboardingState,
  sessionOnly = false
): void {
  const storage = getStorage(sessionOnly);
  if (!storage) return;

  try {
    const key = sessionOnly ? SESSION_STORAGE_KEY : STORAGE_KEY;
    const stored = storage.getItem(key);
    const parsed: StoredOnboarding = stored ? JSON.parse(stored) : {};
    parsed[id] = state;
    storage.setItem(key, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

function removeStoredState(id: string, sessionOnly = false): void {
  const storage = getStorage(sessionOnly);
  if (!storage) return;

  try {
    const key = sessionOnly ? SESSION_STORAGE_KEY : STORAGE_KEY;
    const stored = storage.getItem(key);
    if (!stored) return;
    const parsed: StoredOnboarding = JSON.parse(stored);
    delete parsed[id];
    storage.setItem(key, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  skipped: false,
  startCount: 0,
  version: 1,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to manage onboarding tour state.
 *
 * @example
 * ```tsx
 * const { isActive, start, complete, skip, steps } = useOnboarding({
 *   id: 'main-tour',
 *   steps: [
 *     { id: 'step1', title: 'Welcome', content: 'Let us show you around!' },
 *     { id: 'step2', target: '#record', title: 'Recording', content: '...' },
 *   ],
 *   version: 1,
 * });
 *
 * return (
 *   <>
 *     <OnboardingTour
 *       steps={steps}
 *       isActive={isActive}
 *       onComplete={complete}
 *       onSkip={skip}
 *     />
 *     <button onClick={start}>Restart Tour</button>
 *   </>
 * );
 * ```
 */
export function useOnboarding(config: OnboardingConfig): UseOnboardingReturn {
  const { id, steps, version = 1, sessionOnly = false, showDelay = 0 } = config;

  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load stored state on mount
  useEffect(() => {
    const stored = getStoredState(id, sessionOnly);

    if (stored) {
      // Check if version changed - if so, reset completion
      if (stored.version < version) {
        const updatedState: OnboardingState = {
          ...DEFAULT_STATE,
          startCount: stored.startCount,
          version,
        };
        setState(updatedState);
        setStoredState(id, updatedState, sessionOnly);
      } else {
        setState(stored);
        if (stored.lastStepIndex !== undefined) {
          setCurrentStep(stored.lastStepIndex);
        }
      }
    } else {
      setState({ ...DEFAULT_STATE, version });
    }

    setIsInitialized(true);
  }, [id, version, sessionOnly]);

  // Auto-show tour for new users after delay
  useEffect(() => {
    if (!isInitialized) return;
    if (state.completed || state.skipped) return;
    if (isActive) return;
    if (state.startCount > 0) return; // Don't auto-start if already started before

    const timer = setTimeout(() => {
      setIsActive(true);
      setState((prev) => {
        const updated = { ...prev, startCount: prev.startCount + 1 };
        setStoredState(id, updated, sessionOnly);
        return updated;
      });
    }, showDelay);

    return () => clearTimeout(timer);
  }, [id, isInitialized, state.completed, state.skipped, state.startCount, isActive, showDelay, sessionOnly]);

  // Start the tour manually
  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setState((prev) => {
      const updated = {
        ...prev,
        startCount: prev.startCount + 1,
        lastStepIndex: 0,
      };
      setStoredState(id, updated, sessionOnly);
      return updated;
    });
  }, [id, sessionOnly]);

  // Mark tour as complete
  const complete = useCallback(() => {
    setIsActive(false);
    setState((prev) => {
      const updated: OnboardingState = {
        ...prev,
        completed: true,
        completedAt: new Date().toISOString(),
        skipped: false,
        lastStepIndex: undefined,
      };
      setStoredState(id, updated, sessionOnly);
      return updated;
    });
  }, [id, sessionOnly]);

  // Mark tour as skipped
  const skip = useCallback(() => {
    setIsActive(false);
    setState((prev) => {
      const updated: OnboardingState = {
        ...prev,
        skipped: true,
        lastStepIndex: currentStep,
      };
      setStoredState(id, updated, sessionOnly);
      return updated;
    });
  }, [id, currentStep, sessionOnly]);

  // Reset tour (allow showing again)
  const reset = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    const updated: OnboardingState = {
      ...DEFAULT_STATE,
      version,
      startCount: state.startCount,
    };
    setState(updated);
    setStoredState(id, updated, sessionOnly);
  }, [id, version, state.startCount, sessionOnly]);

  // Update current step
  const setStep = useCallback(
    (stepIndex: number) => {
      setCurrentStep(stepIndex);
      setState((prev) => {
        const updated = { ...prev, lastStepIndex: stepIndex };
        setStoredState(id, updated, sessionOnly);
        return updated;
      });
    },
    [id, sessionOnly]
  );

  return {
    isActive,
    state,
    start,
    complete,
    skip,
    reset,
    setStep,
    steps,
    currentStep,
  };
}

// ============================================================================
// Multi-Tour Management
// ============================================================================

/**
 * Reset all onboarding tours
 */
export function resetAllOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Check if any tour is pending (not completed or skipped)
 */
export function hasUnseenOnboarding(ids: string[]): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true; // No state = unseen

    const parsed: StoredOnboarding = JSON.parse(stored);

    return ids.some((id) => {
      const state = parsed[id];
      return !state || (!state.completed && !state.skipped);
    });
  } catch {
    return true;
  }
}

/**
 * Get completion status for multiple tours
 */
export function getOnboardingStatuses(
  ids: string[]
): Record<string, OnboardingState | null> {
  const result: Record<string, OnboardingState | null> = {};

  for (const id of ids) {
    result[id] = getStoredState(id, false);
  }

  return result;
}

// ============================================================================
// Predefined Tour Configurations
// ============================================================================

/**
 * Main app onboarding tour steps
 */
export const MAIN_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the App',
    content:
      "Let us show you around! This quick tour will help you get started with recording meetings and generating minutes.",
    placement: 'center',
    nextLabel: 'Get Started',
  },
  {
    id: 'record-button',
    target: '[data-tour="record-button"]',
    title: 'Start Recording',
    content:
      'Tap this button to begin recording your meeting. The app will capture audio and prepare it for transcription.',
    placement: 'bottom',
    spotlight: true,
  },
  {
    id: 'case-reference',
    target: '[data-tour="case-reference"]',
    title: 'Enter Case Details',
    content:
      'Before recording, enter the case reference number. This links your recording to the correct case in your system.',
    placement: 'bottom',
    spotlight: true,
  },
  {
    id: 'template-select',
    target: '[data-tour="template-select"]',
    title: 'Choose a Template',
    content:
      'Select the template that matches your meeting type. The AI will structure your minutes according to this template.',
    placement: 'right',
    spotlight: true,
  },
  {
    id: 'offline-indicator',
    target: '[data-tour="offline-indicator"]',
    title: 'Works Offline',
    content:
      "Your recordings are saved locally and sync automatically when you're back online. No data is ever lost.",
    placement: 'bottom',
    spotlight: true,
  },
  {
    id: 'help-resources',
    target: '[data-tour="help-button"]',
    title: 'Need Help?',
    content:
      'Look for these help icons throughout the app. Click them for guidance on any feature.',
    placement: 'left',
    spotlight: true,
    nextLabel: 'Finish Tour',
  },
];

/**
 * Recording flow tutorial
 */
export const RECORDING_TOUR_STEPS: TourStep[] = [
  {
    id: 'mic-check',
    target: '[data-tour="mic-visualizer"]',
    title: 'Check Your Audio',
    content:
      'Make sure the audio levels are showing. Speak to test your microphone before starting the actual recording.',
    placement: 'top',
    spotlight: true,
  },
  {
    id: 'pause-controls',
    target: '[data-tour="pause-button"]',
    title: 'Pause Anytime',
    content:
      'Use this button to pause during breaks. Your recording will continue seamlessly when you resume.',
    placement: 'bottom',
    spotlight: true,
  },
  {
    id: 'finish-recording',
    target: '[data-tour="stop-button"]',
    title: 'Finish Recording',
    content:
      "When you're done, tap this button to stop. Your recording will be processed and a transcript generated.",
    placement: 'top',
    spotlight: true,
    nextLabel: 'Got It',
  },
];

// ============================================================================
// Hook for Specific Tours
// ============================================================================

/**
 * Hook for the main app onboarding tour
 */
export function useMainOnboarding() {
  return useOnboarding({
    id: 'main-tour',
    steps: MAIN_TOUR_STEPS,
    version: 1,
    showDelay: 1000, // Show after 1 second for new users
  });
}

/**
 * Hook for the recording tutorial
 */
export function useRecordingOnboarding() {
  return useOnboarding({
    id: 'recording-tour',
    steps: RECORDING_TOUR_STEPS,
    version: 1,
    sessionOnly: false,
  });
}
