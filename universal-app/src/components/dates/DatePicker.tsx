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
  formatDateForInput,
  parseDate,
  UK_SHORT_DAY_NAMES,
  UK_SHORT_MONTHS,
  addMonths,
  isSameDay,
  isSameMonth,
  getStartOfMonth,
  getDaysInMonth,
  getFirstDayOfWeek,
} from '@/lib/dates';

export interface DatePickerProps {
  /** Selected date */
  value?: Date | null;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
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
  /** Show clear button */
  clearable?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  className,
  clearable = true,
  error = false,
  errorMessage,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(() => value || new Date());

  // Update view date when value changes
  React.useEffect(() => {
    if (value) {
      setViewDate(value);
    }
  }, [value]);

  const handleSelect = (date: Date) => {
    onChange?.(date);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = getStartOfMonth(viewDate);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Get day of week for first day (adjusted for Monday start)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert Sunday=0 to Monday=0 system
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();

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
            {value ? formatDate(value, 'medium') : placeholder}
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-auto rounded-sm opacity-50 hover:opacity-100"
                aria-label="Clear date"
              >
                ×
              </button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            {/* Month/Year Navigation */}
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
              <div className="font-medium">
                {UK_SHORT_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
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

            {/* Day Headers */}
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

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-8 w-8" />;
                }

                const isSelected = value && isSameDay(date, value);
                const isToday = isSameDay(date, today);
                const isDisabled = isDateDisabled(date);
                const isCurrentMonth = isSameMonth(date, viewDate);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => !isDisabled && handleSelect(date)}
                    disabled={isDisabled}
                    className={cn(
                      'h-8 w-8 rounded-md text-sm font-normal',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                      isToday && !isSelected && 'border border-primary',
                      !isCurrentMonth && 'text-muted-foreground opacity-50',
                      isDisabled && 'opacity-25 cursor-not-allowed hover:bg-transparent'
                    )}
                    aria-label={formatDate(date, 'full')}
                    aria-selected={isSelected === true}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Today Button */}
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setViewDate(today);
                  handleSelect(today);
                }}
              >
                Today
              </Button>
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
