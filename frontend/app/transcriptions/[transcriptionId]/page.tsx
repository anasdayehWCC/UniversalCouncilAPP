'use client'
import ChatTab from '@/app/transcriptions/[transcriptionId]/ChatTab/ChatTab'
import { MinuteTab } from '@/app/transcriptions/[transcriptionId]/MinuteTab/MinuteTab'
import { TranscriptionTab } from '@/app/transcriptions/[transcriptionId]/TranscriptionTab/TranscriptionTab'
import { DownloadButton } from '@/components/download-button'
import { AudioWav } from '@/components/icons/AudioWav'
import { TranscriptionTitleEditor } from '@/components/transcription-title-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getRecordingsForTranscriptionTranscriptionsTranscriptionIdRecordingsGetOptions,
  getTranscriptionTranscriptionsTranscriptionIdGetOptions,
} from '@/lib/client/@tanstack/react-query.gen'
import { FeatureFlags } from '@/lib/feature-flags'
import { useQuery } from '@tanstack/react-query'
import { Clock, Frown, LoaderCircle, SearchX } from 'lucide-react'
import { useFeatureFlagEnabled } from 'posthog-js/react'

export default function TranscriptionPage({
  params: { transcriptionId },
}: {
  params: { transcriptionId: string }
}) {
  const isChatEnabled = useFeatureFlagEnabled(FeatureFlags.ChatEnabled)

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
      <div className="flex h-72 flex-col items-center justify-center">
        <LoaderCircle size={80} className="animate-spin" />
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

  const date = new Date(transcription.created_datetime)
  const dateLabel = `${date.toDateString()} at ${date.toLocaleTimeString()}`
  const caseLabel = transcription.case_reference
    ? `Case ${transcription.case_reference}${
        transcription.worker_team ? ` • ${transcription.worker_team}` : ''
      }`
    : null
  const subjectLabel =
    transcription.subject_initials || transcription.subject_dob
      ? `${transcription.subject_initials || 'Subject'}${
          transcription.subject_dob
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
      <div className="mb-4 flex items-center gap-1 text-xs text-slate-500">
        <Clock size="0.8rem" />
        {dateLabel}
        {caseLabel && <span className="rounded-full bg-slate-100 px-2 py-0.5">{caseLabel}</span>}
        {subjectLabel && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{subjectLabel}</span>
        )}
      </div>
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="h-12 w-full">
          <TabsTrigger
            value="summary"
            className="data-[state=active]:shadow-lg"
          >
            Meeting summary
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="data-[state=active]:shadow-lg"
          >
            Transcript
          </TabsTrigger>
          {isChatEnabled && (
            <TabsTrigger value="chat" className="data-[state=active]:shadow-lg">
              Chat with your meeting
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="summary">
          <MinuteTab transcription={transcription} />
        </TabsContent>
        <TabsContent value="transcript">
          <TranscriptionTab transcription={transcription} />
        </TabsContent>
        {isChatEnabled && (
          <TabsContent value="chat">
            <ChatTab transcription={transcription} />
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
      <audio controls src={recordings[0].url} className="w-full" />
      <div className="flex justify-end">
        <DownloadButton recordings={recordings} />
      </div>
    </div>
  )
}
