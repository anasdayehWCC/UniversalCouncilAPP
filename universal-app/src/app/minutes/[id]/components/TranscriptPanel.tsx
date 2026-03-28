'use client';

import React from 'react';
import { Minute } from '@/lib/minutes/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Maximize2,
  Quote
} from 'lucide-react';

interface TranscriptPanelProps {
  minute: Minute;
  onSeekTo?: (timestamp: number) => void;
  onLinkEvidence?: (text: string, start: number, end: number) => void;
  className?: string;
}

// Mock transcript data
const MOCK_TRANSCRIPT = [
  { id: 1, speaker: 'Sarah Chen', text: 'Good morning everyone. Thank you for joining this home visit follow-up.', start: 0, end: 5 },
  { id: 2, speaker: 'Mrs. Smith', text: 'Thank you for coming. We appreciate the support.', start: 5, end: 10 },
  { id: 3, speaker: 'Sarah Chen', text: 'Of course. So let us start by reviewing how the family has been settling in since our last visit.', start: 10, end: 17 },
  { id: 4, speaker: 'Mrs. Smith', text: 'The children have been doing well at school. Emma has made some friends in the neighborhood.', start: 17, end: 24 },
  { id: 5, speaker: 'Sarah Chen', text: 'That is great to hear. How about the living situation? Is the accommodation working out?', start: 24, end: 30 },
  { id: 6, speaker: 'Mr. Smith', text: 'Yes, the new flat is much better. The children each have their own space now.', start: 30, end: 36 },
  { id: 7, speaker: 'Sarah Chen', text: 'Excellent. I noticed from our records that there were some concerns about financial support.', start: 36, end: 43 },
  { id: 8, speaker: 'Mrs. Smith', text: 'Yes, the budget is still tight but we are managing. I have been looking into employment training programs.', start: 43, end: 51 },
];

export function TranscriptPanel({ 
  minute, 
  onSeekTo,
  onLinkEvidence,
  className 
}: TranscriptPanelProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [selectedText, setSelectedText] = React.useState<{ text: string; start: number; end: number } | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText({
        text: selection.toString(),
        start: currentTime,
        end: currentTime + 5
      });
    }
  };

  return (
    <Card variant="glass" className={cn('overflow-hidden', className)}>
      {/* Audio Player Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              className="w-10 h-10 bg-[var(--primary)] hover:bg-[var(--primary)]/90"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                <div 
                  className="h-full bg-[var(--primary)] rounded-full"
                  style={{ width: '35%' }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span>{minute.duration}</span>
            </div>
          </div>

          {/* Volume & Expand */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selection Action */}
      {selectedText && onLinkEvidence && (
        <div className="px-4 py-2 bg-[var(--accent-soft)] border-b border-[var(--card-border)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1 mr-2">
              Selected: "{selectedText.text.substring(0, 50)}..."
            </p>
            <Button
              size="sm"
              onClick={() => {
                onLinkEvidence(selectedText.text, selectedText.start, selectedText.end);
                setSelectedText(null);
              }}
            >
              <Quote className="w-3 h-3 mr-1" />
              Link as Evidence
            </Button>
          </div>
        </div>
      )}

      {/* Transcript Content */}
      <div className="max-h-[400px] overflow-y-auto p-4">
        <div className="space-y-4" onMouseUp={handleTextSelect}>
          {MOCK_TRANSCRIPT.map((segment) => (
            <div 
              key={segment.id}
              className={cn(
                'flex gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                currentTime >= segment.start && currentTime < segment.end
                  ? 'bg-[var(--primary-soft)]'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
              onClick={() => onSeekTo?.(segment.start)}
            >
              {/* Timestamp */}
              <span className="flex-shrink-0 text-xs text-slate-400 font-mono pt-0.5">
                {formatTime(segment.start)}
              </span>

              {/* Content */}
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  {segment.speaker}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {segment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
