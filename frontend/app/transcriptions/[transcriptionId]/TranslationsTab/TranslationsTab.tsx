'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getTranscriptionTranslationsTranscriptionsTranscriptionIdTranslationsGetOptions,
  getTranscriptionTranslationsTranscriptionsTranscriptionIdTranslationsGetQueryKey,
  requestTranscriptionTranslationTranscriptionsTranscriptionIdTranslatePostMutation,
} from '@/lib/client/@tanstack/react-query.gen'
import type { TranslationStatusEntry } from '@/lib/client/types.gen'
import { Button } from '@careminutes/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@careminutes/ui'
import { PressableCard } from '@careminutes/ui'
import { Skeleton } from '@careminutes/ui'
import { TokenText } from '@careminutes/ui'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useTenantConfig } from '@/lib/config/useTenantConfig'
import { cn } from '@/lib/utils'
import { Languages, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_CONFIG_ID ||
  process.env.NEXT_PUBLIC_TENANT_ID ||
  'pilot_children'

const ACTIVE_STATUSES = new Set(['awaiting_start', 'in_progress'])

const statusMeta: Record<TranslationStatusEntry['status'], { label: string; tone: string }> = {
  awaiting_start: { label: 'Queued', tone: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'Translating…', tone: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Ready', tone: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Needs attention', tone: 'bg-rose-100 text-rose-700' },
}

export function TranslationsTab({ transcriptionId }: { transcriptionId: string }) {
  const queryClient = useQueryClient()
  const translationsQuery = useQuery({
    ...getTranscriptionTranslationsTranscriptionsTranscriptionIdTranslationsGetOptions({
      path: { transcription_id: transcriptionId },
    }),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.translations?.some((entry) =>
        ACTIVE_STATUSES.has(entry.status ?? 'completed'),
      )
      return hasActive ? 4000 : false
    },
  })

  const translationsQueryKey = getTranscriptionTranslationsTranscriptionsTranscriptionIdTranslationsGetQueryKey({
    path: { transcription_id: transcriptionId },
  })

  const tenantConfig = useTenantConfig(DEFAULT_TENANT_ID)
  const availableLanguages = useMemo(
    () => tenantConfig.config?.languages?.available ?? [],
    [tenantConfig.config?.languages?.available],
  )
  const defaultLanguage = tenantConfig.config?.languages?.default?.toLowerCase() ?? 'en'

  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  useEffect(() => {
    if (!availableLanguages.length) {
      setSelectedLanguage('')
      return
    }
    setSelectedLanguage((current) => {
      if (current && availableLanguages.some((lang) => lang === current)) {
        return current
      }
      const preferred = availableLanguages.find((lang) => lang?.toLowerCase() !== defaultLanguage)
      return preferred ?? availableLanguages[0]
    })
  }, [availableLanguages, defaultLanguage])

  const translations = useMemo(
    () => translationsQuery.data?.translations ?? [],
    [translationsQuery.data?.translations],
  )
  const translationMap = useMemo(() => {
    const map: Record<string, TranslationStatusEntry> = {}
    translations.forEach((entry) => {
      if (!entry.language) return
      map[entry.language.toLowerCase()] = entry
    })
    return map
  }, [translations])

  const focusedEntry = selectedLanguage ? translationMap[selectedLanguage.toLowerCase()] : undefined
  const autoTranslateEnabled = Boolean(tenantConfig.config?.languages?.autoTranslate)

  const translationMutation = useMutation({
    ...requestTranscriptionTranslationTranscriptionsTranscriptionIdTranslatePostMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationsQueryKey })
    },
  })

  const handleRequest = () => {
    if (!selectedLanguage) return
    translationMutation.mutate({
      path: { transcription_id: transcriptionId },
      body: {
        languages: [selectedLanguage],
        force: focusedEntry?.status === 'completed',
      },
    })
  }

  const isRequestDisabled =
    !selectedLanguage ||
    translationMutation.isPending ||
    (focusedEntry ? ACTIVE_STATUSES.has(focusedEntry.status) : false)

  const buttonLabel = (() => {
    if (!focusedEntry) return 'Request translation'
    if (focusedEntry.status === 'failed') return 'Retry translation'
    if (focusedEntry.status === 'completed') return 'Regenerate translation'
    if (focusedEntry.status === 'awaiting_start') return 'Queued'
    if (focusedEntry.status === 'in_progress') return 'Translating…'
    return 'Request translation'
  })()

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 p-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Record → Keep Safe → Use Later</p>
            <h3 className="mt-2 text-2xl font-semibold">Language co-pilot</h3>
            <p className="text-white/80">
              Mirror the Magic Notes style by giving every family the same calm, premium playback experience in their
              preferred language.
            </p>
          </div>
          <Badge className="bg-white/20 text-white backdrop-blur">
            <Sparkles className="mr-1 h-4 w-4" /> Premium ready
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-white/80 lg:grid-cols-3">
          <div>
            <TokenText emphasis="strong" className="text-white">
              1. Record
            </TokenText>
            <TokenText className="text-white/80">Capture in English or offline</TokenText>
          </div>
          <div>
            <TokenText emphasis="strong" className="text-white">
              2. Keep Safe
            </TokenText>
            <TokenText className="text-white/80">Encrypted + queued for translation</TokenText>
          </div>
          <div>
            <TokenText emphasis="strong" className="text-white">
              3. Use Later
            </TokenText>
            <TokenText className="text-white/80">Share polished summaries instantly</TokenText>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl bg-white/90 p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <TokenText emphasis="strong" className="text-base text-slate-900">
                View language
              </TokenText>
              <TokenText className="text-sm text-slate-500">
                Pick the translation you want to review
              </TokenText>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {formatLanguage(lang, defaultLanguage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="h-12 min-w-[13rem] gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg"
                onClick={handleRequest}
                disabled={isRequestDisabled || !selectedLanguage}
              >
                {translationMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                {buttonLabel}
              </Button>
              {translationMutation.isError && (
                <p className="text-xs text-rose-600">
                  {(translationMutation.error as Error).message ?? 'Unable to request translation'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            {translationsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : focusedEntry && focusedEntry.status === 'completed' && focusedEntry.text ? (
              <Textarea
                className="h-56 resize-none border-0 bg-transparent text-base shadow-none"
                value={focusedEntry.text}
                readOnly
              />
            ) : (
              <div className="flex flex-col items-start gap-2 text-sm text-slate-500">
                <Languages className="h-6 w-6 text-slate-400" />
                <p>
                  {selectedLanguage
                    ? 'Request a translation to preview and copy it from here.'
                    : 'Select a language to start a translation request.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {tenantConfig.loading && (
            <div className="rounded-2xl border border-slate-100 p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-6 w-full" />
            </div>
          )}
          {tenantConfig.error && (
            <PressableCard className="bg-rose-50 text-rose-900">
              <TokenText emphasis="strong">Unable to load tenant config</TokenText>
              <TokenText className="text-sm text-rose-700">{tenantConfig.error}</TokenText>
            </PressableCard>
          )}
          {availableLanguages.length === 0 && !tenantConfig.loading && (
            <PressableCard className="bg-slate-900 text-white">
              <TokenText emphasis="strong" className="text-sm uppercase tracking-wide">
                Translations disabled
              </TokenText>
              <TokenText className="text-white/80">
                Add languages to the tenant config to enable shared translations.
              </TokenText>
            </PressableCard>
          )}
          {availableLanguages.map((language) => {
            const entry = translationMap[language.toLowerCase()]
            const meta = entry ? statusMeta[entry.status] : statusMeta.awaiting_start
            return (
              <PressableCard key={language} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{language.toUpperCase()}</p>
                    <p className="text-lg font-semibold">{formatLanguage(language, defaultLanguage)}</p>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', meta.tone)}>
                    {meta.label}
                  </span>
                </div>
                {entry?.error && (
                  <p className="mt-2 text-sm text-rose-600">{entry.error}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {entry?.auto_requested && <Badge className="bg-slate-100">Auto</Badge>}
                  {entry?.updated_at && <span>Updated {new Date(entry.updated_at).toLocaleString()}</span>}
                </div>
              </PressableCard>
            )
          })}

          {autoTranslateEnabled && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Auto-translate is on</p>
              <p>
                New transcripts will automatically queue translations for{' '}
                {availableLanguages
                  .filter((lang) => lang.toLowerCase() !== defaultLanguage)
                  .map((lang) => formatLanguage(lang, defaultLanguage))
                  .join(', ') || 'all configured languages'}
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatLanguage(language: string, defaultLanguage: string) {
  const normalised = language.toLowerCase()
  if (normalised === defaultLanguage) {
    return `${language.toUpperCase()} • Source language`
  }
  return language.toUpperCase()
}
