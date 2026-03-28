'use client';

import * as React from 'react';
import { ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  formatTimeForInput,
  parseTime,
  type TimeSlot,
} from '@/lib/dates';

export interface TimePickerProps {
  /** Selected time */
  value?: TimeSlot | null;
  /** Callback when time changes */
  onChange?: (time: TimeSlot | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable time */
  minTime?: TimeSlot;
  /** Maximum selectable time */
  maxTime?: TimeSlot;
  /** Time interval in minutes for quick selection (default: 30) */
  interval?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Optional className */
  className?: string;
  /** Show 24-hour format (default: true for UK) */
  use24Hour?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

const COMMON_TIMES: TimeSlot[] = [
  { hour: 9, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 16, minute: 30 },
  { hour: 17, minute: 0 },
  { hour: 17, minute: 30 },
];

function formatTimeSlot(slot: TimeSlot, use24Hour: boolean = true): string {
  const hours = slot.hour.toString().padStart(2, '0');
  const minutes = slot.minute.toString().padStart(2, '0');
  
  if (use24Hour) {
    return `${hours}:${minutes}`;
  }
  
  const h = slot.hour % 12 || 12;
  const ampm = slot.hour < 12 ? 'AM' : 'PM';
  return `${h}:${minutes} ${ampm}`;
}

function compareTimeSlots(a: TimeSlot, b: TimeSlot): number {
  const aMinutes = a.hour * 60 + a.minute;
  const bMinutes = b.hour * 60 + b.minute;
  return aMinutes - bMinutes;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  minTime,
  maxTime,
  interval = 30,
  disabled = false,
  className,
  use24Hour = true,
  error = false,
  errorMessage,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  // Update input value when value changes
  React.useEffect(() => {
    if (value) {
      setInputValue(formatTimeSlot(value, use24Hour));
    } else {
      setInputValue('');
    }
  }, [value, use24Hour]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse as user types
    const parsed = parseTime(newValue);
    if (parsed) {
      onChange?.(parsed);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseTime(inputValue);
    if (parsed) {
      onChange?.(parsed);
      setInputValue(formatTimeSlot(parsed, use24Hour));
    } else if (value) {
      setInputValue(formatTimeSlot(value, use24Hour));
    } else {
      setInputValue('');
    }
  };

  const handleSelect = (time: TimeSlot) => {
    onChange?.(time);
    setOpen(false);
  };

  const isTimeDisabled = (time: TimeSlot): boolean => {
    if (minTime && compareTimeSlots(time, minTime) < 0) return true;
    if (maxTime && compareTimeSlots(time, maxTime) > 0) return true;
    return false;
  };

  // Generate time slots based on interval
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  };

  const timeSlots = interval === 30 ? COMMON_TIMES : generateTimeSlots();

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'pl-10',
                error && 'border-destructive focus:ring-destructive'
              )}
              aria-label="Time input"
            />
            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="start">
          <div className="max-h-64 overflow-y-auto p-1">
            {timeSlots.map((time) => {
              const isSelected =
                value &&
                value.hour === time.hour &&
                value.minute === time.minute;
              const isDisabled = isTimeDisabled(time);

              return (
                <button
                  key={`${time.hour}:${time.minute}`}
                  type="button"
                  onClick={() => !isDisabled && handleSelect(time)}
                  disabled={isDisabled}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm rounded-md',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:bg-accent',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                    isDisabled && 'opacity-25 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {formatTimeSlot(time, use24Hour)}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <p className="mt-1 text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
