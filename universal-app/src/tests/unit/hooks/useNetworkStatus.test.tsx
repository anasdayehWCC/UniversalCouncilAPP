import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useNetworkStatus', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = '/api/proxy';
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
      })
    );
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('checks the backend healthcheck endpoint by default', async () => {
    const { useNetworkStatus } = await import('@/hooks/useNetworkStatus');

    renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/proxy/healthcheck',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });
});
