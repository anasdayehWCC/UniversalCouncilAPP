/**
 * UK Locale Settings for Date/Time
 * Council-appropriate defaults for Westminster/RBKC
 */

import type { WorkingHours, BusinessDayConfig, TimeSlot } from './types';

/** UK locale identifier */
export const UK_LOCALE = 'en-GB';

/** UK timezone */
export const UK_TIMEZONE = 'Europe/London';

/** Default UK date format pattern */
export const UK_DATE_FORMAT = 'dd/MM/yyyy';

/** Default UK time format (24-hour) */
export const UK_TIME_FORMAT = 'HH:mm';

/** UK date-time separator */
export const UK_DATETIME_SEPARATOR = ' at ';

/** UK short month names */
export const UK_SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** UK full month names */
export const UK_FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** UK day names (week starts Monday) */
export const UK_DAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

/** UK short day names */
export const UK_SHORT_DAY_NAMES = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
] as const;

/** Standard council working hours (9:00 - 17:30) */
export const COUNCIL_WORKING_HOURS: WorkingHours = {
  start: { hour: 9, minute: 0 },
  end: { hour: 17, minute: 30 },
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
};

/** Extended hours for some services (8:00 - 20:00) */
export const EXTENDED_WORKING_HOURS: WorkingHours = {
  start: { hour: 8, minute: 0 },
  end: { hour: 20, minute: 0 },
  workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
};

/** UK Bank Holidays 2026 (update annually) */
export const UK_BANK_HOLIDAYS_2026 = [
  '2026-01-01', // New Year's Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-04', // Early May Bank Holiday
  '2026-05-25', // Spring Bank Holiday
  '2026-08-31', // Summer Bank Holiday
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (substitute)
] as const;

/** Default council business day configuration */
export const DEFAULT_BUSINESS_CONFIG: BusinessDayConfig = {
  workingHours: COUNCIL_WORKING_HOURS,
  bankHolidays: [...UK_BANK_HOLIDAYS_2026],
};

/** Get UK Intl.DateTimeFormat options for a style */
export function getDateFormatOptions(
  style: 'short' | 'medium' | 'long' | 'full'
): Intl.DateTimeFormatOptions {
  switch (style) {
    case 'short':
      return { day: '2-digit', month: '2-digit', year: 'numeric' };
    case 'medium':
      return { day: 'numeric', month: 'short', year: 'numeric' };
    case 'long':
      return { day: 'numeric', month: 'long', year: 'numeric' };
    case 'full':
      return { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  }
}

/** Get UK Intl.DateTimeFormat options for time */
export function getTimeFormatOptions(
  style: '12h' | '24h' | 'short24h'
): Intl.DateTimeFormatOptions {
  switch (style) {
    case '12h':
      return { hour: 'numeric', minute: '2-digit', hour12: true };
    case '24h':
      return { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    case 'short24h':
      return { hour: '2-digit', minute: '2-digit', hour12: false };
  }
}

/** Check if a date falls on a UK bank holiday */
export function isUKBankHoliday(
  date: Date,
  bankHolidays: string[] = [...UK_BANK_HOLIDAYS_2026]
): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return bankHolidays.includes(dateStr);
}

/** Check if time is within working hours */
export function isWithinWorkingHours(
  time: TimeSlot,
  hours: WorkingHours = COUNCIL_WORKING_HOURS
): boolean {
  const timeMinutes = time.hour * 60 + time.minute;
  const startMinutes = hours.start.hour * 60 + hours.start.minute;
  const endMinutes = hours.end.hour * 60 + hours.end.minute;
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/** Check if a day is a working day */
export function isWorkingDay(
  date: Date,
  config: BusinessDayConfig = DEFAULT_BUSINESS_CONFIG
): boolean {
  const dayOfWeek = date.getDay();
  const isWorkDay = config.workingHours.workingDays.includes(dayOfWeek);
  if (!isWorkDay) return false;

  const dateStr = date.toISOString().split('T')[0];
  if (config.bankHolidays.includes(dateStr)) return false;
  if (config.closureDates?.includes(dateStr)) return false;

  return true;
}

/** Get first day of week (Monday for UK) */
export function getFirstDayOfWeek(): number {
  return 1; // Monday
}

/** Get week number (ISO 8601) */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get financial year for UK councils (April to March) */
export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month >= 3) { // April onwards
    return `${year}/${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}/${year.toString().slice(-2)}`;
}

/** Get quarter for UK councils */
export function getQuarter(date: Date): number {
  const month = date.getMonth();
  // Financial year quarters: Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar
  if (month >= 3 && month <= 5) return 1;
  if (month >= 6 && month <= 8) return 2;
  if (month >= 9 && month <= 11) return 3;
  return 4;
}
