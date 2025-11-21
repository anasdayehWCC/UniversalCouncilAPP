'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type CaseCacheItem = {
  case_reference: string
  service_domain_id?: string | null
  hashed_ref: string
  last_used: string
}

type CaseCacheContextType = {
  addCase: (input: { case_reference: string; service_domain_id?: string | null }) => Promise<void>
  recentCases: CaseCacheItem[]
}

const CaseCacheContext = createContext<CaseCacheContextType | undefined>(undefined)

const DB_NAME = 'MinuteDB'
const DB_VERSION = 2
const STORE_NAME = 'cases'

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashReference(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

export const CaseCacheProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [recentCases, setRecentCases] = useState<CaseCacheItem[]>([])

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains('recordings')) {
        database.createObjectStore('recordings', { keyPath: 'recording_id' })
      }
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'case_reference' })
        store.createIndex('service_domain_id', 'service_domain_id', { unique: false })
        store.createIndex('last_used', 'last_used', { unique: false })
      }
    }
    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result)
    }
  }, [])

  const refreshCases = useCallback(() => {
    if (!db) return
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const items = (request.result as CaseCacheItem[]) || []
      setRecentCases(items.sort((a, b) => b.last_used.localeCompare(a.last_used)).slice(0, 10))
    }
  }, [db])

  useEffect(() => {
    refreshCases()
  }, [refreshCases])

  const addCase = useCallback(
    async ({ case_reference, service_domain_id }: { case_reference: string; service_domain_id?: string | null }) => {
      if (!db) return
      const hashed_ref = await hashReference(case_reference.trim())
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({
        case_reference: case_reference.trim(),
        service_domain_id: service_domain_id ?? null,
        hashed_ref,
        last_used: new Date().toISOString(),
      })
      tx.oncomplete = () => refreshCases()
    },
    [db, refreshCases]
  )

  const value = useMemo(
    () => ({
      addCase,
      recentCases,
    }),
    [addCase, recentCases]
  )

  return <CaseCacheContext.Provider value={value}>{children}</CaseCacheContext.Provider>
}

export const useCaseCache = () => {
  const ctx = useContext(CaseCacheContext)
  if (!ctx) throw new Error('useCaseCache must be used within CaseCacheProvider')
  return ctx
}
