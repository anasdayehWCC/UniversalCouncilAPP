'use client';

import React, { useState } from 'react';
import { EvidenceLink } from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Quote, 
  Play, 
  X, 
  ExternalLink,
  Clock
} from 'lucide-react';

interface EvidencePopoverProps {
  evidence: EvidenceLink;
  onRemove?: () => void;
  onPlayAudio?: (startTime: number) => void;
  className?: string;
}

export function EvidencePopover({
  evidence,
  onRemove,
  onPlayAudio,
  className
}: EvidencePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Citation Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
          'bg-[var(--accent-soft)] text-[var(--primary)] border border-[var(--card-border)]',
          'hover:bg-[var(--accent-softer)] hover:border-[var(--card-hover-border)]',
          'transition-all duration-200 cursor-pointer',
          isOpen && 'ring-2 ring-[var(--accent)]/30'
        )}
      >
        <Quote className="w-3 h-3" />
        <span className="max-w-[100px] truncate">{evidence.text.substring(0, 20)}...</span>
        <span className="text-muted-foreground">{evidence.timestamp}</span>
      </button>

      {/* Popover Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover */}
          <div className={cn(
            'absolute z-50 top-full left-0 mt-2 w-80',
            'rounded-xl shadow-xl border',
            'bg-card border-border',
            // Glassmorphism
            'backdrop-blur-xl bg-card/95',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
            'duration-200'
          )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-medium text-foreground">
                  Transcript Citation
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Quote Content */}
            <div className="p-4">
              <blockquote className={cn(
                'relative pl-4 pr-2 py-2 text-sm text-foreground',
                'border-l-2 border-[var(--primary)] bg-muted/50 rounded-r-lg',
                'italic'
              )}>
                "{evidence.text}"
              </blockquote>

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(evidence.transcriptStart)} - {formatTime(evidence.transcriptEnd)}</span>
                </div>
                {evidence.speaker && (
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                      {evidence.speaker[0]}
                    </span>
                    <span>{evidence.speaker}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-muted/30 rounded-b-xl">
              {onPlayAudio && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onPlayAudio(evidence.transcriptStart)}
                >
                  <Play className="w-3 h-3 mr-1.5" />
                  Play Audio
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  // In a real app, navigate to transcript at this timestamp
                  console.log('Navigate to transcript:', evidence.transcriptStart);
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                View in Transcript
              </Button>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onRemove();
                    setIsOpen(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Inline evidence marker for within text
export function EvidenceMarker({
  evidence,
  onClick
}: {
  evidence: EvidenceLink;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 ml-0.5 -mt-1',
        'rounded-full bg-[var(--accent-soft)] text-[8px] font-bold text-[var(--primary)]',
        'hover:bg-[var(--accent)] hover:text-white',
        'transition-colors cursor-pointer align-super'
      )}
      title={`View citation: "${evidence.text.substring(0, 30)}..."`}
    >
      <Quote className="w-2.5 h-2.5" />
    </button>
  );
}
