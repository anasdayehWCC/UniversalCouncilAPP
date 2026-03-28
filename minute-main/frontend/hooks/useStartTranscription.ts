import { TranscriptionForm } from '@/components/audio/types'
import {
  createRecordingRecordingsPostMutation,
  createTranscriptionTranscriptionsPostMutation,
} from '@/lib/client/@tanstack/react-query.gen'
import { getFileExtension } from '@/lib/getFileExtension'
import { queueRecording } from '@/lib/offline-queue'
import { useRecordingDb } from '@/providers/transcription-db-provider'
import { useCaseCache } from '@/providers/case-cache-provider'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const useStartTranscription = (
  defaultValues?: Partial<TranscriptionForm>
) => {
  const router = useRouter()
  const { removeRecording } = useRecordingDb()
  const { addCase } = useCaseCache()
  const { mutateAsync: createTranscription, isPending: isCreating } =
    useMutation({
      ...createTranscriptionTranscriptionsPostMutation(),
    })
  const { mutateAsync: createRecording, isPending: isConfirming } = useMutation(
    {
      ...createRecordingRecordingsPostMutation(),
    }
  )
  const { mutateAsync: uploadBlob, isPending: isUploading } = useMutation({
    mutationFn: async ({
      uploadUrl,
      file,
    }: {
      uploadUrl: string
      file: Blob | File
    }) => {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'x-ms-blob-type': 'BlockBlob',
        },
      })
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3')
      }
    },
  })

  const onSubmit = useCallback(
    async ({
      file,
      template,
      agenda,
      recordingId,
      case_reference,
      worker_team,
      subject_initials,
      subject_dob,
      processing_mode,
      visit_type,
      intended_outcomes,
      risk_flags,
      meeting_mode,
      consent_ack,
    }: TranscriptionForm) => {
      if (!file) {
        return
      }
      const isFile = file instanceof File
      const source = !!defaultValues?.recordingId
        ? 'offline-recording'
        : isFile
          ? 'upload'
          : 'recording'
      const file_extension = isFile ? getFileExtension(file.name) : 'webm'
      posthog.capture('transcription_started', {
        file_type: file.type || '',
        source,
      })
      try {
        await createRecording(
          { body: { file_extension } },
          {
            onSuccess: async (recordingData) => {
              await uploadBlob(
                { file, uploadUrl: recordingData.upload_url },
                {
                  onSuccess: async () => {
                    createTranscription(
                      {
                        body: {
                          recording_id: recordingData.id,
                          template_id: template.id,
                          template_name: template.name,
                          agenda,
                          case_reference,
                          worker_team,
                          subject_initials,
                          subject_dob: subject_dob || undefined,
                          processing_mode: processing_mode || 'fast',
                          visit_type,
                          intended_outcomes,
                          risk_flags,
                          meeting_mode,
                          consent_ack,
                        },
                      },
                      {
                        onSuccess: async (transcriptionData) => {
                          if (recordingId) {
                            await removeRecording(recordingId)
                          }
                          await addCase({ case_reference })
                          router.push(`/transcriptions/${transcriptionData.id}`)
                        },
                      }
                    )
                  },
                }
              )
            },
          }
        )
      } catch (err) {
        await queueRecording(file, {
          case_reference,
          service_domain_id: null,
          template_name: template.name,
          template_id: (template.id as string | null) ?? null,
          agenda: agenda || null,
          worker_team: worker_team || null,
          subject_initials: subject_initials || null,
          subject_dob: subject_dob || null,
          fast_path: true,
          notes: null,
          processing_mode: processing_mode || 'fast',
          visit_type: visit_type || null,
          intended_outcomes: intended_outcomes || null,
          risk_flags: risk_flags || null,
          meeting_mode: meeting_mode || 'in_person',
          consent_ack: consent_ack || false,
        }, isFile && 'name' in file ? file.name : undefined)
        toast.warning('Offline — saved locally. We will sync when back online.')
      }
    },
    [
      createRecording,
      createTranscription,
      defaultValues?.recordingId,
      removeRecording,
      router,
      uploadBlob,
      addCase,
      queueRecording,
    ]
  )
  const form = useForm<TranscriptionForm>({
    defaultValues: {
      file: null,
      template: { name: 'General', agenda_usage: 'optional' },
      case_reference: '',
      processing_mode: 'fast',
      visit_type: '',
      intended_outcomes: '',
      risk_flags: '',
      ...defaultValues,
      meeting_mode: 'in_person',
      consent_ack: false,
    },
  })
  return {
    isPending: isCreating || isConfirming || isUploading,
    onSubmit,
    form,
  }
}
