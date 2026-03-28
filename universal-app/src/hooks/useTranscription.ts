'use client';

/**
 * useTranscription Hook
 *
 * React hook for managing transcription data, playback sync,
 * search, filtering, and speaker management.
 *
 * @module hooks/useTranscription
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  TranscriptionResult,
  TranscriptSegment,
  TranscriptSpeaker,
  TranscriptFilter,
  TranscriptSearchResult,
  TranscriptEdit,
  PlaybackState,
  SyncedSegment,
  getSpeakerColor,
} from '@/lib/transcription';

// ============================================================================
// Types
// ============================================================================

export interface UseTranscriptionOptions {
  /** Initial transcription data (for SSR) */
  initialData?: TranscriptionResult | null;
  /** Audio element ref for playback sync */
  audioRef?: React.RefObject<HTMLAudioElement>;
  /** Enable auto-scroll to active segment */
  autoScroll?: boolean;
  /** Debounce time for search (ms) */
  searchDebounce?: number;
}

export interface UseTranscriptionState {
  /** Current transcription data */
  transcription: TranscriptionResult | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Current search query */
  searchQuery: string;
  /** Search results */
  searchResults: TranscriptSearchResult[];
  /** Current search result index */
  currentSearchIndex: number;
  /** Active filter */
  filter: TranscriptFilter;
  /** Filtered segments */
  filteredSegments: TranscriptSegment[];
  /** Synced segments with playback state */
  syncedSegments: SyncedSegment[];
  /** Current active segment index */
  activeSegmentIndex: number;
  /** Segment currently being edited */
  editingSegmentId: string | null;
  /** Playback state */
  playback: PlaybackState;
  /** Speakers with computed stats */
  speakersWithStats: TranscriptSpeaker[];
}

export interface UseTranscriptionActions {
  /** Load transcription by recording ID */
  loadTranscription: (recordingId: string) => Promise<void>;
  /** Set transcription data directly */
  setTranscription: (data: TranscriptionResult | null) => void;
  /** Search within transcript */
  search: (query: string) => void;
  /** Clear search */
  clearSearch: () => void;
  /** Navigate to next search result */
  nextSearchResult: () => void;
  /** Navigate to previous search result */
  prevSearchResult: () => void;
  /** Jump to specific search result */
  goToSearchResult: (index: number) => void;
  /** Set filter options */
  setFilter: (filter: TranscriptFilter) => void;
  /** Clear all filters */
  clearFilter: () => void;
  /** Filter by speaker */
  filterBySpeaker: (speakerId: string) => void;
  /** Toggle speaker in filter */
  toggleSpeakerFilter: (speakerId: string) => void;
  /** Seek audio to timestamp */
  seekTo: (timeInSeconds: number) => void;
  /** Start editing a segment */
  startEditing: (segmentId: string) => void;
  /** Save segment edit */
  saveEdit: (segmentId: string, newText: string) => void;
  /** Cancel editing */
  cancelEdit: () => void;
  /** Rename a speaker */
  renameSpeaker: (speakerId: string, newLabel: string) => void;
  /** Update playback state */
  updatePlayback: (state: Partial<PlaybackState>) => void;
  /** Get segment at specific time */
  getSegmentAtTime: (time: number) => TranscriptSegment | null;
}

// ============================================================================
// Demo Data Generator
// ============================================================================

function generateDemoTranscription(recordingId: string): TranscriptionResult {
  const speakers: TranscriptSpeaker[] = [
    { id: 'sw1', label: 'Social Worker', color: getSpeakerColor(0), role: 'Social Worker' },
    { id: 'parent1', label: 'Parent', color: getSpeakerColor(1), role: 'Parent/Guardian' },
    { id: 'child1', label: 'Child', color: getSpeakerColor(2), role: 'Service User' },
  ];

  const segments: TranscriptSegment[] = [
    {
      id: 'seg-1',
      start: 0,
      end: 8.5,
      speaker: 'sw1',
      text: "Good morning. Thank you both for coming in today. I wanted to check in and see how things have been going since our last visit.",
      confidence: 0.96,
    },
    {
      id: 'seg-2',
      start: 9.0,
      end: 15.2,
      speaker: 'parent1',
      text: "Thank you for having us. Things have been better, actually. We've been following the plan we discussed.",
      confidence: 0.94,
    },
    {
      id: 'seg-3',
      start: 15.8,
      end: 22.1,
      speaker: 'sw1',
      text: "That's wonderful to hear. Can you tell me more about what's been working well?",
      confidence: 0.98,
    },
    {
      id: 'seg-4',
      start: 23.0,
      end: 35.5,
      speaker: 'parent1',
      text: "Well, we've established a consistent bedtime routine now. The children are getting more sleep, and I've noticed they're less irritable during the day. We've also been doing homework together after dinner.",
      confidence: 0.92,
    },
    {
      id: 'seg-5',
      start: 36.2,
      end: 42.8,
      speaker: 'sw1',
      text: "That sounds like real progress. And how about you? How are you feeling about things?",
      confidence: 0.95,
    },
    {
      id: 'seg-6',
      start: 43.5,
      end: 55.0,
      speaker: 'child1',
      text: "I like the new routine. Mum helps me with my reading every night now. And I got a gold star at school for my homework!",
      confidence: 0.89,
    },
    {
      id: 'seg-7',
      start: 56.0,
      end: 62.3,
      speaker: 'sw1',
      text: "That's fantastic! Well done. It sounds like the whole family is working together.",
      confidence: 0.97,
    },
    {
      id: 'seg-8',
      start: 63.0,
      end: 75.2,
      speaker: 'parent1',
      text: "Yes, it's been challenging at times, but we're making it work. My sister has been helping out on Wednesdays which gives me a bit of a break.",
      confidence: 0.91,
    },
    {
      id: 'seg-9',
      start: 76.0,
      end: 88.5,
      speaker: 'sw1',
      text: "Support networks are so important. I'm glad you have that in place. Now, I wanted to discuss the referral to the parenting support group. Have you had a chance to attend any sessions?",
      confidence: 0.94,
    },
    {
      id: 'seg-10',
      start: 89.5,
      end: 98.0,
      speaker: 'parent1',
      text: "Yes, I went to two sessions so far. It's helpful to meet other parents going through similar things. The facilitator is very supportive.",
      confidence: 0.93,
    },
    {
      id: 'seg-11',
      start: 99.0,
      end: 108.5,
      speaker: 'sw1',
      text: "Excellent. Let's talk about next steps and what support we can put in place for the coming month. I'll also arrange another home visit.",
      confidence: 0.96,
    },
    {
      id: 'seg-12',
      start: 109.5,
      end: 115.0,
      speaker: 'parent1',
      text: "That sounds good. We're committed to making this work.",
      confidence: 0.95,
    },
  ];

  // Calculate speaker stats
  const speakersWithStats = speakers.map(speaker => {
    const speakerSegments = segments.filter(s => s.speaker === speaker.id);
    const totalDuration = speakerSegments.reduce((sum, s) => sum + (s.end - s.start), 0);
    return {
      ...speaker,
      totalDuration,
      segmentCount: speakerSegments.length,
    };
  });

  return {
    id: `trans-${recordingId}`,
    recordingId,
    segments,
    speakers: speakersWithStats,
    duration: 115.0,
    language: 'en-GB',
    languageConfidence: 0.99,
    overallConfidence: 0.94,
    createdAt: new Date().toISOString(),
    model: 'whisper-large-v3',
    processingMode: 'fast',
    wordCount: segments.reduce((sum, s) => sum + s.text.split(' ').length, 0),
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTranscription(options: UseTranscriptionOptions = {}): UseTranscriptionState & UseTranscriptionActions {
  const {
    initialData = null,
    audioRef,
    autoScroll = true,
    searchDebounce = 200,
  } = options;

  // State
  const [transcription, setTranscriptionState] = useState<TranscriptionResult | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [filter, setFilterState] = useState<TranscriptFilter>({});
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
  });

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevActiveIndexRef = useRef<number>(-1);

  // Auto-sync with audio element
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlayback(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      }));
    };

    const handlePlay = () => setPlayback(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setPlayback(prev => ({ ...prev, isPlaying: false }));
    const handleRateChange = () => setPlayback(prev => ({ ...prev, playbackRate: audio.playbackRate }));

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ratechange', handleRateChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ratechange', handleRateChange);
    };
  }, [audioRef]);

  // Computed: Filtered segments
  const filteredSegments = useMemo(() => {
    if (!transcription) return [];

    return transcription.segments.filter(segment => {
      // Speaker filter
      if (filter.speakers?.length && !filter.speakers.includes(segment.speaker)) {
        return false;
      }

      // Confidence filter
      if (filter.minConfidence && segment.confidence < filter.minConfidence) {
        return false;
      }

      // Time range filter
      if (filter.timeStart !== undefined && segment.end < filter.timeStart) {
        return false;
      }
      if (filter.timeEnd !== undefined && segment.start > filter.timeEnd) {
        return false;
      }

      // Edited only filter
      if (filter.editedOnly && !segment.isEdited) {
        return false;
      }

      return true;
    });
  }, [transcription, filter]);

  // Computed: Search results
  const searchResults = useMemo((): TranscriptSearchResult[] => {
    if (!searchQuery.trim() || !transcription) return [];

    const query = searchQuery.toLowerCase();
    const results: TranscriptSearchResult[] = [];

    transcription.segments.forEach((segment, index) => {
      const text = segment.text.toLowerCase();
      let position = 0;

      while ((position = text.indexOf(query, position)) !== -1) {
        const matchStart = position;
        const matchEnd = position + query.length;

        // Create highlighted text with markers
        const before = segment.text.slice(0, matchStart);
        const match = segment.text.slice(matchStart, matchEnd);
        const after = segment.text.slice(matchEnd);
        const highlightedText = `${before}<<${match}>>${after}`;

        results.push({
          segment,
          segmentIndex: index,
          matchStart,
          matchEnd,
          highlightedText,
        });

        position += query.length;
      }
    });

    return results;
  }, [searchQuery, transcription]);

  // Computed: Active segment index based on playback time
  const activeSegmentIndex = useMemo(() => {
    if (!transcription) return -1;
    const currentTime = playback.currentTime;

    return transcription.segments.findIndex(
      segment => currentTime >= segment.start && currentTime <= segment.end
    );
  }, [transcription, playback.currentTime]);

  // Computed: Synced segments with playback state
  const syncedSegments = useMemo((): SyncedSegment[] => {
    if (!transcription) return [];

    return filteredSegments.map(segment => {
      const isActive = playback.currentTime >= segment.start && playback.currentTime <= segment.end;
      const isPast = playback.currentTime > segment.end;
      const duration = segment.end - segment.start;
      const elapsed = Math.max(0, Math.min(playback.currentTime - segment.start, duration));
      const progress = duration > 0 ? elapsed / duration : 0;

      return {
        ...segment,
        isActive,
        isPast,
        progress: isActive ? progress : isPast ? 1 : 0,
      };
    });
  }, [filteredSegments, playback.currentTime, transcription]);

  // Computed: Speakers with stats
  const speakersWithStats = useMemo((): TranscriptSpeaker[] => {
    if (!transcription) return [];

    return transcription.speakers.map(speaker => {
      const speakerSegments = transcription.segments.filter(s => s.speaker === speaker.id);
      const totalDuration = speakerSegments.reduce((sum, s) => sum + (s.end - s.start), 0);
      return {
        ...speaker,
        totalDuration,
        segmentCount: speakerSegments.length,
      };
    });
  }, [transcription]);

  // Actions
  const loadTranscription = useCallback(async (recordingId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/transcriptions/${recordingId}`);
      // const data = await response.json();
      
      // For demo, generate mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = generateDemoTranscription(recordingId);
      setTranscriptionState(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load transcription'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setTranscription = useCallback((data: TranscriptionResult | null) => {
    setTranscriptionState(data);
    setError(null);
  }, []);

  const search = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
      setCurrentSearchIndex(0);
    }, searchDebounce);
  }, [searchDebounce]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentSearchIndex(0);
  }, []);

  const nextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentSearchIndex(prev => (prev + 1) % searchResults.length);
  }, [searchResults.length]);

  const prevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults.length]);

  const goToSearchResult = useCallback((index: number) => {
    if (index >= 0 && index < searchResults.length) {
      setCurrentSearchIndex(index);
    }
  }, [searchResults.length]);

  const setFilter = useCallback((newFilter: TranscriptFilter) => {
    setFilterState(newFilter);
  }, []);

  const clearFilter = useCallback(() => {
    setFilterState({});
  }, []);

  const filterBySpeaker = useCallback((speakerId: string) => {
    setFilterState({ speakers: [speakerId] });
  }, []);

  const toggleSpeakerFilter = useCallback((speakerId: string) => {
    setFilterState(prev => {
      const current = prev.speakers || [];
      if (current.includes(speakerId)) {
        const newSpeakers = current.filter(id => id !== speakerId);
        return { ...prev, speakers: newSpeakers.length ? newSpeakers : undefined };
      }
      return { ...prev, speakers: [...current, speakerId] };
    });
  }, []);

  const seekTo = useCallback((timeInSeconds: number) => {
    const audio = audioRef?.current;
    if (audio) {
      audio.currentTime = timeInSeconds;
      audio.play();
    }
    setPlayback(prev => ({ ...prev, currentTime: timeInSeconds }));
  }, [audioRef]);

  const startEditing = useCallback((segmentId: string) => {
    setEditingSegmentId(segmentId);
  }, []);

  const saveEdit = useCallback((segmentId: string, newText: string) => {
    setTranscriptionState(prev => {
      if (!prev) return prev;

      const segments = prev.segments.map(segment => {
        if (segment.id === segmentId) {
          return {
            ...segment,
            text: newText,
            isEdited: true,
            originalText: segment.originalText || segment.text,
            editedAt: new Date().toISOString(),
          };
        }
        return segment;
      });

      return { ...prev, segments, updatedAt: new Date().toISOString() };
    });
    setEditingSegmentId(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingSegmentId(null);
  }, []);

  const renameSpeaker = useCallback((speakerId: string, newLabel: string) => {
    setTranscriptionState(prev => {
      if (!prev) return prev;

      const speakers = prev.speakers.map(speaker => {
        if (speaker.id === speakerId) {
          return { ...speaker, label: newLabel };
        }
        return speaker;
      });

      return { ...prev, speakers, updatedAt: new Date().toISOString() };
    });
  }, []);

  const updatePlayback = useCallback((state: Partial<PlaybackState>) => {
    setPlayback(prev => ({ ...prev, ...state }));
  }, []);

  const getSegmentAtTime = useCallback((time: number): TranscriptSegment | null => {
    if (!transcription) return null;
    return transcription.segments.find(
      segment => time >= segment.start && time <= segment.end
    ) || null;
  }, [transcription]);

  return {
    // State
    transcription,
    isLoading,
    error,
    searchQuery,
    searchResults,
    currentSearchIndex,
    filter,
    filteredSegments,
    syncedSegments,
    activeSegmentIndex,
    editingSegmentId,
    playback,
    speakersWithStats,

    // Actions
    loadTranscription,
    setTranscription,
    search,
    clearSearch,
    nextSearchResult,
    prevSearchResult,
    goToSearchResult,
    setFilter,
    clearFilter,
    filterBySpeaker,
    toggleSpeakerFilter,
    seekTo,
    startEditing,
    saveEdit,
    cancelEdit,
    renameSpeaker,
    updatePlayback,
    getSegmentAtTime,
  };
}
