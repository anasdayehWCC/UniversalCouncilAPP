/**
 * PWA Update Notification Component
 * 
 * Shows a toast when a new service worker is available,
 * allowing users to update the app.
 */

'use client';

import { useEffect, useState } from 'react';

interface UpdateNotificationProps {
  /** Custom message to display */
  message?: string;
  /** Position of the notification */
  position?: 'top' | 'bottom';
}

export function PWAUpdateNotification({
  message = 'A new version is available!',
  position = 'bottom',
}: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent<{ registration: ServiceWorkerRegistration }>) => {
      setUpdateAvailable(true);
      setRegistration(event.detail.registration);
    };

    window.addEventListener('sw-update-available', handleUpdate as EventListener);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate as EventListener);
    };
  }, []);

  const handleUpdate = async () => {
    if (!registration?.waiting) return;

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page when the new service worker takes over
    registration.waiting.addEventListener('statechange', (e) => {
      if ((e.target as ServiceWorker).state === 'activated') {
        window.location.reload();
      }
    });
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  const positionClasses = position === 'top'
    ? 'top-4 left-1/2 -translate-x-1/2'
    : 'bottom-4 left-1/2 -translate-x-1/2';

  return (
    <div
      role="alert"
      className={`fixed ${positionClasses} z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-slate-200 animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-sm font-medium text-slate-700">{message}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleUpdate}
          className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          Update
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Install Prompt Component
 * 
 * Shows an install prompt for browsers that support A2HS (Add to Home Screen).
 */
export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    const result = await installPrompt.prompt();
    
    if (result.outcome === 'accepted') {
      console.log('[PWA] App installed');
    }

    setInstallPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Check if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible || !installPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">Install Council Minutes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add to your home screen for quick access and offline support.
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
    'sw-update-available': CustomEvent<{ registration: ServiceWorkerRegistration }>;
  }
}
