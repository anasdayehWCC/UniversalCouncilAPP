"use client"

import { DataRetentionNotice } from '@/components/layout/DataRententionNotice'
import { PosthogBanner } from '@/components/posthog-banner'
import { DashboardSocialWorker } from '@/components/dashboards/dashboard-social-worker'
import { DashboardManager } from '@/components/dashboards/dashboard-manager'
import { usePersona } from '@/providers/PersonaProvider'
import { Button } from '@careminutes/ui'
import { Shuffle } from 'lucide-react'

export default function Home() {
  const { persona, setPersona } = usePersona()

  return (
    <div className="container mx-auto max-w-6xl px-8 py-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataRetentionNotice />
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-2 py-1 text-muted-foreground">Persona</span>
          <Button
            variant="outline"
            className="border-white/40"
            onClick={() => setPersona(persona === 'social_worker' ? 'manager' : 'social_worker')}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            {persona === 'social_worker' ? 'Switch to manager' : 'Switch to social worker'}
          </Button>
        </div>
      </div>
      <PosthogBanner />

      {persona === 'manager' ? <DashboardManager /> : <DashboardSocialWorker />}
    </div>
  )
}
