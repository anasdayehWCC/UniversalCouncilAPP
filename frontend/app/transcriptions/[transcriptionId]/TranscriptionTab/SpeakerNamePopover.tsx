import { DialogueEntryForm } from '@/app/transcriptions/[transcriptionId]/TranscriptionTab/TranscriptionTab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PenIcon } from 'lucide-react'
import posthog from 'posthog-js'
import { useCallback, useState } from 'react'
import { useFormContext } from 'react-hook-form'

export const SpeakerNamePopover = ({
  entry,
  index,
  update,
}: {
  entry: DialogueEntryForm['entries'][0]
  index: number
  update: (index: number, etnry: DialogueEntryForm['entries'][0]) => void
}) => {
  const [open, setOpen] = useState(false)
  const { getValues } = useFormContext<DialogueEntryForm>()
  const [newName, setNewName] = useState(entry.speaker)
  const [canonical, setCanonical] = useState(entry.canonical_speaker || '')
  const handleUpdateAll = useCallback(() => {
    getValues('entries')
      .map((e, i) => ({
        ...e,
        i,
      }))
      .filter((e) => e.speaker === entry.speaker)
      .forEach(({ i, ...entry }) => {
        update(i, { ...entry, speaker: newName, canonical_speaker: canonical || null })
      })
    posthog.capture('speaker_name_edited_in_transcript', {
      update_type: 'all_occurances',
    })
  }, [entry.speaker, getValues, newName, update, canonical])
  const handleUpdateSingle = useCallback(
    (index: number) => () => {
      update(index, { ...entry, speaker: newName, canonical_speaker: canonical || null })
      setOpen(false)
      posthog.capture('speaker_name_edited_in_transcript', {
        update_type: 'single_occurrence',
        entry_index: index,
      })
    },
    [entry, newName, update, canonical]
  )
  return (
    <Popover open={open} onOpenChange={(open) => setOpen(open)}>
      <PopoverTrigger asChild>
        <div
          className="group flex max-w-[200px] min-w-[100px] cursor-pointer items-start space-x-1"
          onClick={() => setOpen(true)}
        >
          <PenIcon className="mt-1 size-4 shrink-0 text-gray-400 transition-colors group-hover:text-blue-500" />
          <span className="font-bold break-words group-hover:text-blue-500">
            {entry.speaker}:
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Edit Speaker Name</h4>
            <p className="text-muted-foreground text-sm">
              Update either this occurrence or all occurrences of &apos;
              {entry.speaker}&apos;:
            </p>
          </div>
          <div className="grid gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
            />
            <Select
              value={canonical}
              onValueChange={(v) => setCanonical(v === 'none' ? '' : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Set role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No canonical role</SelectItem>
                <SelectItem value="social_worker">Social worker</SelectItem>
                <SelectItem value="mother">Mother/Carer</SelectItem>
                <SelectItem value="father">Father/Carer</SelectItem>
                <SelectItem value="child">Child/Young person</SelectItem>
                <SelectItem value="interpreter">Interpreter</SelectItem>
                <SelectItem value="professional">Professional/Health/Police</SelectItem>
              </SelectContent>
            </Select>
            <div className="">
              <Button onClick={handleUpdateSingle(index)} variant="outline">
                Update this occurrence
              </Button>
              <Button className="mt-2" onClick={handleUpdateAll}>
                Update all occurrences
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
