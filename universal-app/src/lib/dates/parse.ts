/**
 * Date/Time Parsing Utilities
 * Handles UK date formats (dd/MM/yyyy)
 */

import type { Duration, TimeSlot, DateValidationResult } from './types';

/** UK date format regex: dd/MM/yyyy or d/M/yyyy */
const UK_DATE_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** ISO date format regex: yyyy-MM-dd */
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Time format regex: HH:mm or H:mm or HH:mm:ss */
const TIME_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Duration string regex: e.g., "2h 30m", "1d 2h", "45m" */
const DURATION_REGEX = /(\d+)\s*(y(?:ears?)?|mo(?:nths?)?|w(?:eeks?)?|d(?:ays?)?|h(?:ours?)?|m(?:in(?:utes?)?)?|s(?:ec(?:onds?)?)?)/gi;

/**
 * Parse a date string in UK format (dd/MM/yyyy) or ISO format
 * @param dateStr - Date string to parse
 * @returns Parsed Date or null if invalid
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const trimmed = dateStr.trim();
  
  // Try UK format first
  const ukMatch = trimmed.match(UK_DATE_REGEX);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10) - 1; // JS months are 0-indexed
    const y = parseInt(year, 10);
    
    const date = new Date(y, m, d);
    // Validate the date is valid (handles things like 31/02/2026)
    if (date.getDate() === d && date.getMonth() === m && date.getFullYear() === y) {
      return date;
    }
    return null;
  }
  
  // Try ISO format
  const isoMatch = trimmed.match(ISO_DATE_REGEX);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const d = parseInt(day, 10);
    
    const date = new Date(y, m, d);
    if (date.getDate() === d && date.getMonth() === m && date.getFullYear() === y) {
      return date;
    }
    return null;
  }
  
  // Try native Date parsing as fallback
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

/**
 * Parse date with validation result
 */
export function parseDateWithValidation(dateStr: string): DateValidationResult {
  if (!dateStr || !dateStr.trim()) {
    return { valid: false, error: 'Date is required' };
  }

  const parsed = parseDate(dateStr);
  if (!parsed) {
    return { 
      valid: false, 
      error: 'Invalid date format. Please use dd/MM/yyyy' 
    };
  }

  return { valid: true, parsed };
}

/**
 * Parse a time string (HH:mm or HH:mm:ss)
 * @param timeStr - Time string to parse
 * @returns TimeSlot or null if invalid
 */
export function parseTime(timeStr: string): TimeSlot | null {
  if (!timeStr) return null;
  
  const match = timeStr.trim().match(TIME_REGEX);
  if (!match) return null;
  
  const [, hours, minutes, seconds] = match;
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const s = seconds ? parseInt(seconds, 10) : undefined;
  
  // Validate ranges
  if (h < 0 || h > 23) return null;
  if (m < 0 || m > 59) return null;
  if (s !== undefined && (s < 0 || s > 59)) return null;
  
  return { hour: h, minute: m, second: s };
}

/**
 * Parse time with validation result
 */
export function parseTimeWithValidation(timeStr: string): {
  valid: boolean;
  error?: string;
  parsed?: TimeSlot;
} {
  if (!timeStr || !timeStr.trim()) {
    return { valid: false, error: 'Time is required' };
  }

  const parsed = parseTime(timeStr);
  if (!parsed) {
    return { 
      valid: false, 
      error: 'Invalid time format. Please use HH:mm' 
    };
  }

  return { valid: true, parsed };
}

/**
 * Parse a duration string (e.g., "2h 30m", "1 day 2 hours")
 * @param durationStr - Duration string to parse
 * @returns Duration object or null if invalid
 */
export function parseDuration(durationStr: string): Duration | null {
  if (!durationStr) return null;
  
  const duration: Duration = {};
  let hasMatch = false;
  
  const matches = durationStr.matchAll(DURATION_REGEX);
  
  for (const match of matches) {
    hasMatch = true;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('y')) {
      duration.years = (duration.years || 0) + value;
    } else if (unit.startsWith('mo')) {
      duration.months = (duration.months || 0) + value;
    } else if (unit.startsWith('w')) {
      duration.weeks = (duration.weeks || 0) + value;
    } else if (unit.startsWith('d')) {
      duration.days = (duration.days || 0) + value;
    } else if (unit.startsWith('h')) {
      duration.hours = (duration.hours || 0) + value;
    } else if (unit.startsWith('m') && !unit.startsWith('mo')) {
      duration.minutes = (duration.minutes || 0) + value;
    } else if (unit.startsWith('s')) {
      duration.seconds = (duration.seconds || 0) + value;
    }
  }
  
  return hasMatch ? duration : null;
}

/**
 * Convert Duration to total milliseconds
 */
export function durationToMilliseconds(duration: Duration): number {
  let ms = 0;
  
  if (duration.years) ms += duration.years * 365 * 24 * 60 * 60 * 1000;
  if (duration.months) ms += duration.months * 30 * 24 * 60 * 60 * 1000;
  if (duration.weeks) ms += duration.weeks * 7 * 24 * 60 * 60 * 1000;
  if (duration.days) ms += duration.days * 24 * 60 * 60 * 1000;
  if (duration.hours) ms += duration.hours * 60 * 60 * 1000;
  if (duration.minutes) ms += duration.minutes * 60 * 1000;
  if (duration.seconds) ms += duration.seconds * 1000;
  
  return ms;
}

/**
 * Convert milliseconds to Duration
 */
export function millisecondsToDuration(ms: number): Duration {
  const duration: Duration = {};
  let remaining = Math.abs(ms);
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  if (days > 0) {
    duration.days = days;
    remaining -= days * 24 * 60 * 60 * 1000;
  }
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  if (hours > 0) {
    duration.hours = hours;
    remaining -= hours * 60 * 60 * 1000;
  }
  
  const minutes = Math.floor(remaining / (60 * 1000));
  if (minutes > 0) {
    duration.minutes = minutes;
    remaining -= minutes * 60 * 1000;
  }
  
  const seconds = Math.floor(remaining / 1000);
  if (seconds > 0) {
    duration.seconds = seconds;
  }
  
  return duration;
}

/**
 * Parse a datetime string combining date and time
 */
export function parseDateTime(dateTimeStr: string): Date | null {
  if (!dateTimeStr) return null;
  
  // Try parsing as ISO datetime first
  const isoDate = new Date(dateTimeStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try splitting by common separators
  const separators = [' at ', ' ', 'T'];
  
  for (const sep of separators) {
    const parts = dateTimeStr.split(sep);
    if (parts.length >= 2) {
      const date = parseDate(parts[0]);
      const time = parseTime(parts.slice(1).join(' '));
      
      if (date && time) {
        date.setHours(time.hour, time.minute, time.second || 0);
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Parse natural language date inputs
 * Handles: "today", "tomorrow", "yesterday", "next week", etc.
 */
export function parseNaturalDate(input: string, baseDate: Date = new Date()): Date | null {
  const lower = input.toLowerCase().trim();
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  
  switch (lower) {
    case 'today':
      return today;
    
    case 'tomorrow':
      return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    case 'yesterday':
      return new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    case 'next week':
      return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    case 'last week':
      return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    case 'next month': {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    }
    
    case 'last month': {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return lastMonth;
    }
    
    default:
      // Try parsing as regular date
      return parseDate(input);
  }
}

/**
 * Convert TimeSlot to Date (using today's date)
 */
export function timeSlotToDate(slot: TimeSlot, baseDate: Date = new Date()): Date {
  const date = new Date(baseDate);
  date.setHours(slot.hour, slot.minute, slot.second || 0, 0);
  return date;
}

/**
 * Extract TimeSlot from Date
 */
export function dateToTimeSlot(date: Date): TimeSlot {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds() || undefined,
  };
}
