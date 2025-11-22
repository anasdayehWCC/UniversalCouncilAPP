'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

type ConfigDetail = {
    id: string
    name: string
    version: string
    defaultLocale: string
    modules: Array<{ id: string; enabled: boolean; label?: string }>
    retentionDaysDefault?: number
    sharepoint_library_path?: string
}

type AuditEntry = {
    id: string
    timestamp: string
    user: string
    action: string
    outcome: string
}

export default function ConfigDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [config, setConfig] = useState<ConfigDetail | null>(null)
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadConfigDetail() {
            try {
                setLoading(true)
                const [configRes, auditRes] = await Promise.all([
                    fetch(`/api/admin/configs/${id}`),
                    fetch(`/api/admin/configs/${id}/audit`),
                ])

                if (!configRes.ok) {
                    if (configRes.status === 403) {
                        router.push('/unauthorised')
                        return
                    }
                    throw new Error('Failed to load configuration')
                }

                const configData = await configRes.json()
                const auditData = auditRes.ok ? await auditRes.json() : { entries: [] }

                setConfig(configData)
                setAuditLog(auditData.entries || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load configuration details')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadConfigDetail()
    }, [id, router])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-muted-foreground">Loading configuration...</p>
            </div>
        )
    }

    if (error || !config) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertDescription>{error || 'Configuration not found'}</AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{config.name}</h1>
                    <p className="text-muted-foreground">Configuration ID: {config.id}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        Back
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/configs/${config.id}/history`)}
                    >
                        View History
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Version</p>
                                <p className="text-lg">{config.version}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Default Locale</p>
                                <p className="text-lg">{config.defaultLocale}</p>
                            </div>
                            {config.retentionDaysDefault && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Retention (Days)</p>
                                    <p className="text-lg">{config.retentionDaysDefault}</p>
                                </div>
                            )}
                            {config.sharepoint_library_path && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">SharePoint Path</p>
                                    <p className="text-lg font-mono text-sm">{config.sharepoint_library_path}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enabled Modules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {config.modules
                                .filter((m) => m.enabled)
                                .map((module) => (
                                    <Badge key={module.id} variant="secondary">
                                        {module.label || module.id}
                                    </Badge>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Audit Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {auditLog.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No audit events recorded</p>
                        ) : (
                            <div className="space-y-2">
                                {auditLog.slice(0, 10).map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between py-2 border-b last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{entry.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant={entry.outcome === 'success' ? 'default' : 'destructive'}>
                                            {entry.outcome}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
