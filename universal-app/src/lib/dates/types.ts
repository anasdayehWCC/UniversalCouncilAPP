/**
 * Date/Time Types for Universal Council App
 * UK locale focus with council-appropriate date handling
 */

/** Date range with optional time components */
export interface DateRange {
  start: Date;
  end: Date;
  /** Whether times are included (vs date-only) */
  includesTime?: boolean;
}

/** Time slot for scheduling */
export interface TimeSlot {
  /** Hour in 24-hour format (0-23) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
  /** Optional seconds */
  second?: number;
}

/** Duration representation */
export interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/** Serializable date range for API/storage */
export interface SerializedDateRange {
  start: string; // ISO 8601
  end: string;   // ISO 8601
  includesTime?: boolean;
}

/** UK working hours configuration */
export interface WorkingHours {
  start: TimeSlot;
  end: TimeSlot;
  /** Days of week (0=Sunday, 1=Monday, etc.) */
  workingDays: number[];
}

/** Council business day configuration */
export interface BusinessDayConfig {
  workingHours: WorkingHours;
  /** Bank holidays (ISO date strings) */
  bankHolidays: string[];
  /** Council-specific closure dates */
  closureDates?: string[];
}

/** Date format options for UK locale */
export type DateFormatStyle = 
  | 'short'      // 28/03/2026
  | 'medium'     // 28 Mar 2026
  | 'long'       // 28 March 2026
  | 'full'       // Saturday, 28 March 2026
  | 'iso';       // 2026-03-28

/** Time format options */
export type TimeFormatStyle = 
  | '12h'        // 2:30 PM
  | '24h'        // 14:30
  | 'short24h';  // 14:30

/** Relative time units */
export type RelativeTimeUnit = 
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

/** Date comparison result */
export type DateComparison = 'before' | 'same' | 'after';

/** Preset date ranges for quick selection */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days';

/** Date picker mode */
export type DatePickerMode = 'single' | 'range' | 'multiple';

/** Validation result for date inputs */
export interface DateValidationResult {
  valid: boolean;
  error?: string;
  parsed?: Date;
}
