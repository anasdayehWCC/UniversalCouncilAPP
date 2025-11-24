import { getStorage, OfflineRecording, QueueMeta } from '@careminutes/core/storage'

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_HOST ||
  process.env.BACKEND_HOST ||
  'http://localhost:8080'

export async function queueRecording(blob: Blob, meta: QueueMeta, fileName?: string) {
  const derivedName =
    fileName ||
    (blob instanceof File && blob.name) ||
    (meta.template_name ? `${meta.template_name}.webm` : 'recording.webm')
  const record: OfflineRecording = {
    blob,
    fileName: derivedName,
    mimeType: blob.type || 'audio/webm',
    createdAt: new Date(),
    status: 'pending',
    case_reference: meta.case_reference,
    metadata: meta,
  }
  return getStorage().addRecording(record)
}

export async function listQueued() {
  return getStorage().listRecordings()
}

export async function clearQueued(id: number) {
  return getStorage().removeRecording(id)
}

export async function markStatus(id: number, status: OfflineRecording['status'], error?: string) {
  return getStorage().updateRecordingStatus(id, status, error)
}

async function uploadBlob(uploadUrl: string, blob: Blob) {
  const headers: Record<string, string> = {}
  // Azure blob requires type header; S3 accepts content-type
  if (uploadUrl.includes('blob.core.windows.net')) {
    headers['x-ms-blob-type'] = 'BlockBlob'
  }
  if (blob.type) {
    headers['Content-Type'] = blob.type
  }
  const res = await fetch(uploadUrl, { method: 'PUT', body: blob, headers })
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`)
  }
}

async function withBackoff<T>(fn: () => Promise<T>, attempts = 3, base = 500): Promise<T> {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const delay = base * 2 ** i
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

function getExtension(fileName: string) {
  return fileName.includes('.') ? fileName.split('.').pop() || 'webm' : 'webm'
}

export async function syncQueuedRecording(recording: OfflineRecording, token: string) {
  if (!recording.metadata) {
    throw new Error('Missing metadata on offline recording')
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const recordingResp = await withBackoff(async () => {
    const resp = await fetch(`${API_BASE}/recordings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ file_extension: getExtension(recording.fileName), captured_offline: true }),
    })
    if (!resp.ok) {
      throw new Error(`Failed to create recording: ${resp.statusText}`)
    }
    return resp
  })
  const recordingJson = await recordingResp.json()
  await withBackoff(() => uploadBlob(recordingJson.upload_url, recording.blob))

  const transcriptionBody = {
    recording_id: recordingJson.id,
    template_name: recording.metadata.template_name || 'General',
    template_id: recording.metadata.template_id,
    agenda: recording.metadata.agenda,
    case_reference: recording.metadata.case_reference,
    worker_team: recording.metadata.worker_team,
    subject_initials: recording.metadata.subject_initials,
    subject_dob: recording.metadata.subject_dob,
    processing_mode: recording.metadata.processing_mode || 'fast',
    visit_type: recording.metadata.visit_type,
    intended_outcomes: recording.metadata.intended_outcomes,
    risk_flags: recording.metadata.risk_flags,
  }
  const transcriptionResp = await withBackoff(async () => {
    const resp = await fetch(`${API_BASE}/transcriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transcriptionBody),
    })
    if (!resp.ok) {
      throw new Error(`Failed to create transcription: ${resp.statusText}`)
    }
    return resp
  })
  return transcriptionResp.json()
}

export async function syncAllQueued(token: string) {
  const all = await getStorage().listRecordings()
  const queued = all.filter((r) => r.status === 'pending')
  for (const recording of queued) {
    try {
      await markStatus(recording.id!, 'syncing')
      await syncQueuedRecording(recording, token)
      await clearQueued(recording.id!)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await markStatus(recording.id!, 'failed', message)
    }
  }

  try {
    recordLastSync()
  } catch (err) {
    // non-fatal; ignore storage errors
    console.warn('unable to record last sync time', err)
  }
}

const LAST_SYNC_KEY = 'offlineQueue:lastSync'

export function recordLastSync() {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
  } catch (err) {
    console.warn('unable to persist last sync', err)
  }
}

export function getLastSync(): Date | null {
  if (typeof localStorage === 'undefined') return null
  const value = localStorage.getItem(LAST_SYNC_KEY)
  if (!value) return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}
