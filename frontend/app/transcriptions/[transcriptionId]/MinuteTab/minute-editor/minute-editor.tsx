'use client'

import SimpleEditor from '@/app/transcriptions/[transcriptionId]/MinuteTab/components/editor/tiptap-editor'
import { RatingButton } from '@/app/transcriptions/[transcriptionId]/MinuteTab/components/rating-dialog/rating-dialog'
import { AiEditPopover } from '@/app/transcriptions/[transcriptionId]/MinuteTab/minute-editor/ai-edit-popover'
import { MinuteVersionSelect } from '@/app/transcriptions/[transcriptionId]/MinuteTab/minute-editor/minute-version-select'
import { NewMinuteDialog } from '@/app/transcriptions/[transcriptionId]/MinuteTab/NewMinuteDialog'
import { Button } from '@/components/ui/button'
import CopyButton from '@/components/ui/copy-button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { citationRegex, citationRegexWithSpace } from '@/lib/citationRegex'
import {
  MinuteListItem,
  MinuteVersionResponse,
  ExportResponse,
  Transcription,
} from '@/lib/client'
import {
  createMinuteVersionMinutesMinuteIdVersionsPostMutation,
  deleteMinuteVersionMinuteVersionsMinuteVersionIdDeleteMutation,
  listMinuteVersionsMinutesMinuteIdVersionsGetOptions,
  listMinuteVersionsMinutesMinuteIdVersionsGetQueryKey,
  exportMinuteMinutesMinuteIdExportPostMutation,
} from '@/lib/client/@tanstack/react-query.gen'
import { getRecordingsForTranscriptionTranscriptionsTranscriptionIdRecordingsGetOptions } from '@/lib/client/@tanstack/react-query.gen'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Edit,
  Eye,
  EyeOff,
  FilePenLine,
  FileQuestion,
  FileX2,
  Loader2,
  Save,
  Undo,
} from 'lucide-react'
import posthog from 'posthog-js'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'

type MinuteEditorForm = {
  html: string
}

export function MinuteEditor({
  transcription,
  minute,
}: {
  transcription: Transcription
  minute: MinuteListItem
}) {
  const [version, setVersion] = useState(0)
  const [hideCitations, setHideCitations] = useState(false)
  const { data: minuteVersions = [], isLoading } = useQuery({
    ...listMinuteVersionsMinutesMinuteIdVersionsGetOptions({
      path: { minute_id: minute.id! },
    }),
    refetchInterval: (query) =>
      query.state.data &&
      query.state.data.length > 0 &&
      ['awaiting_start', 'in_progress'].includes(
        query.state.data[version].status
      )
        ? 1000
        : false,
  })
  const minuteVersion = useMemo(
    () => (minuteVersions.length > 0 ? minuteVersions[version] : undefined),
    [minuteVersions, version]
  )
  const isGenerating = useMemo(
    () =>
      ['awaiting_start', 'in_progress'].includes(minuteVersion?.status || ''),
    [minuteVersion?.status]
  )
  const isError = useMemo(
    () => minuteVersion?.status == 'failed',
    [minuteVersion?.status]
  )

  const queryClient = useQueryClient()
  const [isEditable, setIsEditable] = useState(false)
  const [lastExportInfo, setLastExportInfo] = useState<ExportResponse | null>(null)
  const form = useForm<MinuteEditorForm>()
  useEffect(() => {
    if (minuteVersion) {
      form.setValue('html', minuteVersion.html_content)
    }
  }, [form, minuteVersion])
  const htmlContent = form.watch('html')
  const contentToCopy = useMemo(() => {
    return htmlContent?.replaceAll(citationRegexWithSpace, '') || ''
  }, [htmlContent])
  const hasCitations = useMemo(() => {
    return !!htmlContent?.match(citationRegex)
  }, [htmlContent])
  useEffect(() => {}, [htmlContent])
  const { mutate: saveEdit } = useMutation({
    ...createMinuteVersionMinutesMinuteIdVersionsPostMutation(),
  })

  const exportMutation = useMutation({
    ...exportMinuteMinutesMinuteIdExportPostMutation(),
  })

  const { data: recordings } = useQuery({
    ...getRecordingsForTranscriptionTranscriptionsTranscriptionIdRecordingsGetOptions(
      { path: { transcription_id: transcription.id! } }
    ),
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const uniqueCitations = useMemo(() => {
    if (!htmlContent) return []
    const matches = htmlContent.match(citationRegex)
    if (!matches) return []
    const nums = matches
      .flatMap((m) =>
        m
          .replace(/\[|\]/g, '')
          .split('-')
          .map((n) => Number(n))
      )
      .filter((n) => !Number.isNaN(n))
    return Array.from(new Set(nums)).sort((a, b) => a - b)
  }, [htmlContent])

  const onSuccess = useCallback(() => {
    setIsEditable(false)
    setVersion(0)
    queryClient.invalidateQueries({
      queryKey: listMinuteVersionsMinutesMinuteIdVersionsGetQueryKey({
        path: { minute_id: minute.id! },
      }),
    })
  }, [minute.id, queryClient])

  const onSubmit = useCallback(
    (data: MinuteEditorForm) => {
      if (data.html != minuteVersion?.html_content) {
        saveEdit(
          {
            path: { minute_id: minute.id! },
            body: { html_content: data.html, content_source: 'manual_edit' },
          },
          {
            onSuccess,
          }
        )
      }
      {
        setIsEditable(false)
      }
    },
    [minute.id, minuteVersion?.html_content, onSuccess, saveEdit]
  )
  const handleExport = useCallback(
    (format: 'docx' | 'pdf') => {
      if (!minuteVersion) return
      exportMutation.mutate(
        { path: { minute_id: minute.id! }, query: { format } },
        {
          onSuccess: (data: ExportResponse) => {
            posthog.capture('minutes_exported', {
              format,
              version_id: minuteVersion.id,
            })
            setLastExportInfo(data)
            toast.success(
              `Export ready (${data.format.toUpperCase()})${data.sharepoint_item_id ? ' • Saved to SharePoint' : ''}`,
              { position: 'top-center' }
            )
            if (data?.url) {
              window.open(data.url, '_blank')
            }
          },
        }
      )
    },
    [exportMutation, minute.id, minuteVersion]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!minuteVersion) {
    return (
      <div className="flex flex-col items-center gap-2">
        <FileQuestion />
        <p>
          Nothing has been generated for this &quot;{minute.template_name}&quot;
          minute yet. Click below to generate a minute.
        </p>
        <NewMinuteDialog
          transcriptionId={transcription.id!}
          agenda={minute.agenda ?? undefined}
        />
      </div>
    )
  }
  if (isGenerating) {
    return (
      <div className="pt-2">
        <div className="mb-2 flex flex-wrap justify-between gap-y-2">
          <div className="flex flex-wrap gap-2">
            <MinuteVersionSelect
              minuteVersions={minuteVersions}
              version={version}
              setVersion={setVersion}
            />
          </div>
        </div>
        <div className="flex h-36 animate-pulse flex-col items-center justify-center pt-12">
          <FilePenLine />
          Minute generating...
        </div>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="pt-2">
        <div className="mb-2 flex flex-wrap justify-between gap-y-2">
          <div className="flex flex-wrap gap-2">
            <MinuteVersionSelect
              minuteVersions={minuteVersions}
              version={version}
              setVersion={setVersion}
            />
          </div>
        </div>
        <div className="mx-auto flex flex-col items-center justify-center pt-12 text-center">
          <FileX2 />
          <p>There was a problem processing your request.</p>
          {minuteVersions.length > 1 ? (
            <>
              <p>Click undo to go back to the previous version.</p>
              <MinuteVersionDeleteButton minuteVersion={minuteVersion} />
            </>
          ) : (
            <>
              <p>Try generating a new Minute</p>
              <NewMinuteDialog
                transcriptionId={transcription.id!}
                agenda={minute.agenda ?? undefined}
              />
            </>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="pt-2">
      <div className="mb-2 flex flex-wrap gap-3 lg:flex-nowrap lg:justify-between">
        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
          <MinuteVersionSelect
            minuteVersions={minuteVersions}
            version={version}
            setVersion={setVersion}
          />
          <AiEditPopover
            disabled={isEditable}
            minuteId={minute.id!}
            minuteVersionId={minuteVersion.id}
            onSuccess={onSuccess}
          />
          {isEditable ? (
            <Button
              className="bg-blue-600 hover:bg-blue-800 active:bg-yellow-500"
              onClick={form.handleSubmit(onSubmit)}
            >
              <Save /> Save Changes
            </Button>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-800 active:bg-yellow-500"
              onClick={() => setIsEditable(true)}
              type="button"
            >
              <Edit />
              Edit Manually
            </Button>
          )}
          <Button
            type="button"
            className="bg-green-600 text-white hover:bg-green-700 active:bg-yellow-500 min-w-[130px]"
            onClick={() => handleExport('docx')}
            disabled={exportMutation.isPending}
          >
            <Download />
            {exportMutation.isPending ? 'Exporting…' : 'Export DOCX'}
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700 active:bg-yellow-500 min-w-[120px]"
            onClick={() => handleExport('pdf')}
            disabled={exportMutation.isPending}
          >
            <Download />
            {exportMutation.isPending ? 'Exporting…' : 'Export PDF'}
          </Button>
          <CopyButton
            textToCopy={contentToCopy}
            posthogEvent="editor_content_copied"
          />
          {hasCitations && (
            <Button
              variant="outline"
              onClick={() => setHideCitations((h) => !h)}
              disabled={isEditable}
            >
              {isEditable ? (
                'Citations shown when editing'
              ) : hideCitations ? (
                <>
                  <Eye /> Show Citations
                </>
              ) : (
                <>
                  <EyeOff />
                  Hide Citations
                </>
              )}
            </Button>
          )}
        </div>
        {lastExportInfo && (
          <Badge variant="secondary" className="text-xs">
            Latest export: {lastExportInfo.format.toUpperCase()}
            {lastExportInfo.sharepoint_item_id ? ' • SharePoint uploaded' : ''}
          </Badge>
        )}
        <div className="flex gap-2 self-start lg:self-center">
          <RatingButton
            minuteVersionId={minuteVersion.id}
            minutes={minuteVersion.html_content}
            transcript={transcription.dialogue_entries!}
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <p className="mb-2 text-xs text-amber-600">
            Avoid pasting raw PII (full names, addresses, phone numbers). Focus on case references and role titles only.
          </p>
          <Controller
            control={form.control}
            name="html"
            render={({ field: { onChange } }) => (
              <SimpleEditor
                currentTranscription={transcription}
                initialContent={minuteVersion.html_content || ''}
                isEditing={isEditable}
                onContentChange={onChange}
                hideCitations={hideCitations && !isEditable}
              />
            )}
          />
        </form>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            Evidence playback
          </h4>
          {recordings && recordings.length > 0 ? (
            <>
              <audio ref={audioRef} controls className="w-full" src={recordings[0].url} />
              {uniqueCitations.length > 0 ? (
                <div className="mt-3 relative pl-4 text-xs">
                  <div className="absolute left-1 top-1 h-full w-px bg-slate-200" />
                  {uniqueCitations.map((c) => {
                    const entry = transcription.dialogue_entries?.[c - 1]
                    const start = entry?.start_time ?? 0
                    const label = new Date(start * 1000).toISOString().substring(11, 19)
                    const disabled = !entry
                    return (
                      <button
                        key={c}
                        aria-label={disabled ? `Citation ${c} unavailable` : `Jump to citation ${c} at ${label}`}
                        disabled={disabled}
                        className="mb-2 flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        onClick={() => {
                          if (audioRef.current && entry) {
                            audioRef.current.currentTime = entry.start_time
                            audioRef.current.play()
                          }
                        }}
                        title={disabled ? 'Transcript segment not available' : `Jump to ${label}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium">[{c}]</span>
                        <Separator orientation="vertical" className="h-5" />
                        <span className="text-sm font-medium text-slate-700" title={label}>{label}</span>
                        <span className="text-slate-500 line-clamp-1" title={entry?.text || 'Transcript segment'}>
                          {entry?.text || 'Transcript segment'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No citations detected.</p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">No recording available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const MinuteVersionDeleteButton = ({
  minuteVersion,
  className,
}: {
  minuteVersion: MinuteVersionResponse
  className?: string
}) => {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    ...deleteMinuteVersionMinuteVersionsMinuteVersionIdDeleteMutation(),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: listMinuteVersionsMinutesMinuteIdVersionsGetQueryKey({
          path: { minute_id: minuteVersion.minute_id },
        }),
      })
      posthog.capture('deleted_minute_version', {
        minuteVersionId: minuteVersion.id,
      })
    },
  })
  return (
    <Button
      variant="outline"
      onClick={() => mutate({ path: { minute_version_id: minuteVersion.id } })}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="animate-spin" /> Deleting
        </>
      ) : (
        <>
          <Undo /> Undo
        </>
      )}
    </Button>
  )
}
