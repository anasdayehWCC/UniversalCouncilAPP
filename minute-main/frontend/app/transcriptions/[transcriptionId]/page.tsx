'use client'
import dynamic from 'next/dynamic'
import { DownloadButton } from '@/components/download-button'
import { AudioWav } from '@/components/icons/AudioWav'
import { TranscriptionTitleEditor } from '@/components/transcription-title-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@careminutes/ui'
import {
  getRecordingsForTranscriptionTranscriptionsTranscriptionIdRecordingsGetOptions,
  getTranscriptionTranscriptionsTranscriptionIdGetOptions,
} from '@/lib/client/@tanstack/react-query.gen'
import { getTemplatesTemplatesGetOptions } from '@/lib/client/@tanstack/react-query.gen'
import { listMinutesForTranscriptionTranscriptionTranscriptionIdMinutesGetOptions } from '@/lib/client/@tanstack/react-query.gen'
import { FeatureFlags } from '@/lib/feature-flags'
import { useQuery } from '@tanstack/react-query'
import { Clock, Frown, SearchX } from 'lucide-react'
import { Skeleton } from '@careminutes/ui'
import { useFeatureFlagEnabled } from 'posthog-js/react'
import { usePersona } from '@/providers/PersonaProvider'

import { use, useEffect, useState } from 'react'

// Code-split heavy tab components for better initial load performance
const ChatTab = dynamic(() => import('@/app/transcriptions/[transcriptionId]/ChatTab/ChatTab'), {
  loading: () => <Skeleton className="h-96 w-full" />,
})
const MinuteTab = dynamic(
  () => import('@/app/transcriptions/[transcriptionId]/MinuteTab/MinuteTab').then(m => ({ default: m.MinuteTab })),
  { loading: () => <Skeleton className="h-96 w-full" /> }
)
const TranscriptionTab = dynamic(
  () => import('@/app/transcriptions/[transcriptionId]/TranscriptionTab/TranscriptionTab').then(m => ({ default: m.TranscriptionTab })),
  { loading: () => <Skeleton className="h-96 w-full" /> }
)
const TranslationsTab = dynamic(
  () => import('@/app/transcriptions/[transcriptionId]/TranslationsTab/TranslationsTab').then(m => ({ default: m.TranslationsTab })),
  { loading: () => <Skeleton className="h-96 w-full" /> }
)

export default function TranscriptionPage({
  params,
}: {
  params: Promise<{ transcriptionId: string }>
}) {
  const { transcriptionId } = use(params)
  const isChatEnabled = useFeatureFlagEnabled(FeatureFlags.ChatEnabled)
  const { persona, setPersona } = usePersona()
  const [activeTab, setActiveTab] = useState('summary')

  const { data: transcription, isLoading } = useQuery({
    ...getTranscriptionTranscriptionsTranscriptionIdGetOptions({
      path: { transcription_id: transcriptionId },
    }),
    refetchInterval: (query) =>
      query.state.data?.status &&
        ['awaiting_start', 'in_progress'].includes(query.state.data.status)
        ? 2000
        : false,
  })
  const { data: templateMetadata = [] } = useQuery({
    ...getTemplatesTemplatesGetOptions(),
  })

  const { data: availableMinutes = [] } = useQuery({
    ...listMinutesForTranscriptionTranscriptionTranscriptionIdMinutesGetOptions({
      path: { transcription_id: transcriptionId },
    }),
    enabled: !!transcription,
  })

  // Casting to shared Transcription shape used by editor components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedTranscription: any = transcription
  const primaryTemplateName =
    availableMinutes?.[0]?.template_name || templateMetadata?.[0]?.name || 'Summary'
  const primaryTemplate = templateMetadata.find((t) => t.name === primaryTemplateName)
  const baseTabs = primaryTemplate?.tabs?.length ? primaryTemplate.tabs : ['summary', 'recording']
  const defaultTabFromTemplate =
    persona === 'manager' ? primaryTemplate?.default_tab_manager : primaryTemplate?.default_tab_worker
  const defaultTab =
    (defaultTabFromTemplate && baseTabs.includes(defaultTabFromTemplate)
      ? defaultTabFromTemplate
      : baseTabs[0]) || 'summary'
  useEffect(() => {
    if (!transcription) return
    setActiveTab(defaultTab)
  }, [defaultTab, persona, primaryTemplateName, transcription])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex h-12 items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!transcription) {
    return (
      <div className="flex flex-col items-center justify-center">
        <SearchX size={100} />
        <p>404 - Transcription not found</p>
      </div>
    )
  }

  const tabLabels: Record<string, string> = {
    summary: persona === 'manager' ? 'Manager summary' : 'Meeting summary',
    recording: 'Recording & transcript',
    care_assessment: 'Care assessment',
    supervision: 'Supervision',
    care_review: 'Care review',
    translations: 'Translations',
    chat: 'Chat with your meeting',
  }

  const tabsToRender = [...new Set([...baseTabs])]
  if (persona === 'social_worker' && !tabsToRender.includes('translations')) {
    tabsToRender.push('translations')
  }
  if (isChatEnabled && !tabsToRender.includes('chat')) {
    tabsToRender.push('chat')
  }

  const date = new Date(transcription.created_datetime)
  const dateLabel = `${date.toDateString()} at ${date.toLocaleTimeString()}`
  const caseLabel = transcription.case_reference
    ? `Case ${transcription.case_reference}${transcription.worker_team ? ` • ${transcription.worker_team}` : ''
    }`
    : null
  const subjectLabel =
    transcription.subject_initials || transcription.subject_dob
      ? `${transcription.subject_initials || 'Subject'}${transcription.subject_dob
        ? ` • DOB ${new Date(transcription.subject_dob).toLocaleDateString()}`
        : ''
      }`
      : null

  if (
    transcription.status &&
    ['awaiting_start', 'in_progress'].includes(transcription.status)
  ) {
    return (
      <div>
        <TranscriptionTitleEditor
          title={transcription.title}
          transcriptionId={transcription.id}
          status={transcription.status}
        />
        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <Clock size="0.8rem" />
          {dateLabel}
          {caseLabel && <span className="rounded-full bg-slate-100 px-2 py-0.5">{caseLabel}</span>}
          {subjectLabel && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{subjectLabel}</span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center">
          <AudioWav />
          <p className="mb-4">
            Transcription being processed, you can close the tab.
          </p>
          <AudioPlayer transcriptionId={transcription.id} />
        </div>
      </div>
    )
  }

  if (transcription.status == 'failed') {
    return (
      <div>
        <TranscriptionTitleEditor
          title={transcription.title}
          transcriptionId={transcription.id}
          status={transcription.status}
        />
        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <Clock size="0.8rem" />
          {dateLabel}
          {caseLabel && <span className="rounded-full bg-slate-100 px-2 py-0.5">{caseLabel}</span>}
          {subjectLabel && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{subjectLabel}</span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <Frown size={100} />
          <p>
            Something went wrong with your transcription. You may need to try
            again.
          </p>
          <AudioPlayer transcriptionId={transcription.id} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-full flex-col">
      <TranscriptionTitleEditor
        title={transcription.title}
        transcriptionId={transcription.id}
        status={transcription.status}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white">
        <Clock size="0.8rem" className="text-white/80" />
        {dateLabel}
        {caseLabel && <span className="rounded-full bg-white/20 px-3 py-1">{caseLabel}</span>}
        {subjectLabel && (
          <span className="rounded-full bg-white/20 px-3 py-1">{subjectLabel}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <span className="rounded-full bg-white/10 px-2 py-1">Mode</span>
          <button
            type="button"
            onClick={() => setPersona(persona === 'social_worker' ? 'manager' : 'social_worker')}
            className="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25 transition"
          >
            {persona === 'social_worker' ? 'Social worker view' : 'Manager view'}
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-3">
        <TabsList className="h-12 w-full flex-wrap">
          {tabsToRender.map((tabKey) => (
            <TabsTrigger
              key={tabKey}
              value={tabKey}
              className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {tabLabels[tabKey] || tabKey.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabsToRender.map((tabKey) => {
          const label = tabLabels[tabKey] || tabKey.replace(/_/g, ' ')
          if (tabKey === 'recording') {
            return (
              <TabsContent key={tabKey} value={tabKey}>
                <TranscriptionTab transcription={typedTranscription} />
              </TabsContent>
            )
          }
          if (tabKey === 'translations' && persona === 'social_worker') {
            return (
              <TabsContent key={tabKey} value={tabKey}>
                <TranslationsTab transcriptionId={transcription.id} />
              </TabsContent>
            )
          }
          if (tabKey === 'chat' && isChatEnabled) {
            return (
              <TabsContent key={tabKey} value={tabKey}>
                <ChatTab transcription={typedTranscription} />
              </TabsContent>
            )
          }
          return (
            <TabsContent key={tabKey} value={tabKey}>
              <MinuteTab transcription={typedTranscription} contextLabel={label} />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

const AudioPlayer = ({ transcriptionId }: { transcriptionId: string }) => {
  const { data: recordings } = useQuery({
    ...getRecordingsForTranscriptionTranscriptionsTranscriptionIdRecordingsGetOptions(
      { path: { transcription_id: transcriptionId } }
    ),
  })
  if (!recordings || recordings.length == 0) {
    return null
  }
  return (
    <div className="mb-2 flex w-full max-w-3xl flex-col gap-2 rounded border bg-white p-2">
      <audio controls src={recordings[0].url} className="w-full" aria-label="Meeting audio player" />
      <div className="flex justify-end">
        <DownloadButton recordings={recordings} />
      </div>
    </div>
  )
}
