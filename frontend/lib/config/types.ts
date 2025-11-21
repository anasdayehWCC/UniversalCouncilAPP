export type ModuleConfig = {
  id: string
  enabled: boolean
  departments?: string[] | null
}

export type TenantConfig = {
  id: string
  name: string
  defaultLocale: string
  designTokens?: Record<string, string | number> | null
  modules: ModuleConfig[]
}
