import { StorageAdapter } from './interface';

let adapter: StorageAdapter | null = null;

export function setStorageAdapter(impl: StorageAdapter) {
    adapter = impl;
}

export function getStorage(): StorageAdapter {
    if (!adapter) {
        throw new Error("Storage adapter not initialized. Call setStorageAdapter() first.");
    }
    return adapter;
}

export * from './types';
export * from './interface';
