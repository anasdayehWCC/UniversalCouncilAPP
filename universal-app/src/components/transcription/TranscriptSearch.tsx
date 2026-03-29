'use client';

/**
 * TranscriptSearch Component
 *
 * Full-text search interface for transcript content
 * with result navigation and highlighting.
 *
 * @module components/transcription/TranscriptSearch
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { TranscriptSearchResult } from '@/lib/transcription';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptSearchProps {
  /** Current search query */
  value?: string;
  /** Search results */
  results?: TranscriptSearchResult[];
  /** Current result index */
  currentIndex?: number;
  /** Whether search is loading */
  isSearching?: boolean;
  /** Callback when search query changes */
  onChange?: (query: string) => void;
  /** Callback when search is cleared */
  onClear?: () => void;
  /** Callback when navigating to next result */
  onNext?: () => void;
  /** Callback when navigating to previous result */
  onPrev?: () => void;
  /** Callback when jumping to a specific result */
  onJumpTo?: (index: number) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
  /** Whether component is compact */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TranscriptSearch({
  value = '',
  results = [],
  currentIndex = 0,
  isSearching = false,
  onChange,
  onClear,
  onNext,
  onPrev,
  onJumpTo,
  placeholder = 'Search transcript...',
  autoFocus = false,
  compact = false,
  className,
}: TranscriptSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Debounce the onChange callback
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange?.(newValue);
    }, 200);
  }, [onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClear?.();
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrev?.();
      } else {
        onNext?.();
      }
    } else if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, [onClear, onNext, onPrev]);

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('');
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const hasQuery = localValue.trim().length > 0;
  const hasResults = results.length > 0;
  const resultCount = results.length;

  return (
    <div
      className={cn(
        'relative flex items-center gap-2',
        !compact && 'bg-card rounded-xl border border-border p-2 shadow-sm',
        isFocused && !compact && 'ring-2 ring-[var(--accent)]/20 border-[var(--accent)]',
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Search Icon */}
      <div className={cn('flex items-center justify-center', compact ? 'w-8' : 'w-10')}>
        {isSearching ? (
          <Loader2 className={cn('animate-spin motion-reduce:animate-none text-muted-foreground', compact ? 'w-4 h-4' : 'w-5 h-5')} />
        ) : (
          <Search className={cn('text-muted-foreground', compact ? 'w-4 h-4' : 'w-5 h-5')} />
        )}
      </div>

      {/* Input */}
      <Input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'flex-1 border-0 focus-visible:ring-0 bg-transparent',
          compact ? 'h-8 text-sm' : 'h-9'
        )}
      />

      {/* Results Info & Navigation */}
      {hasQuery && (
        <div className="flex items-center gap-1.5">
          {/* Result Count */}
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-md min-w-[60px] text-center',
              hasResults
                ? 'text-muted-foreground bg-muted'
                : 'text-warning bg-warning/10'
            )}
          >
            {hasResults ? (
              <>
                {currentIndex + 1}/{resultCount}
              </>
            ) : (
              'No results'
            )}
          </span>

          {/* Navigation Buttons */}
          {hasResults && (
            <div className="flex items-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={onPrev}
                disabled={!hasResults}
                className={cn(compact ? 'h-7 w-7' : 'h-8 w-8')}
                title="Previous result (Shift+Enter)"
                aria-label="Previous result"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onNext}
                disabled={!hasResults}
                className={cn(compact ? 'h-7 w-7' : 'h-8 w-8')}
                title="Next result (Enter)"
                aria-label="Next result"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Clear Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClear}
            className={cn(
              'text-muted-foreground hover:text-foreground',
              compact ? 'h-7 w-7' : 'h-8 w-8'
            )}
            title="Clear search (Esc)"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      {!hasQuery && !compact && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground pr-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
            ⌘F
          </kbd>
        </div>
      )}
    </div>
  );
}

export default TranscriptSearch;
