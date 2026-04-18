'use client';

import { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useSyncManager as useSyncManagerImpl,
  type SyncManagerActions,
  type SyncManagerState,
  type UseSyncManagerReturn,
} from '@/hooks/useSyncManager';

export type { SyncManagerActions, SyncManagerState, UseSyncManagerReturn };

const SyncManagerContext = createContext<UseSyncManagerReturn | null>(null);

export function SyncManagerProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const syncManager = useSyncManagerImpl(accessToken);

  return (
    <SyncManagerContext.Provider value={syncManager}>
      {children}
    </SyncManagerContext.Provider>
  );
}

export function useSyncManager(): UseSyncManagerReturn {
  const ctx = useContext(SyncManagerContext);
  if (!ctx) {
    throw new Error(
      'useSyncManager must be used within <SyncManagerProvider>. ' +
      'Wrap your app (or the relevant subtree) in <SyncManagerProvider>.'
    );
  }
  return ctx;
}