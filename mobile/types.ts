export type ModuleConfig = {
  id: string
  enabled: boolean
  label?: string | null
  departments?: string[] | null
}

export type TenantConfig = {
  id: string
  name: string
  modules: ModuleConfig[]
  defaultLocale?: string
}
