import { test, expect, request } from '@playwright/test'

const backend = process.env.BACKEND_E2E_URL

test.describe('Capture -> transcription create (backend contract)', () => {
  test.skip(!backend, 'BACKEND_E2E_URL not set; skipping contract smoke')

  test('creates transcription with consent/offline metadata', async ({}) => {
    const api = await request.newContext({ baseURL: backend })
    const recordingResp = await api.post('/recordings', {
      data: { file_extension: 'webm', captured_offline: true },
    })
    expect(recordingResp.ok()).toBeTruthy()
    const { id, upload_url } = await recordingResp.json()

    // no actual upload to keep test lightweight; backend should accept missing body for smoke? adjust once spec requires upload

    const transResp = await api.post('/transcriptions', {
      data: {
        recording_id: id,
        template_name: 'General',
        case_reference: 'SMOKE-TEST',
        processing_mode: 'fast',
        meeting_mode: 'online',
        consent_ack: true,
      },
    })
    expect(transResp.ok()).toBeTruthy()
  })
})
