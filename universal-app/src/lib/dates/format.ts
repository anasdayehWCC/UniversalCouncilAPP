/**
 * Date/Time Formatting Utilities
 * UK locale with dd/MM/yyyy format
 */

import type { Duration, DateFormatStyle, TimeFormatStyle, RelativeTimeUnit } from './types';
import { UK_LOCALE, UK_TIMEZONE, getDateFormatOptions, getTimeFormatOptions } from './locale';

/** Cached formatters for performance */
const formattersCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let formatter = formattersCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(UK_LOCALE, { ...options, timeZone: UK_TIMEZONE });
    formattersCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Format a date according to UK locale
 * @param date - Date to format
 * @param style - Format style (default: 'short' for dd/MM/yyyy)
 */
export function formatDate(
  date: Date | string | number,
  style: DateFormatStyle = 'short'
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  if (style === 'iso') {
    return d.toISOString().split('T')[0];
  }

  const options = getDateFormatOptions(style);
  return getFormatter(options).format(d);
}

/**
 * Format time according to UK locale
 * @param date - Date/time to format
 * @param style - Time format style (default: 'short24h' for HH:mm)
 */
export function formatTime(
  date: Date | string | number,
  style: TimeFormatStyle = 'short24h'
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid time';

  const options = getTimeFormatOptions(style);
  return getFormatter(options).format(d);
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string | number,
  dateStyle: DateFormatStyle = 'short',
  timeStyle: TimeFormatStyle = 'short24h'
): string {
  return `${formatDate(date, dateStyle)} at ${formatTime(date, timeStyle)}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(
  date: Date | string | number,
  baseDate: Date = new Date()
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const diffMs = d.getTime() - baseDate.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(UK_LOCALE, { numeric: 'auto' });

  // Select appropriate unit based on magnitude
  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  }
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  }
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  }
  if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, 'day');
  }
  if (Math.abs(diffWeek) < 4) {
    return rtf.format(diffWeek, 'week');
  }
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, 'month');
  }
  return rtf.format(diffYear, 'year');
}

/**
 * Format relative time with specific unit
 */
export function formatRelativeUnit(
  value: number,
  unit: RelativeTimeUnit
): string {
  const rtf = new Intl.RelativeTimeFormat(UK_LOCALE, { numeric: 'auto' });
  return rtf.format(value, unit);
}

/**
 * Format a duration (e.g., "2 hours 30 minutes")
 */
export function formatDuration(duration: Duration): string {
  const parts: string[] = [];

  if (duration.years) {
    parts.push(`${duration.years} ${duration.years === 1 ? 'year' : 'years'}`);
  }
  if (duration.months) {
    parts.push(`${duration.months} ${duration.months === 1 ? 'month' : 'months'}`);
  }
  if (duration.weeks) {
    parts.push(`${duration.weeks} ${duration.weeks === 1 ? 'week' : 'weeks'}`);
  }
  if (duration.days) {
    parts.push(`${duration.days} ${duration.days === 1 ? 'day' : 'days'}`);
  }
  if (duration.hours) {
    parts.push(`${duration.hours} ${duration.hours === 1 ? 'hour' : 'hours'}`);
  }
  if (duration.minutes) {
    parts.push(`${duration.minutes} ${duration.minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (duration.seconds) {
    parts.push(`${duration.seconds} ${duration.seconds === 1 ? 'second' : 'seconds'}`);
  }

  if (parts.length === 0) return '0 seconds';
  if (parts.length === 1) return parts[0];
  
  // Join with commas and "and" before the last item
  const last = parts.pop()!;
  return `${parts.join(', ')} and ${last}`;
}

/**
 * Format duration in short form (e.g., "2h 30m")
 */
export function formatDurationShort(duration: Duration): string {
  const parts: string[] = [];

  if (duration.years) parts.push(`${duration.years}y`);
  if (duration.months) parts.push(`${duration.months}mo`);
  if (duration.weeks) parts.push(`${duration.weeks}w`);
  if (duration.days) parts.push(`${duration.days}d`);
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (duration.seconds) parts.push(`${duration.seconds}s`);

  return parts.length > 0 ? parts.join(' ') : '0s';
}

/**
 * Format milliseconds as duration
 */
export function formatMilliseconds(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const duration: Duration = {};
  
  if (days > 0) duration.days = days;
  if (hours % 24 > 0) duration.hours = hours % 24;
  if (minutes % 60 > 0) duration.minutes = minutes % 60;
  if (seconds % 60 > 0) duration.seconds = seconds % 60;

  return formatDuration(duration);
}

/**
 * Format a date range
 */
export function formatDateRange(
  start: Date,
  end: Date,
  style: DateFormatStyle = 'medium'
): string {
  const startStr = formatDate(start, style);
  const endStr = formatDate(end, style);
  
  if (startStr === endStr) {
    return startStr;
  }
  
  return `${startStr} – ${endStr}`;
}

/**
 * Format date for display in input fields (always dd/MM/yyyy)
 */
export function formatDateForInput(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time for display in input fields (always HH:mm)
 */
export function formatTimeForInput(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get human-readable day description
 */
export function formatDayDescription(date: Date, baseDate: Date = new Date()): string {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return formatDate(date, 'full');
  
  return formatDate(date, 'medium');
}

/**
 * Get SLA status for a submitted item
 */
export function getSLAStatus(submittedAt: string | undefined | null) {
  if (!submittedAt) return { label: 'Due in 24h', color: 'text-slate-500', bg: 'bg-slate-50' };
  
  const submitted = new Date(submittedAt);
  const now = new Date();
  const slaHours = 24;
  const deadline = new Date(submitted.getTime() + slaHours * 60 * 60 * 1000);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    return { label: `Overdue by ${Math.abs(diffHours)}h`, color: 'text-red-700', bg: 'bg-red-50' };
  } else if (diffHours <= 4) {
    return { label: `Due in ${diffHours}h`, color: 'text-orange-700', bg: 'bg-orange-50' };
  } else {
    return { label: `Due in ${diffHours}h`, color: 'text-slate-600', bg: 'bg-slate-50' };
  }
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "3 days ago")
 */
export function formatDistanceToNow(date: Date | string | null | undefined): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else {
    return formatDate(then, 'short');
  }
}
