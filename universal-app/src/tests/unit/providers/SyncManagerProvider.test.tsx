import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const useSyncManagerImplMock = vi.fn();

vi.mock('@/hooks/useSyncManager', () => ({
  useSyncManager: (...args: unknown[]) => useSyncManagerImplMock(...args),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    accessToken: 'demo-token',
  }),
}));

function buildSyncState() {
  return {
    isOnline: true,
    isSyncing: false,
    pendingCount: 2,
    failedCount: 0,
    pendingRecordings: [],
    pendingSyncOperations: [],
    lastSyncAt: null,
    lastSyncText: null,
    autoSyncEnabled: true,
    syncAll: vi.fn(),
    retryFailedItems: vi.fn(),
    setAutoSyncEnabled: vi.fn(),
    refreshStats: vi.fn(),
  };
}

describe('SyncManagerProvider', () => {
  beforeEach(() => {
    useSyncManagerImplMock.mockReset();
    useSyncManagerImplMock.mockReturnValue(buildSyncState());
  });

  it('shares one sync manager instance across multiple consumers', async () => {
    const { SyncManagerProvider, useSyncManager } = await import('@/providers/SyncManagerProvider');

    function Probe({ testId }: { testId: string }) {
      const { pendingCount } = useSyncManager();
      return <div data-testid={testId}>{pendingCount}</div>;
    }

    render(
      <SyncManagerProvider>
        <Probe testId="first" />
        <Probe testId="second" />
      </SyncManagerProvider>
    );

    expect(screen.getByTestId('first')).toHaveTextContent('2');
    expect(screen.getByTestId('second')).toHaveTextContent('2');
    expect(useSyncManagerImplMock).toHaveBeenCalledTimes(1);
    expect(useSyncManagerImplMock).toHaveBeenCalledWith('demo-token');
  });
});