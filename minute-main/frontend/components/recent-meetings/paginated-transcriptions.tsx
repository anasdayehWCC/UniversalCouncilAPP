'use client'

import { OfflineRecordings } from '@/components/recent-meetings/offline-recordings'
import { TranscriptionListItem } from '@/components/recent-meetings/transcription-list-item'
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@careminutes/ui'
import {
  getTemplatesTemplatesGetOptions,
  listTranscriptionsTranscriptionsGetOptions,
} from '@/lib/client/@tanstack/react-query.gen'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export const PaginatedTranscriptions = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [tagInput, setTagInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [templateFilter, setTemplateFilter] = useState<string | undefined>(undefined)

  const {
    data: templateMetadata = [],
    isLoading: templatesLoading,
  } = useQuery({
    ...getTemplatesTemplatesGetOptions(),
  })

  const { data: suggestedTags = [] } = useQuery({
    queryKey: ['tag-suggestions', tagInput],
    queryFn: async () => {
      if (!tagInput.trim()) return []
      const resp = await fetch(`/api/proxy/tags?search=${encodeURIComponent(tagInput)}&limit=10`)
      if (!resp.ok) return []
      return (await resp.json()) as string[]
    },
    enabled: tagInput.trim().length > 0,
  })

  const {
    data: paginatedResponse,
    isLoading,
    error,
  } = useQuery({
    ...listTranscriptionsTranscriptionsGetOptions({
      query: {
        page: currentPage,
        page_size: pageSize,
        tags: selectedTags.length ? selectedTags : undefined,
        template_name: templateFilter || undefined,
      },
    }),
    refetchInterval: (query) =>
      !!query.state.data &&
        query.state.data.items?.some((t) =>
          ['awaiting_start', 'in_progress'].includes(t.status)
        )
        ? 5000
        : false,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTags, templateFilter])

  const transcriptions = paginatedResponse?.items || []
  const totalPages = paginatedResponse?.total_pages || 1
  const totalCount = paginatedResponse?.total_count || 0

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div>
      <OfflineRecordings />

      {/* Premium Section Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Recent Meetings</h2>
        <div className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20">
          {totalCount} transcription{totalCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="min-w-[220px] space-y-2">
              <p className="text-xs font-semibold text-slate-600">Filter by tags</p>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Start typing a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const trimmed = tagInput.trim()
                      if (trimmed && !selectedTags.includes(trimmed)) {
                        setSelectedTags((prev) => [...prev, trimmed])
                      }
                      setTagInput('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const trimmed = tagInput.trim()
                    if (trimmed && !selectedTags.includes(trimmed)) {
                      setSelectedTags((prev) => [...prev, trimmed])
                    }
                    setTagInput('')
                  }}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="cursor-pointer bg-primary/5 text-primary hover:bg-primary/10"
                      onClick={() => {
                        if (!selectedTags.includes(tag)) {
                          setSelectedTags((prev) => [...prev, tag])
                        }
                        setTagInput('')
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-primary/10 text-primary border-primary/20 cursor-pointer"
                    onClick={() =>
                      setSelectedTags((prev) => prev.filter((t) => t !== tag))
                    }
                  >
                    {tag} ✕
                  </Badge>
                ))}
                {selectedTags.length === 0 && (
                  <p className="text-[11px] text-slate-500">No tag filters applied.</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Template</p>
              <Select
                value={templateFilter ?? 'all'}
                onValueChange={(value) => setTemplateFilter(value === 'all' ? undefined : value)}
                disabled={templatesLoading}
              >
                <SelectTrigger className="min-w-[220px]">
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All templates</SelectItem>
                  {templateMetadata.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-sm"
            onClick={() => {
              setSelectedTags([])
              setTemplateFilter(undefined)
              setTagInput('')
            }}
            disabled={selectedTags.length === 0 && !templateFilter}
          >
            Clear filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 rounded-2xl glass-panel-premium"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <div className="text-lg font-medium text-foreground">Loading transcriptions...</div>
          <div className="text-sm text-muted-foreground mt-2">Please wait while we fetch your data</div>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 rounded-2xl bg-red-50 border-2 border-red-200"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-lg font-semibold text-red-700 mb-2">Error loading transcriptions</div>
          <div className="text-sm text-red-600">Please try refreshing the page</div>
        </motion.div>
      ) : transcriptions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl glass-panel-premium border-dashed"
        >
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <div className="text-xl font-semibold text-foreground mb-2">No transcriptions yet</div>
          <div className="text-sm text-muted-foreground mb-6">Start your first recording to see it here</div>
          <Button
            variant="outline"
            className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            Create New Recording
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Staggered Entrance Animations */}
          <ul className="mb-6 flex flex-col gap-4">
            {transcriptions.map((transcription, index) => (
              <motion.li
                key={transcription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05, // Stagger: 50ms delay per item
                  ease: 'easeOut'
                }}
              >
                <TranscriptionListItem transcription={transcription} />
              </motion.li>
            ))}
          </ul>

          {/* Premium Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-10 ${currentPage === page
                    ? 'bg-primary text-white shadow-md'
                    : 'hover:bg-primary/10 hover:text-primary hover:border-primary/50'
                    } transition-all`}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="mt-6 text-center text-sm text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </div>
        </>
      )}
    </div>
  )
}
