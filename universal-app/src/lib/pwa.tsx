'use client';

import { useEffect } from 'react';

const SW_PATH = '/sw.js';
const SW_SCOPE = '/';
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

let updateIntervalId: number | null = null;

function shouldEnableServiceWorker(): boolean {
  return process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  if (!shouldEnableServiceWorker()) {
    console.log('[PWA] Service worker disabled in development');
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    const registration = existing ?? await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE,
      updateViaCache: 'none',
    });

    if (!existing) {
      console.log('[PWA] Service worker registered:', registration.scope);
    }

    await navigator.serviceWorker.ready;

    if (!updateIntervalId) {
      updateIntervalId = window.setInterval(() => {
        registration.update();
      }, UPDATE_INTERVAL_MS);
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Service Worker Registration Component
 * 
 * Handles PWA service worker registration and updates.
 * Should be included once in the app layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    registerServiceWorker().then((registration) => {
      if (!registration) return;

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New content available, refresh to update');

            window.dispatchEvent(new CustomEvent('sw-update-available', {
              detail: { registration },
            }));
          }
        });
      });
    });

    // Request persistent storage
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist().then((granted) => {
        console.log('[PWA] Persistent storage:', granted ? 'granted' : 'denied');
      });
    }

    // Request notification permission (if supported)
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't request immediately, wait for user interaction
      // This is handled by specific features that need notifications
    }
  }, []);

  return null;
}

/**
 * Hook to check if app is running in standalone mode (installed PWA)
 */
export function useIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Hook to check current network status
 */
export function useNetworkStatus() {
  if (typeof window === 'undefined') {
    return { online: true, effectiveType: 'unknown' };
  }

  const connection = (navigator as Navigator & { 
    connection?: { effectiveType: string } 
  }).connection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
  };
}
