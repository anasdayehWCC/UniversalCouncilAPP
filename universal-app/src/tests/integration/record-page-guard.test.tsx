import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { PERSONAS, MEETINGS, TEMPLATES } from '@/config/personas';

const useRecorderMock = vi.fn();

vi.mock('@/hooks/useRecorder', () => ({
  useRecorder: (...args: unknown[]) => useRecorderMock(...args),
  QUALITY_PRESETS: {
    low: { bitRate: 64000 },
    medium: { bitRate: 128000 },
    high: { bitRate: 256000 },
  },
}));

function createRecorderStub() {
  return {
    state: 'idle',
    duration: 0,
    formattedDuration: '00:00',
    audioLevel: {
      level: 0,
      peak: 0,
      average: 0,
      isClipping: false,
      isTooQuiet: true,
      timestamp: Date.now(),
    },
    waveformData: null,
    devices: [],
    selectedDeviceId: 'default',
    permission: {
      state: 'granted',
      hasRequested: true,
    },
    error: null,
    metadata: null,
    completedRecording: null,
    isSaving: false,
    autoSave: true,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn(),
    requestPermission: vi.fn().mockResolvedValue({
      state: 'granted',
      hasRequested: true,
    }),
    refreshDevices: vi.fn().mockResolvedValue(undefined),
    selectDevice: vi.fn(),
    saveToQueue: vi.fn().mockResolvedValue(1),
    clearError: vi.fn(),
    toggleAutoSave: vi.fn(),
    getWaveformData: vi.fn().mockReturnValue(null),
  };
}

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

async function renderRecordPage() {
  const [{ DemoProvider }, { NetworkStatusProvider }, { default: RecordPage }] = await Promise.all([
    import('@/context/DemoContext'),
    import('@/providers/NetworkStatusProvider'),
    import('@/app/record/page'),
  ]);

  let view: ReturnType<typeof render> | undefined;

  await act(async () => {
    view = render(
      <DemoProvider>
        <NetworkStatusProvider>
          <RecordPage />
        </NetworkStatusProvider>
      </DemoProvider>
    );
  });

  return view!;
}

describe('Record page guard', () => {
  const replace = vi.fn();
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    useRecorderMock.mockReset();
    useRecorderMock.mockReturnValue(createRecorderStub());
    replace.mockReset();

    process.env.NEXT_PUBLIC_API_URL = '/api/proxy';

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace,
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });

    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = getFetchUrl(input);

      if (url === '/api/demos/personas') {
        return {
          ok: true,
          json: async () => ({
            personas: PERSONAS,
            meetings: MEETINGS,
            templates: TEMPLATES,
          }),
        } as Response;
      }

      if (url === '/api/proxy/healthcheck') {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ status: 'ok' }),
        } as Response;
      }

      throw new Error(`Unhandled fetch: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('redirects signed-out fallback workers to login without rendering recorder UI', async () => {
    await renderRecordPage();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Recording Consent')).not.toBeInTheDocument();
    expect(useRecorderMock).not.toHaveBeenCalled();
  });

  it('redirects authenticated managers to the dashboard without rendering recorder UI', async () => {
    window.localStorage.setItem('currentUserId', 'david');
    window.localStorage.setItem('isAuthenticated', 'true');

    await renderRecordPage();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/');
    });

    expect(screen.queryByText('Recording Consent')).not.toBeInTheDocument();
    expect(useRecorderMock).not.toHaveBeenCalled();
  });

  it('renders the consent screen for authenticated social workers and only polls once', async () => {
    window.localStorage.setItem('currentUserId', 'sarah');
    window.localStorage.setItem('isAuthenticated', 'true');

    await renderRecordPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Recording Consent' })).toBeInTheDocument();
    });

    const healthcheckCalls = fetchMock.mock.calls.filter(([input]) => (
      getFetchUrl(input as RequestInfo | URL) === '/api/proxy/healthcheck'
    ));

    expect(replace).not.toHaveBeenCalled();
    expect(useRecorderMock).toHaveBeenCalled();
    expect(healthcheckCalls).toHaveLength(1);
  });
});
