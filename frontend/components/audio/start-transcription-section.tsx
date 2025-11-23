import { TranscriptionForm } from '@/components/audio/types'
import { TemplateSelect } from '@/components/template-select/template-select'
import { Button } from '@careminutes/ui'
import { Input } from '@careminutes/ui'
import { Textarea } from '@/components/ui/textarea'
import { useCaseCache } from '@/providers/case-cache-provider'
import { Loader2 } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'

export const StartTranscriptionSection = ({
  isShowing,
  isPending,
}: {
  isShowing: boolean
  isPending: boolean
}) => {
  const form = useFormContext<TranscriptionForm>()
  const selectedTemplate = form.watch('template')
  const caseReference = form.watch('case_reference')
  const processingMode = form.watch('processing_mode') || 'fast'

  const { recentCases } = useCaseCache()
  // Fetch templates from API

  if (!isShowing) {
    return null
  }
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="rounded-2xl glass-panel-premium p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Case context (required)
          </h3>
          <span className="text-[11px] text-slate-500">
            Reference only; no PII stored offline
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Case reference *
            </label>
            <Input
              list="recent-cases"
              placeholder="e.g. CH-2025-0412"
              {...form.register('case_reference', { required: true })}
              className="bg-white"
            />
            <datalist id="recent-cases">
              {recentCases.map((c) => (
                <option value={c.case_reference} key={c.case_reference} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Worker team (optional)
            </label>
            <Input
              placeholder="e.g. Children in Need West"
              className="bg-white"
              {...form.register('worker_team')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Subject initials (optional)
            </label>
            <Input
              placeholder="AB"
              maxLength={6}
              className="bg-white uppercase tracking-wide"
              {...form.register('subject_initials')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Subject date of birth (optional)
            </label>
            <Input type="date" className="bg-white" {...form.register('subject_dob')} />
          </div>
        </div>
      </div>
      <div className="grid gap-3 rounded-2xl glass-panel-premium p-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-600">
            Visit type (optional)
          </label>
          <Input
            placeholder="Home visit / Strategy / Supervision"
            className="bg-white"
            {...form.register('visit_type')}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            Risk flags (optional)
          </label>
          <Input
            placeholder="e.g. DA, neglect, missing episodes"
            className="bg-white"
            {...form.register('risk_flags')}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">
            Intended outcomes (optional)
          </label>
          <Textarea
            className="bg-white"
            rows={2}
            placeholder="What outcomes are you aiming for?"
            {...form.register('intended_outcomes')}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-800 active:bg-yellow-400"
        disabled={
          isPending ||
          !isShowing ||
          !selectedTemplate ||
          !caseReference ||
          (selectedTemplate.agenda_usage == 'required' && !form.watch('agenda'))
        }
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" /> Uploading
          </>
        ) : (
          'Upload'
        )}
      </Button>
      <Controller
        control={form.control}
        name="template"
        render={({ field: { value, onChange } }) => (
          <TemplateSelect value={value} onChange={onChange} />
        )}
      />
      {selectedTemplate.agenda_usage != 'not_used' && (
        <div className="mb-4 rounded">
          <h3 className="text-semibold m">
            Agenda (
            {selectedTemplate.agenda_usage == 'optional'
              ? 'optional'
              : 'required'}
            ):
          </h3>
          <p className="text-muted-foreground text-sm">
            Add discussion points from the meeting that should be included in
            the summary.
          </p>
          <Textarea
            className="bg-white"
            placeholder={`Agenda item 1
Agenda item 2
Agenda item 3
...`}
            {...form.register('agenda', {
              required: selectedTemplate.agenda_usage == 'required',
            })}
          />
        </div>
      )}
      <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl glass-panel-premium p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600">
            Processing mode
          </p>
          <p className="text-[11px] text-slate-500">
            Fast = realtime; Economy = batch off-peak (cheaper, slower)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={processingMode === 'fast' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => form.setValue('processing_mode', 'fast')}
          >
            Fast
          </Button>
          <Button
            type="button"
            variant={processingMode === 'economy' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => form.setValue('processing_mode', 'economy')}
          >
            Economy
          </Button>
        </div>
      </div>
    </div>
  )
}
