'use client';

import * as React from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  formatDate,
  formatDateRange,
  addMonths,
  isSameDay,
  isSameMonth,
  isWithinRange,
  getStartOfMonth,
  getDaysInMonth,
  getDateRangePreset,
  UK_SHORT_DAY_NAMES,
  UK_SHORT_MONTHS,
  type DateRange,
  type DateRangePreset,
} from '@/lib/dates';

export interface DateRangePickerProps {
  /** Selected date range */
  value?: DateRange | null;
  /** Callback when range changes */
  onChange?: (range: DateRange | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled state */
  disabled?: boolean;
  /** Optional className */
  className?: string;
  /** Show preset ranges */
  showPresets?: boolean;
  /** Allow single date selection (start = end) */
  allowSingleDate?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  thisQuarter: 'This Quarter',
  lastQuarter: 'Last Quarter',
  thisYear: 'This Year',
  lastYear: 'Last Year',
  last7Days: 'Last 7 Days',
  last30Days: 'Last 30 Days',
  last90Days: 'Last 90 Days',
};

const COMMON_PRESETS: DateRangePreset[] = [
  'today',
  'yesterday',
  'last7Days',
  'last30Days',
  'thisMonth',
  'lastMonth',
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  disabled = false,
  className,
  showPresets = true,
  allowSingleDate = true,
  error = false,
  errorMessage,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(() => value?.start || new Date());
  const [selectionStart, setSelectionStart] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  // Update view date when value changes
  React.useEffect(() => {
    if (value?.start) {
      setViewDate(value.start);
    }
  }, [value]);

  const handleDateClick = (date: Date) => {
    if (!selectionStart) {
      // First click - start selection
      setSelectionStart(date);
      if (allowSingleDate) {
        onChange?.({ start: date, end: date });
      }
    } else {
      // Second click - complete selection
      let start = selectionStart;
      let end = date;
      
      // Ensure start is before end
      if (start > end) {
        [start, end] = [end, start];
      }
      
      onChange?.({ start, end });
      setSelectionStart(null);
      setHoverDate(null);
      setOpen(false);
    }
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = getDateRangePreset(preset);
    onChange?.(range);
    setSelectionStart(null);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    setSelectionStart(null);
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => addMonths(prev, 1));
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateInSelectionRange = (date: Date): boolean => {
    if (!selectionStart) return false;
    
    const endDate = hoverDate || selectionStart;
    let start = selectionStart;
    let end = endDate;
    
    if (start > end) {
      [start, end] = [end, start];
    }
    
    return isWithinRange(date, { start, end });
  };

  // Generate calendar days for current and next month
  const generateCalendarDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = getStartOfMonth(monthDate);
    const daysInMonth = getDaysInMonth(year, month);
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const currentMonthDays = generateCalendarDays(viewDate);
  const nextMonthDays = generateCalendarDays(addMonths(viewDate, 1));
  const today = new Date();

  const renderMonth = (monthDate: Date, days: (Date | null)[]) => (
    <div>
      <div className="text-center font-medium mb-2">
        {UK_SHORT_MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {UK_SHORT_DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day.charAt(0)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-8 w-8" />;
          }

          const isSelected = value && (
            isSameDay(date, value.start) || isSameDay(date, value.end)
          );
          const isInRange = value && isWithinRange(date, value);
          const isInSelectionRange = isDateInSelectionRange(date);
          const isToday = isSameDay(date, today);
          const isDisabled = isDateDisabled(date);
          const isCurrentMonth = isSameMonth(date, monthDate);
          const isRangeStart = value && isSameDay(date, value.start);
          const isRangeEnd = value && isSameDay(date, value.end);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => !isDisabled && handleDateClick(date)}
              onMouseEnter={() => selectionStart && setHoverDate(date)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={isDisabled}
              className={cn(
                'h-8 w-8 text-sm font-normal relative',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                // Selected endpoints
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                // In confirmed range
                isInRange && !isSelected && 'bg-primary/20',
                // In selection range (while selecting)
                isInSelectionRange && !isSelected && 'bg-primary/10',
                // Range start/end rounding
                isRangeStart && 'rounded-l-md',
                isRangeEnd && 'rounded-r-md',
                // Today indicator
                isToday && !isSelected && 'border border-primary',
                // Outside current month
                !isCurrentMonth && 'text-muted-foreground opacity-50',
                // Disabled
                isDisabled && 'opacity-25 cursor-not-allowed hover:bg-transparent'
              )}
              aria-label={formatDate(date, 'full')}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive focus:ring-destructive'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDateRange(value.start, value.end, 'medium') : placeholder}
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-auto rounded-sm opacity-50 hover:opacity-100"
                aria-label="Clear range"
              >
                ×
              </button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            {showPresets && (
              <div className="border-r p-3 w-36">
                <div className="text-sm font-medium mb-2">Quick Select</div>
                <div className="space-y-1">
                  {COMMON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        'w-full px-2 py-1.5 text-sm text-left rounded-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:outline-none focus:bg-accent'
                      )}
                    >
                      {PRESET_LABELS[preset]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendars */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-7 w-7"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-7 w-7"
                  aria-label="Next month"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-4">
                {renderMonth(viewDate, currentMonthDays)}
                {renderMonth(addMonths(viewDate, 1), nextMonthDays)}
              </div>

              {/* Selection hint */}
              {selectionStart && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground text-center">
                  Select end date
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <p className="mt-1 text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
