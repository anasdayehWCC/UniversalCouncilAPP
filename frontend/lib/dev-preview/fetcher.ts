"use client"

import transcriptions from './fixtures/transcriptions.json'
import templates from './fixtures/templates.json'
import user from './fixtures/user.json'

const fixtures = {
  '/transcriptions': transcriptions,
  '/templates': templates,
  '/user-templates': [],
  '/users/me': user,
}

export type PreviewFetch = typeof fetch

export const devPreviewFetch: PreviewFetch = async (input, init) => {
  const enabled =
    process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === 'true' ||
    process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === '1'

  if (!enabled) {
    return fetch(input as RequestInfo, init)
  }

  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  let path = url.replace(/^https?:\/\/[^/]+/i, '')
  path = path.replace(/^\/api\/proxy/, '')

  // Serve fixtures by path prefix
  const matchKey = Object.keys(fixtures).find((key) => path.startsWith(key))
  if (matchKey) {
    return new Response(JSON.stringify(fixtures[matchKey as keyof typeof fixtures]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fallback to real fetch for anything else
  return fetch(input as RequestInfo, init)
}
