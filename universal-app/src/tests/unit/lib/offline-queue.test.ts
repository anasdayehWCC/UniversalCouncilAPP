import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('offline queue auth headers', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = '/api/proxy';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    vi.restoreAllMocks();
  });

  it('omits the Authorization header when syncing without a token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: 'recording-1', upload_url: 'https://upload.test/blob' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: 'transcription-1' }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const { syncQueuedRecording } = await import('@/lib/offline-queue');

    await syncQueuedRecording(
      {
        blob: new Blob(['audio'], { type: 'audio/webm' }),
        fileName: 'meeting.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
        metadata: {
          case_reference: 'CASE-001',
          template_name: 'General',
        },
      },
      null
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/recordings',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      })
    );
  });

  it('includes the Authorization header when a token is provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: 'recording-1', upload_url: 'https://upload.test/blob' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: 'transcription-1' }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const { syncQueuedRecording } = await import('@/lib/offline-queue');

    await syncQueuedRecording(
      {
        blob: new Blob(['audio'], { type: 'audio/webm' }),
        fileName: 'meeting.webm',
        mimeType: 'audio/webm',
        createdAt: new Date(),
        status: 'pending',
        metadata: {
          case_reference: 'CASE-001',
          template_name: 'General',
        },
      },
      'access-token'
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/recordings',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      })
    );
  });
});
