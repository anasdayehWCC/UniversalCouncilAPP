'use client';

import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: string;
}

interface TranscriptPlayerProps {
  transcript: TranscriptSegment[];
  duration: string;
}

export function TranscriptPlayer({ transcript, duration }: TranscriptPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Player Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
	        <Button 
	          size="icon" 
	          className="rounded-full w-10 h-10 shadow-sm"
	          onClick={() => setIsPlaying(!isPlaying)}
	        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
        
        <div className="flex-1 flex flex-col justify-center gap-1">
          <Slider defaultValue={[33]} max={100} step={1} className="w-full" />
          <div className="flex justify-between text-xs text-slate-500 font-medium font-mono">
            <span>05:12</span>
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <SkipForward className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {transcript.length > 0 ? (
          transcript.map((segment, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="w-12 pt-1 flex-shrink-0">
                <span className="text-xs font-mono text-slate-400 group-hover:text-blue-500 cursor-pointer transition-colors">
                  {segment.timestamp}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 mb-1">{segment.speaker}</p>
                <p className="text-slate-600 leading-relaxed">{segment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>No transcript available for this recording.</p>
          </div>
        )}
      </div>
    </div>
  );
}
