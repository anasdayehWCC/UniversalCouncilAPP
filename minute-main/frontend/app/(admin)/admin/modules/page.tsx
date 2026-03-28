'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@careminutes/ui'
import { Badge } from '@careminutes/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Shield, Eye, FileText, Mic, Users, Layout, Activity, CheckSquare } from 'lucide-react'

type ModuleManifest = {
  id: string
  label: string
  icon?: string
  routes: string[]
  enabled: boolean
  feature_flags?: string[]
  permissions?: string[]
  dependencies?: string[]
}

type ConfigModule = {
  id: string
  enabled: boolean
  label?: string
  icon?: string
  departments?: string[]
}

type TenantConfig = {
  id: string
  name: string
  service_domain: string
  modules: ConfigModule[]
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Mic': Mic,
  'FileText': FileText,
  'Users': Users,
  'Layout': Layout,
  'Activity': Activity,
  'CheckSquare': CheckSquare,
  'Shield': Shield,
  'Eye': Eye,
}

const getIcon = (iconName?: string) => {
  if (!iconName) return FileText
  return ICON_MAP[iconName] || FileText
}

export default function AdminModulesPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<TenantConfig[]>([])
  const [moduleRegistry, setModuleRegistry] = useState<ModuleManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load all configs
      const configsResponse = await fetch('/api/proxy/admin/configs')
      if (!configsResponse.ok) {
        throw new Error('Failed to load configs')
      }
      const configsData = await configsResponse.json()
      
      // Load module registry (fall back to static list if endpoint not available)
      const registryModules: ModuleManifest[] = [
        { id: 'recordings', label: 'Recordings', icon: 'Mic', routes: ['/new', '/capture'], enabled: true },
        { id: 'transcription', label: 'Transcriptions', icon: 'FileText', routes: ['/transcriptions'], enabled: true },
        { id: 'minutes', label: 'Minutes', icon: 'FileText', routes: ['/transcriptions/[id]'], enabled: true, dependencies: ['transcription'] },
        { id: 'templates', label: 'Templates', icon: 'Layout', routes: ['/templates'], enabled: true },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', routes: ['/tasks'], enabled: true },
        { id: 'insights', label: 'Insights', icon: 'Activity', routes: ['/insights'], enabled: true },
        { id: 'admin', label: 'Admin', icon: 'Shield', routes: ['/admin'], enabled: true, permissions: ['admin'] },
      ]
      
      setModuleRegistry(registryModules)
      
      // Process configs to extract module data
      const processedConfigs = await Promise.all(
        (configsData.configs || []).map(async (cfg: { id: string; name: string }) => {
          try {
            const detailResponse = await fetch(`/api/proxy/admin/configs/${cfg.id}`)
            if (detailResponse.ok) {
              const detail = await detailResponse.json()
              return {
                id: cfg.id,
                name: detail.config?.name || cfg.name,
                service_domain: detail.config?.service_domain || 'unknown',
                modules: detail.config?.modules || [],
              }
            }
          } catch { /* ignore errors for individual configs */ }
          return {
            id: cfg.id,
            name: cfg.name,
            service_domain: 'unknown',
            modules: [],
          }
        })
      )
      
      setConfigs(processedConfigs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAdminAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/proxy/admin/check-access')
      const data = await response.json()

      if (!data.hasAccess) {
        router.push('/unauthorised')
        return
      }

      setHasAdminAccess(true)
      await loadData()
    } catch (err) {
      setError('Failed to verify admin access')
      console.error(err)
    }
  }, [loadData, router])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  const isModuleEnabled = (config: TenantConfig, moduleId: string): boolean => {
    const configModule = config.modules.find(m => m.id === moduleId)
    return configModule?.enabled ?? false
  }

  if (!hasAdminAccess && !error) {
    return null
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Dashboard</h1>
        <p className="text-muted-foreground">
          View module enablement across all tenant configurations
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading modules...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Module Registry */}
          <Card>
            <CardHeader>
              <CardTitle>Module Registry</CardTitle>
              <CardDescription>All available modules and their dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleRegistry.map((module) => {
                  const IconComponent = getIcon(module.icon)
                  return (
                    <div
                      key={module.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{module.label}</h3>
                          <code className="text-xs text-muted-foreground">{module.id}</code>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="text-muted-foreground">
                          Routes: {module.routes.join(', ')}
                        </div>
                        {module.dependencies && module.dependencies.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Deps:</span>
                            {module.dependencies.map((dep) => (
                              <Badge key={dep} variant="secondary" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {module.permissions && module.permissions.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Requires:</span>
                            {module.permissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Enablement Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Enablement Matrix</CardTitle>
              <CardDescription>Module status per tenant configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {configs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tenant configurations found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Tenant</th>
                        <th className="text-left py-3 px-4 font-medium">Domain</th>
                        {moduleRegistry.map((module) => (
                          <th key={module.id} className="text-center py-3 px-2 font-medium">
                            {module.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((config) => (
                        <tr key={config.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <a
                              href={`/admin/configs/${config.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {config.name}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{config.service_domain}</Badge>
                          </td>
                          {moduleRegistry.map((module) => {
                            const enabled = isModuleEnabled(config, module.id)
                            return (
                              <td key={module.id} className="text-center py-3 px-2">
                                {enabled ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{moduleRegistry.length}</div>
                <div className="text-sm text-muted-foreground">Total Modules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{configs.length}</div>
                <div className="text-sm text-muted-foreground">Tenant Configs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(configs.map(c => c.service_domain)).size}
                </div>
                <div className="text-sm text-muted-foreground">Service Domains</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
