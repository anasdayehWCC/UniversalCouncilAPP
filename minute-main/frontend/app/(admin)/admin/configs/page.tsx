'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@careminutes/ui'
import { Button } from '@careminutes/ui'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCallback } from 'react'

type ConfigFile = {
    id: string
    name: string
    version: string
    lastModified: string
}

export default function AdminConfigPage() {
    const router = useRouter()
    const [configs, setConfigs] = useState<ConfigFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasAdminAccess, setHasAdminAccess] = useState(false)

    const loadConfigs = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/proxy/admin/configs')

            if (!response.ok) {
                throw new Error('Failed to load configs')
            }

            const data = await response.json()
            setConfigs(data.configs || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load configurations')
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
            await loadConfigs()
        } catch (err) {
            setError('Failed to verify admin access')
            console.error(err)
        }
    }, [loadConfigs, router])

    useEffect(() => {
        const run = async () => {
            await checkAdminAccess()
        }
        run()
        return () => {}
    }, [checkAdminAccess])

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
                <h1 className="text-3xl font-bold mb-2">Configuration Management</h1>
                <p className="text-muted-foreground">
                    View and manage tenant configurations with full audit trails
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading configurations...</p>
                </div>
            ) : configs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No configurations found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {configs.map((config) => (
                        <Card key={config.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{config.name}</CardTitle>
                                        <CardDescription>
                                            ID: {config.id} • Version: {config.version}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/configs/${config.id}`)}
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/configs/${config.id}/history`)}
                                        >
                                            History
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Last modified: {new Date(config.lastModified).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
