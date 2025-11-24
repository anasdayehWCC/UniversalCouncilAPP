"use client"

import { DataRetentionNotice } from '@/components/layout/DataRententionNotice'
import { PosthogBanner } from '@/components/posthog-banner'
import { PaginatedTranscriptions } from '@/components/recent-meetings/paginated-transcriptions'
import { Button } from '@careminutes/ui'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto max-w-6xl px-8 py-12">
      <DataRetentionNotice />
      <PosthogBanner />

      {/* Hero Section - PREMIUM REDESIGN */}
      <div className="mb-12 rounded-2xl bg-gradient-to-br from-primary/25 via-accent/20 to-secondary/25 p-10 border-2 border-primary/40 shadow-2xl shadow-primary/20">
        <h1 className="mb-6 text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
          Social Care Recording & Minutes
        </h1>
        <p className="text-lg text-foreground/80 leading-relaxed max-w-4xl">
          Secure AI-powered transcription and minute-taking for children&apos;s and adults&apos; social care.
          Capture home visits, supervisions, and strategy discussions with automatic speaker identification.
          <span className="ml-2 inline-block rounded-full bg-accent-alt/15 px-4 py-1.5 text-sm font-semibold text-accent-alt border border-accent-alt/40 shadow-sm">
            OFFICIAL SENSITIVE
          </span>
        </p>
      </div>

      {/* Quick Start Section - NEW */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-muted-foreground mb-4">Quick Start</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Home Visit', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
            { name: 'Initial Assessment', color: 'bg-green-500/10 text-green-600 border-green-200' },
            { name: 'Strategy Discussion', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
            { name: 'Supervision', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
          ].map((template) => (
            <Link href={`/new?template=${template.name}`} key={template.name}>
              <div className={`glass-panel-premium p-4 rounded-xl hover:scale-105 transition-transform cursor-pointer border ${template.color}`}>
                <div className="font-medium text-sm">{template.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Button - MASSIVELY IMPROVED */}
      <Link href="/new">
        <Button className="mb-12 w-full bg-gradient-to-r from-primary via-accent to-secondary p-8 text-xl font-semibold text-white shadow-2xl shadow-primary/40 hover:shadow-[0_24px_64px_rgba(0,75,101,0.5)] hover:scale-[1.03] active:scale-[0.98] active:shadow-xl transition-all duration-300 rounded-xl border border-white/20">
          <Plus className="mr-3 h-6 w-6" /> Start New Recording
        </Button>
      </Link>

      {/* Existing content below */}
      <PaginatedTranscriptions />
    </div>
  )
}
