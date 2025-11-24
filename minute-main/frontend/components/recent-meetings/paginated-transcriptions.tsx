'use client'

import { OfflineRecordings } from '@/components/recent-meetings/offline-recordings'
import { TranscriptionListItem } from '@/components/recent-meetings/transcription-list-item'
import { Button } from '@careminutes/ui'
import { listTranscriptionsTranscriptionsGetOptions } from '@/lib/client/@tanstack/react-query.gen'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export const PaginatedTranscriptions = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const {
    data: paginatedResponse,
    isLoading,
    error,
  } = useQuery({
    ...listTranscriptionsTranscriptionsGetOptions({
      query: { page: currentPage, page_size: pageSize },
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
