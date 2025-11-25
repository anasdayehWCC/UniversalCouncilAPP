'use client'
import ChatTab from '@/app/transcriptions/[transcriptionId]/ChatTab/ChatTab'
import { MinuteTab } from '@/app/transcriptions/[transcriptionId]/MinuteTab/MinuteTab'
import { TranscriptionTab } from '@/app/transcriptions/[transcriptionId]/TranscriptionTab/TranscriptionTab'
import { TranslationsTab } from '@/app/transcriptions/[transcriptionId]/TranslationsTab/TranslationsTab'
import { DownloadButton } from '@/components/download-button'
import { AudioWav } from '@/components/icons/AudioWav'
import { TranscriptionTitleEditor } from '@/components/transcription-title-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@careminutes/ui'
import {
  getRecordingsForTranscriptionTranscriptionsTranscriptionIdRecordingsGetOptions,
  getTranscriptionTranscriptionsTranscriptionIdGetOptions,
} from '@/lib/client/@tanstack/react-query.gen'
import { FeatureFlags } from '@/lib/feature-flags'
import { useQuery } from '@tanstack/react-query'
import { Clock, Frown, SearchX } from 'lucide-react'
import { Skeleton } from '@careminutes/ui'
import { useFeatureFlagEnabled } from 'posthog-js/react'
import { usePersona } from '@/providers/PersonaProvider'

import { use } from 'react'

export default function TranscriptionPage({
  params,
}: {
  params: Promise<{ transcriptionId: string }>
}) {
  const { transcriptionId } = use(params)
  const isChatEnabled = useFeatureFlagEnabled(FeatureFlags.ChatEnabled)
  const { persona, setPersona } = usePersona()

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

  // Casting to shared Transcription shape used by editor components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedTranscription: any = transcription

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

      <Tabs defaultValue="summary" className="w-full mt-3">
        <TabsList className="h-12 w-full">
          <TabsTrigger
            value="summary"
            className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {persona === 'manager' ? 'Manager summary' : 'Meeting summary'}
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Transcript
          </TabsTrigger>
          {persona === 'social_worker' && (
            <TabsTrigger
              value="translations"
              className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Translations
            </TabsTrigger>
          )}
          {isChatEnabled && (
            <TabsTrigger
              value="chat"
              className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Chat with your meeting
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="summary">
          <MinuteTab transcription={typedTranscription} />
        </TabsContent>
        <TabsContent value="transcript">
          <TranscriptionTab transcription={typedTranscription} />
        </TabsContent>
        {persona === 'social_worker' && (
          <TabsContent value="translations">
            <TranslationsTab transcriptionId={transcription.id} />
          </TabsContent>
        )}
        {isChatEnabled && (
          <TabsContent value="chat">
            <ChatTab transcription={typedTranscription} />
          </TabsContent>
        )}
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
