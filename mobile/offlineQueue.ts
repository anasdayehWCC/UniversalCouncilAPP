import AsyncStorage from "@react-native-async-storage/async-storage"

export type OfflineItem = {
  id: string
  uri: string
  createdAt: number
  metadata?: Record<string, unknown>
}

const KEY = "offlineQueue"

const load = async (): Promise<OfflineItem[]> => {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

const save = async (items: OfflineItem[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(items))
}

export const enqueue = async (item: OfflineItem) => {
  const items = await load()
  items.push(item)
  await save(items)
}

export const listQueue = async () => {
  return await load()
}

export const dequeue = async (id: string) => {
  const items = await load()
  const next = items.filter((i) => i.id !== id)
  await save(next)
}
