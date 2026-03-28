'use client';

import * as React from 'react';
import type { DateRange, DateRangePreset, SerializedDateRange } from '@/lib/dates';
import {
  getDateRangePreset,
  isWithinRange,
  diffDays,
  formatDateRange,
  addDays,
  getStartOfDay,
  getEndOfDay,
} from '@/lib/dates';

export interface UseDateRangeOptions {
  /** Initial date range */
  initialRange?: DateRange | null;
  /** Initial preset */
  initialPreset?: DateRangePreset;
  /** Callback when range changes */
  onChange?: (range: DateRange | null) => void;
  /** Minimum date */
  minDate?: Date;
  /** Maximum date */
  maxDate?: Date;
  /** Maximum number of days in range */
  maxDays?: number;
  /** Storage key for persistence */
  storageKey?: string;
}

export interface UseDateRangeReturn {
  /** Current date range */
  range: DateRange | null;
  /** Set date range directly */
  setRange: (range: DateRange | null) => void;
  /** Set range from preset */
  setPreset: (preset: DateRangePreset) => void;
  /** Set start date */
  setStartDate: (date: Date) => void;
  /** Set end date */
  setEndDate: (date: Date) => void;
  /** Clear the range */
  clear: () => void;
  /** Move range forward by its duration */
  moveForward: () => void;
  /** Move range backward by its duration */
  moveBackward: () => void;
  /** Expand range by days */
  expand: (days: number) => void;
  /** Check if a date is in range */
  isInRange: (date: Date) => boolean;
  /** Number of days in range */
  dayCount: number;
  /** Formatted range string */
  formatted: string;
  /** Whether range is valid */
  isValid: boolean;
  /** Validation error message */
  error: string | null;
  /** Serialized range for API/storage */
  serialized: SerializedDateRange | null;
}

/**
 * Hook for managing date range state with validation and persistence
 */
export function useDateRange(options: UseDateRangeOptions = {}): UseDateRangeReturn {
  const {
    initialRange,
    initialPreset,
    onChange,
    minDate,
    maxDate,
    maxDays,
    storageKey,
  } = options;

  // Initialize range
  const getInitialRange = (): DateRange | null => {
    // Try localStorage first
    if (storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as SerializedDateRange;
          return {
            start: new Date(parsed.start),
            end: new Date(parsed.end),
            includesTime: parsed.includesTime,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Use preset if provided
    if (initialPreset) {
      return getDateRangePreset(initialPreset);
    }

    // Use initial range
    return initialRange || null;
  };

  const [range, setRangeState] = React.useState<DateRange | null>(getInitialRange);
  const [error, setError] = React.useState<string | null>(null);

  // Validate range
  const validateRange = React.useCallback(
    (newRange: DateRange | null): string | null => {
      if (!newRange) return null;

      if (minDate && newRange.start < minDate) {
        return `Start date must be on or after ${minDate.toLocaleDateString('en-GB')}`;
      }

      if (maxDate && newRange.end > maxDate) {
        return `End date must be on or before ${maxDate.toLocaleDateString('en-GB')}`;
      }

      if (newRange.start > newRange.end) {
        return 'Start date must be before end date';
      }

      if (maxDays) {
        const days = diffDays(newRange.start, newRange.end) + 1;
        if (days > maxDays) {
          return `Range cannot exceed ${maxDays} days`;
        }
      }

      return null;
    },
    [minDate, maxDate, maxDays]
  );

  // Set range with validation
  const setRange = React.useCallback(
    (newRange: DateRange | null) => {
      const validationError = validateRange(newRange);
      setError(validationError);

      if (!validationError) {
        setRangeState(newRange);
        onChange?.(newRange);

        // Persist to localStorage
        if (storageKey && typeof window !== 'undefined') {
          if (newRange) {
            const serialized: SerializedDateRange = {
              start: newRange.start.toISOString(),
              end: newRange.end.toISOString(),
              includesTime: newRange.includesTime,
            };
            localStorage.setItem(storageKey, JSON.stringify(serialized));
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }
    },
    [validateRange, onChange, storageKey]
  );

  // Set preset
  const setPreset = React.useCallback(
    (preset: DateRangePreset) => {
      const presetRange = getDateRangePreset(preset);
      setRange(presetRange);
    },
    [setRange]
  );

  // Set start date
  const setStartDate = React.useCallback(
    (date: Date) => {
      const start = getStartOfDay(date);
      const end = range?.end || getEndOfDay(date);
      setRange({ start, end: end < start ? getEndOfDay(date) : end });
    },
    [range, setRange]
  );

  // Set end date
  const setEndDate = React.useCallback(
    (date: Date) => {
      const end = getEndOfDay(date);
      const start = range?.start || getStartOfDay(date);
      setRange({ start: start > end ? getStartOfDay(date) : start, end });
    },
    [range, setRange]
  );

  // Clear range
  const clear = React.useCallback(() => {
    setRange(null);
  }, [setRange]);

  // Move range forward
  const moveForward = React.useCallback(() => {
    if (!range) return;
    const days = diffDays(range.start, range.end) + 1;
    setRange({
      start: addDays(range.start, days),
      end: addDays(range.end, days),
    });
  }, [range, setRange]);

  // Move range backward
  const moveBackward = React.useCallback(() => {
    if (!range) return;
    const days = diffDays(range.start, range.end) + 1;
    setRange({
      start: addDays(range.start, -days),
      end: addDays(range.end, -days),
    });
  }, [range, setRange]);

  // Expand range
  const expand = React.useCallback(
    (days: number) => {
      if (!range) return;
      setRange({
        start: addDays(range.start, -days),
        end: addDays(range.end, days),
      });
    },
    [range, setRange]
  );

  // Check if date is in range
  const isInRange = React.useCallback(
    (date: Date): boolean => {
      if (!range) return false;
      return isWithinRange(date, range);
    },
    [range]
  );

  // Compute derived values
  const dayCount = range ? diffDays(range.start, range.end) + 1 : 0;
  const formatted = range ? formatDateRange(range.start, range.end, 'medium') : '';
  const isValid = !error && !!range;
  
  const serialized: SerializedDateRange | null = range
    ? {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        includesTime: range.includesTime,
      }
    : null;

  return {
    range,
    setRange,
    setPreset,
    setStartDate,
    setEndDate,
    clear,
    moveForward,
    moveBackward,
    expand,
    isInRange,
    dayCount,
    formatted,
    isValid,
    error,
    serialized,
  };
}
