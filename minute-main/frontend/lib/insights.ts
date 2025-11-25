import { useQuery } from '@tanstack/react-query'

export type InsightsResponse = {
  status: string
  audio_minutes: number
  time_saved_minutes: number
  transcription_count: number
  minute_count: number
  avg_audio_minutes: number
  topics: { topic: string; count: number }[]
}

async function fetchInsights(): Promise<InsightsResponse> {
  const res = await fetch('/api/proxy/insights', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Unable to load insights')
  }
  return res.json()
}

export function useInsights() {
  return useQuery<InsightsResponse>({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    staleTime: 5 * 60 * 1000,
  })
}
