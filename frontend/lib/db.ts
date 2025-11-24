import { CareMinutesDB, DexieStorageAdapter } from '@careminutes/core/storage/adapters/dexie';
import { setStorageAdapter } from '@careminutes/core/storage';

// Create the Dexie instance (for useLiveQuery compatibility)
export const db = new CareMinutesDB();

// Create the adapter using this instance
const adapter = new DexieStorageAdapter(db);

// Register it
setStorageAdapter(adapter);

// Re-export types
export type { OfflineRecording } from '@careminutes/core/storage/types';
