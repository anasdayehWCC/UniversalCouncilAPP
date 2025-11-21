'use client'

import { MicRecorderForm } from '@/components/audio/mic-recorder'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button
        asChild
        variant="ghost"
        className="px-0 text-sm text-slate-600 hover:text-slate-800"
      >
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back home
        </Link>
      </Button>
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)]">
            <Sparkles />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Capture (Offline-ready)</h1>
            <p className="text-sm text-slate-200">
              Record on mobile, queue offline, and auto-sync when you reconnect.
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-amber-700">
        Privacy reminder: avoid speaking full names, addresses, or phone numbers. Use case references and roles instead.
      </p>
      <MicRecorderForm />
    </div>
  )
}
