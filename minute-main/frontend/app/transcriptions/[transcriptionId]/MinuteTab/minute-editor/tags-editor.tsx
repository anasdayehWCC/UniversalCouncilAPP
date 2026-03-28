'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@careminutes/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@careminutes/ui'
import { cn } from '@/lib/utils'

type Props = {
  minuteId: string
  initialTags?: string[]
}

export function TagsEditor({ minuteId, initialTags = [] }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  const saveTags = useCallback(
    async (next: string[]) => {
      setSaving(true)
      try {
        await fetch(`/api/proxy/minutes/${minuteId}/tags`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: next }),
        })
      } finally {
        setSaving(false)
      }
    },
    [minuteId],
  )

  const addTag = async () => {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) return
    const next = [...tags, trimmed]
    setTags(next)
    setInput('')
    await saveTags(next)
  }

  const removeTag = async (tag: string) => {
    const next = tags.filter((t) => t !== tag)
    setTags(next)
    await saveTags(next)
  }

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Tags</p>
        {saving && <span className="text-[11px] text-slate-500">Saving…</span>}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add tag (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addTag} disabled={!input.trim()}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-xs text-slate-500">No tags yet.</p>}
        {tags.map((tag) => (
          <Badge
            key={tag}
            className={cn('bg-primary/10 text-primary border-primary/20 cursor-pointer')}
            onClick={() => removeTag(tag)}
            title="Click to remove"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
