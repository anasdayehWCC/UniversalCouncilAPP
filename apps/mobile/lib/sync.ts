import * as FileSystem from 'expo-file-system';
import { getStorage, OfflineRecording } from '@careminutes/core/storage';

const API_BASE = 'http://localhost:8080'; // TODO: Use env var

export async function syncAllQueued(token?: string) {
  const all = await getStorage().listRecordings();
  const queued = all.filter((r: OfflineRecording) => r.status === 'pending');
  
  console.log(`Found ${queued.length} pending recordings`);

  for (const recording of queued) {
    try {
      await getStorage().updateRecordingStatus(recording.id!, 'syncing');
      await syncQueuedRecording(recording, token);
      await getStorage().removeRecording(recording.id!);
      console.log(`Synced recording ${recording.id}`);
    } catch (err) {
      console.error(`Failed to sync recording ${recording.id}`, err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      await getStorage().updateRecordingStatus(recording.id!, 'failed', message);
    }
  }
}

async function syncQueuedRecording(recording: OfflineRecording, token?: string) {
    if (!recording.fileUri) {
        throw new Error('Missing fileUri on offline recording');
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // 1. Create recording entry
    const createResp = await fetch(`${API_BASE}/api/recordings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            file_extension: 'm4a', // expo-av default
            captured_offline: true
        }),
    });

    if (!createResp.ok) {
        throw new Error(`Failed to create recording: ${createResp.statusText}`);
    }

    const recordingJson = await createResp.json();

    // 2. Upload file
    console.log('Uploading file to', recordingJson.upload_url);
    const uploadResult = await FileSystem.uploadAsync(recordingJson.upload_url, recording.fileUri, {
        httpMethod: 'PUT',
        headers: {
            'x-ms-blob-type': 'BlockBlob', // Assuming Azure Blob Storage
            'Content-Type': 'audio/mp4', // m4a is mp4 audio
        }
    });

    if (uploadResult.status >= 400) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
    }

    // 3. Create transcription job
    const transcriptionBody = {
        recording_id: recordingJson.id,
        template_name: recording.metadata?.template_name || 'General',
        processing_mode: recording.metadata?.processing_mode || 'fast',
        // ... other metadata
    };

    const transResp = await fetch(`${API_BASE}/api/transcriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(transcriptionBody),
    });

    if (!transResp.ok) {
        throw new Error(`Failed to create transcription: ${transResp.statusText}`);
    }
}
