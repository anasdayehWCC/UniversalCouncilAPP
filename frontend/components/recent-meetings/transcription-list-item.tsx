'use client'

import { DeleteDialog } from '@/components/recent-meetings/delete-transcription-dialog'
import { RenameDialog } from '@/components/recent-meetings/rename-dialog'
import { TranscriptionCard } from '@/components/recent-meetings/transcription-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TranscriptionMetadata } from '@/lib/client'
import { Edit2, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export const TranscriptionListItem = ({
  transcription,
}: {
  transcription: TranscriptionMetadata
}) => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  return (
    <>
      <Card className="group shadow-md hover:shadow-xl hover:scale-[1.01] hover:border-accent/50 transition-all duration-300 border border-border/50 rounded-xl mb-4">
        <Link
          className="block p-6"
          href={`/transcriptions/${transcription.id}`}
        >
          <TranscriptionCard transcription={transcription} />
        </Link>
        <div className="flex gap-2 px-6 pb-6 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              setRenameOpen(true)
            }}
            className="text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
          >
            <Edit2 className="mr-1 h-3 w-3" /> Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
            className="text-xs text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <Trash className="mr-1 h-3 w-3" color="red" /> Delete
          </Button>
        </div>
      </Card>
      <DeleteDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        transcription={transcription}
      />
      <RenameDialog
        open={renameOpen}
        setRenameOpen={setRenameOpen}
        transcription={transcription}
      />
    </>
  )
}
