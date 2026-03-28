'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@careminutes/ui'
import { Badge } from '@careminutes/ui/badge'
import { Button } from '@careminutes/ui'
import { Input } from '@careminutes/ui'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@careminutes/ui/select'
import { Download, Filter, RefreshCw, Clock, User, FileText } from 'lucide-react'
import { Skeleton } from '@careminutes/ui'

type AuditEvent = {
  id: string
  user_id: string
  user_email?: string
  action: string
  resource_type: string
  resource_id: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

type AuditFilters = {
  userId?: string
  resourceType?: string
  action?: string
  startDate?: string
  endDate?: string
}

const ACTION_COLORS: Record<string, string> = {
  'create': 'bg-green-500/10 text-green-600',
  'read': 'bg-blue-500/10 text-blue-600',
  'update': 'bg-yellow-500/10 text-yellow-600',
  'delete': 'bg-red-500/10 text-red-600',
  'export': 'bg-purple-500/10 text-purple-600',
  'login': 'bg-cyan-500/10 text-cyan-600',
  'logout': 'bg-gray-500/10 text-gray-600',
}

const RESOURCE_TYPES = [
  'transcription',
  'minute',
  'recording',
  'template',
  'config',
  'user',
  'task',
]

const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'login',
  'logout',
  'view',
  'download',
]

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<AuditPageSkeleton />}>
      <AdminAuditPageContent />
    </Suspense>
  )
}

function AuditPageSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}

function AdminAuditPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  
  const [filters, setFilters] = useState<AuditFilters>({
    userId: searchParams.get('userId') || undefined,
    resourceType: searchParams.get('resourceType') || undefined,
    action: searchParams.get('action') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  })

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('page_size', pageSize.toString())
      if (filters.userId) params.set('user_id', filters.userId)
      if (filters.resourceType) params.set('resource_type', filters.resourceType)
      if (filters.action) params.set('action', filters.action)
      if (filters.startDate) params.set('start_date', filters.startDate)
      if (filters.endDate) params.set('end_date', filters.endDate)
      
      const response = await fetch(`/api/proxy/admin/audit?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load audit events')
      }
      
      const data = await response.json()
      setEvents(data.events || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit events')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  const checkAdminAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/proxy/admin/check-access')
      const data = await response.json()

      if (!data.hasAccess) {
        router.push('/unauthorised')
        return
      }

      setHasAdminAccess(true)
      await loadEvents()
    } catch (err) {
      setError('Failed to verify admin access')
      console.error(err)
    }
  }, [loadEvents, router])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams()
      params.set('format', format)
      if (filters.userId) params.set('user_id', filters.userId)
      if (filters.resourceType) params.set('resource_type', filters.resourceType)
      if (filters.action) params.set('action', filters.action)
      if (filters.startDate) params.set('start_date', filters.startDate)
      if (filters.endDate) params.set('end_date', filters.endDate)
      
      const response = await fetch(`/api/proxy/admin/audit/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to export audit data')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
          <p className="text-muted-foreground">
            View and export system audit events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadEvents()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">User ID</label>
              <Input
                placeholder="Filter by user..."
                value={filters.userId || ''}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Resource Type</label>
              <Select
                value={filters.resourceType || 'all'}
                onValueChange={(v) => setFilters({ ...filters, resourceType: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(v) => setFilters({ ...filters, action: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { setPage(1); loadEvents() }}>Apply Filters</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({})
                setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Events</span>
            <Badge variant="secondary">{totalCount} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No audit events found
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 font-medium">Time</th>
                      <th className="py-3 px-4 font-medium">User</th>
                      <th className="py-3 px-4 font-medium">Action</th>
                      <th className="py-3 px-4 font-medium">Resource</th>
                      <th className="py-3 px-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatDate(event.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {event.user_email || event.user_id}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={ACTION_COLORS[event.action] || 'bg-gray-500/10'}>
                            {event.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{event.resource_type}</span>
                            <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                              {event.resource_id.substring(0, 8)}...
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {event.details && Object.keys(event.details).length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-primary">View details</summary>
                              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-w-md">
                                {JSON.stringify(event.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= totalCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
