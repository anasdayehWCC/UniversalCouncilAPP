import { TenantConfig } from './types'

export const fallbackTenantConfig: TenantConfig = {
  id: 'fallback',
  name: 'Fallback Council',
  defaultLocale: 'en-GB',
  designTokens: null,
  modules: [
    { id: 'transcription', enabled: true },
    { id: 'minutes', enabled: true },
  ],
}
