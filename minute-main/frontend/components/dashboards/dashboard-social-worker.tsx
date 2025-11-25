'use client'

import Link from 'next/link'
import { Plus, Mic, FileText } from 'lucide-react'
import { Button } from '@careminutes/ui'
import { PaginatedTranscriptions } from '@/components/recent-meetings/paginated-transcriptions'

const quickTemplates = [
  { name: 'Home Visit', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  { name: 'Initial Assessment', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  { name: 'Strategy Discussion', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
  { name: 'Supervision', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
]

export function DashboardSocialWorker() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 p-8 shadow-2xl shadow-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">Fast track</p>
            <h1 className="text-3xl font-semibold text-white">Record or write up a visit</h1>
            <p className="mt-2 text-white/80">
              One tap to start recording or jump straight into a template.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/new">
              <Button className="bg-white text-primary shadow-xl hover:bg-slate-100">
                <Mic className="mr-2 h-4 w-4" />
                Start recording
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" className="border-white/60 text-white hover:bg-white/10">
                <FileText className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Quick start</h2>
          <Link href="/templates">
            <span className="text-sm text-primary hover:underline">View all templates</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickTemplates.map((template) => (
            <Link href={`/new?template=${template.name}`} key={template.name}>
              <div
                className={`rounded-xl border ${template.color} p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
              >
                <div className="text-sm font-semibold">{template.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">Start a new note</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent meetings</h2>
          <Link href="/transcriptions" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <PaginatedTranscriptions />
      </section>

      <section className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Try the manager view toggle on a transcription to see a different layout.
      </section>
    </div>
  )
}
