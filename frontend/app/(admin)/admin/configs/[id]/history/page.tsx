'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

type ConfigVersion = {
    version: string
    timestamp: string
    author: string
    changes: string[]
}

export default function ConfigHistoryPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [versions, setVersions] = useState<ConfigVersion[]>([])
    const [configName, setConfigName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadHistory()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, loadHistory])

    async function loadHistory() {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/configs/${params.id}/history`)

            if (!response.ok) {
                if (response.status === 403) {
                    router.push('/unauthorised')
                    return
                }
                throw new Error('Failed to load configuration history')
            }

            const data = await response.json()
            setVersions(data.versions || [])
            setConfigName(data.configName || params.id)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load history')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-muted-foreground">Loading history...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
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
                    <h1 className="text-3xl font-bold mb-2">Configuration History</h1>
                    <p className="text-muted-foreground">{configName}</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Back
                </Button>
            </div>

            {versions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No version history available</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {versions.map((version, index) => (
                        <Card key={`${version.version}-${index}`}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            Version {version.version}
                                            {index === 0 && <Badge variant="default">Current</Badge>}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {version.author} • {new Date(version.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {version.changes.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {version.changes.map((change, idx) => (
                                            <li key={idx}>{change}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No changes recorded</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
