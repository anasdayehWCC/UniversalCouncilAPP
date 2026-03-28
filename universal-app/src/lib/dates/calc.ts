/**
 * Date Calculation Utilities
 * Working day calculations, ranges, and date math
 */

import type { DateRange, Duration, DateComparison, DateRangePreset, BusinessDayConfig } from './types';
import { DEFAULT_BUSINESS_CONFIG, isWorkingDay, getFirstDayOfWeek } from './locale';

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Add duration to a date
 */
export function addDuration(date: Date, duration: Duration): Date {
  let result = new Date(date);
  
  if (duration.years) result = addYears(result, duration.years);
  if (duration.months) result = addMonths(result, duration.months);
  if (duration.weeks) result = addWeeks(result, duration.weeks);
  if (duration.days) result = addDays(result, duration.days);
  if (duration.hours) result.setHours(result.getHours() + duration.hours);
  if (duration.minutes) result.setMinutes(result.getMinutes() + duration.minutes);
  if (duration.seconds) result.setSeconds(result.getSeconds() + duration.seconds);
  
  return result;
}

/**
 * Subtract duration from a date
 */
export function subtractDuration(date: Date, duration: Duration): Date {
  const negated: Duration = {};
  if (duration.years) negated.years = -duration.years;
  if (duration.months) negated.months = -duration.months;
  if (duration.weeks) negated.weeks = -duration.weeks;
  if (duration.days) negated.days = -duration.days;
  if (duration.hours) negated.hours = -duration.hours;
  if (duration.minutes) negated.minutes = -duration.minutes;
  if (duration.seconds) negated.seconds = -duration.seconds;
  return addDuration(date, negated);
}

/**
 * Get difference in days between two dates
 */
export function diffDays(start: Date, end: Date): number {
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get difference in months between two dates
 */
export function diffMonths(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

/**
 * Get difference in years between two dates
 */
export function diffYears(start: Date, end: Date): number {
  return end.getFullYear() - start.getFullYear();
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isWithinRange(date: Date, range: DateRange): boolean {
  const d = date.getTime();
  return d >= range.start.getTime() && d <= range.end.getTime();
}

/**
 * Check if two date ranges overlap
 */
export function rangesOverlap(rangeA: DateRange, rangeB: DateRange): boolean {
  return rangeA.start <= rangeB.end && rangeA.end >= rangeB.start;
}

/**
 * Get working days between two dates (excluding weekends and bank holidays)
 */
export function getWorkingDays(
  start: Date,
  end: Date,
  config: BusinessDayConfig = DEFAULT_BUSINESS_CONFIG
): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    if (isWorkingDay(current, config)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Add working days to a date
 */
export function addWorkingDays(
  date: Date,
  days: number,
  config: BusinessDayConfig = DEFAULT_BUSINESS_CONFIG
): Date {
  const result = new Date(date);
  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  
  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (isWorkingDay(result, config)) {
      remaining--;
    }
  }
  
  return result;
}

/**
 * Get the next working day
 */
export function getNextWorkingDay(
  date: Date,
  config: BusinessDayConfig = DEFAULT_BUSINESS_CONFIG
): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  
  while (!isWorkingDay(result, config)) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

/**
 * Get the previous working day
 */
export function getPreviousWorkingDay(
  date: Date,
  config: BusinessDayConfig = DEFAULT_BUSINESS_CONFIG
): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  
  while (!isWorkingDay(result, config)) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
}

/**
 * Compare two dates
 */
export function compareDates(a: Date, b: Date): DateComparison {
  const diff = a.getTime() - b.getTime();
  if (diff < 0) return 'before';
  if (diff > 0) return 'after';
  return 'same';
}

/**
 * Check if dates are the same day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if dates are in the same week
 */
export function isSameWeek(a: Date, b: Date): boolean {
  const startOfWeekA = getStartOfWeek(a);
  const startOfWeekB = getStartOfWeek(b);
  return isSameDay(startOfWeekA, startOfWeekB);
}

/**
 * Check if dates are in the same month
 */
export function isSameMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth()
  );
}

/**
 * Get start of day (00:00:00.000)
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of week (Monday for UK)
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const firstDay = getFirstDayOfWeek();
  const diff = (day - firstDay + 7) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of week (Sunday for UK)
 */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const result = addDays(start, 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of quarter
 */
export function getStartOfQuarter(date: Date): Date {
  const result = new Date(date);
  const month = result.getMonth();
  const quarterStart = Math.floor(month / 3) * 3;
  result.setMonth(quarterStart, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of quarter
 */
export function getEndOfQuarter(date: Date): Date {
  const result = getStartOfQuarter(date);
  result.setMonth(result.getMonth() + 3, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of year
 */
export function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

/**
 * Get end of year
 */
export function getEndOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Get date range for a preset
 */
export function getDateRangePreset(
  preset: DateRangePreset,
  baseDate: Date = new Date()
): DateRange {
  const today = getStartOfDay(baseDate);
  
  switch (preset) {
    case 'today':
      return { start: today, end: getEndOfDay(baseDate) };
    
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { start: yesterday, end: getEndOfDay(yesterday) };
    }
    
    case 'thisWeek':
      return { start: getStartOfWeek(today), end: getEndOfWeek(today) };
    
    case 'lastWeek': {
      const lastWeekStart = addDays(getStartOfWeek(today), -7);
      return { start: lastWeekStart, end: getEndOfWeek(lastWeekStart) };
    }
    
    case 'thisMonth':
      return { start: getStartOfMonth(today), end: getEndOfMonth(today) };
    
    case 'lastMonth': {
      const lastMonthStart = addMonths(getStartOfMonth(today), -1);
      return { start: lastMonthStart, end: getEndOfMonth(lastMonthStart) };
    }
    
    case 'thisQuarter':
      return { start: getStartOfQuarter(today), end: getEndOfQuarter(today) };
    
    case 'lastQuarter': {
      const lastQuarterStart = addMonths(getStartOfQuarter(today), -3);
      return { start: lastQuarterStart, end: getEndOfQuarter(lastQuarterStart) };
    }
    
    case 'thisYear':
      return { start: getStartOfYear(today), end: getEndOfYear(today) };
    
    case 'lastYear': {
      const lastYear = new Date(today.getFullYear() - 1, 0, 1);
      return { start: getStartOfYear(lastYear), end: getEndOfYear(lastYear) };
    }
    
    case 'last7Days':
      return { start: addDays(today, -6), end: getEndOfDay(baseDate) };
    
    case 'last30Days':
      return { start: addDays(today, -29), end: getEndOfDay(baseDate) };
    
    case 'last90Days':
      return { start: addDays(today, -89), end: getEndOfDay(baseDate) };
    
    default:
      return { start: today, end: getEndOfDay(baseDate) };
  }
}

/**
 * Get all dates in a range
 */
export function getDatesInRange(range: DateRange): Date[] {
  const dates: Date[] = [];
  const current = new Date(range.start);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Clamp a date within a range
 */
export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return new Date(date);
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
