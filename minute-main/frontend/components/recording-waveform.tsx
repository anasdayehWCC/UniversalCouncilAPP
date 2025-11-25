'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  barCount?: number
  className?: string
}

// Simple animated waveform; heights pulse with staggered delays.
export function RecordingWaveform({ barCount = 24, className }: Props) {
  const bars = Array.from({ length: barCount })
  const containerRef = useRef<HTMLDivElement | null>(null)

  // randomize animation delay for organic feel
  useEffect(() => {
    if (!containerRef.current) return
    const children = Array.from(containerRef.current.children) as HTMLElement[]
    children.forEach((el, idx) => {
      el.style.animationDelay = `${(idx % 6) * 0.12}s`
      el.style.animationDuration = `${1 + (idx % 4) * 0.2}s`
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('flex h-20 w-full items-end justify-center gap-[3px]', className)}
      aria-hidden
    >
      {bars.map((_, i) => (
        <span
          key={i}
          className="block w-[6px] rounded-full bg-primary/90 animate-wave"
        />
      ))}
    </div>
  )
}
