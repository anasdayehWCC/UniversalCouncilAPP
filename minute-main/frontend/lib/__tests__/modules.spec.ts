import { getEnabledModules } from '../modules'
import { TenantConfig } from '../config/types'

const cfg: TenantConfig = {
  id: 'test',
  name: 'Test',
  defaultLocale: 'en-GB',
  modules: [
    { id: 'transcription', enabled: true },
    { id: 'minutes', enabled: true },
    { id: 'admin', enabled: true },
  ],
}

describe('getEnabledModules', () => {
  it('filters routes by service domain', () => {
    const res = getEnabledModules(cfg, 'children', 'social_worker')
    expect(res.find((m) => m.id === 'transcription')).toBeDefined()
  })

  it('filters routes by role permissions', () => {
    const res = getEnabledModules(cfg, null, 'social_worker')
    const admin = res.find((m) => m.id === 'admin')
    expect(admin?.routes.length).toBe(0)
  })
})
