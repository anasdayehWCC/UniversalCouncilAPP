'use client'

import { useState } from 'react'
import { Button } from '@careminutes/ui'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react'
import { cn } from '@/lib/utils'

type Evidence = { excerpt: string; start_time?: number; end_time?: number; support: string }

export function SourceCheckButton({ minuteId, text }: { minuteId: string; text: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'supported' | 'partial' | 'unsupported' | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const statusMeta: Record<string, { label: string; tone: string; icon: JSX.Element }> = {
    supported: {
      label: 'Supported',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    partial: {
      label: 'Partially supported',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <ShieldQuestion className="h-4 w-4" />,
    },
    unsupported: {
      label: 'Not found',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <ShieldX className="h-4 w-4" />,
    },
  }

  const runCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proxy/minutes/${minuteId}/source-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('Source check failed')
      const data = await res.json()
      setStatus(data.status)
      setEvidence(data.evidence || [])
      setOpen(true)
    } catch {
      setStatus('unsupported')
      setEvidence([])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const meta = status ? statusMeta[status] : null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={runCheck}
        disabled={!text || loading}
        className="flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Source check
        {meta && (
          <Badge className={cn('border', meta.tone)}>
            {meta.icon}
            <span className="ml-1">{meta.label}</span>
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Source check</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {meta && (
              <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', meta.tone)}>
                {meta.icon}
                <span>{meta.label}</span>
              </div>
            )}
            {evidence.length === 0 && <p className="text-sm text-muted-foreground">No supporting excerpts found.</p>}
            {evidence.map((ev, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-800">{ev.excerpt}</p>
                <div className="mt-1 text-[11px] text-slate-500">
                  {ev.start_time !== undefined && `Start: ${ev.start_time.toFixed(1)}s `}
                  {ev.end_time !== undefined && `End: ${ev.end_time?.toFixed(1)}s`}
                </div>
                <Badge className="mt-2 bg-slate-100 text-slate-700">{ev.support}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
