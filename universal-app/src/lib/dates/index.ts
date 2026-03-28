/**
 * Date/Time Utilities for Universal Council App
 * UK locale with dd/MM/yyyy format
 */

// Types
export type {
  DateRange,
  TimeSlot,
  Duration,
  SerializedDateRange,
  WorkingHours,
  BusinessDayConfig,
  DateFormatStyle,
  TimeFormatStyle,
  RelativeTimeUnit,
  DateComparison,
  DateRangePreset,
  DatePickerMode,
  DateValidationResult,
} from './types';

// Locale
export {
  UK_LOCALE,
  UK_TIMEZONE,
  UK_DATE_FORMAT,
  UK_TIME_FORMAT,
  UK_SHORT_MONTHS,
  UK_FULL_MONTHS,
  UK_DAY_NAMES,
  UK_SHORT_DAY_NAMES,
  COUNCIL_WORKING_HOURS,
  EXTENDED_WORKING_HOURS,
  UK_BANK_HOLIDAYS_2026,
  DEFAULT_BUSINESS_CONFIG,
  getDateFormatOptions,
  getTimeFormatOptions,
  isUKBankHoliday,
  isWithinWorkingHours,
  isWorkingDay,
  getFirstDayOfWeek,
  getWeekNumber,
  getFinancialYear,
  getQuarter,
} from './locale';

// Formatting
export {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelative,
  formatRelativeUnit,
  formatDuration,
  formatDurationShort,
  formatMilliseconds,
  formatDateRange,
  formatDateForInput,
  formatTimeForInput,
  formatDayDescription,
  getSLAStatus,
  formatDistanceToNow,
} from './format';

// Parsing
export {
  parseDate,
  parseDateWithValidation,
  parseTime,
  parseTimeWithValidation,
  parseDuration,
  durationToMilliseconds,
  millisecondsToDuration,
  parseDateTime,
  parseNaturalDate,
  timeSlotToDate,
  dateToTimeSlot,
} from './parse';

// Calculations
export {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addDuration,
  subtractDuration,
  diffDays,
  diffMonths,
  diffYears,
  isWithinRange,
  rangesOverlap,
  getWorkingDays,
  addWorkingDays,
  getNextWorkingDay,
  getPreviousWorkingDay,
  compareDates,
  isSameDay,
  isSameWeek,
  isSameMonth,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfQuarter,
  getEndOfQuarter,
  getStartOfYear,
  getEndOfYear,
  getDateRangePreset,
  getDatesInRange,
  clampDate,
  isLeapYear,
  getDaysInMonth,
} from './calc';
