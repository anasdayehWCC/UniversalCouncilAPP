'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFormContext } from './Form';
import { Label } from '@/components/ui/label';
import { FieldError } from './Field';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupFieldProps {
  name: string;
  label?: string;
  description?: string;
  options: RadioOption[];
  orientation?: 'horizontal' | 'vertical';
  required?: boolean;
  disabled?: boolean;
  hideError?: boolean;
  className?: string;
  containerClassName?: string;
}

export function RadioGroupField({
  name,
  label,
  description,
  options,
  orientation = 'vertical',
  required,
  disabled,
  hideError = false,
  className,
  containerClassName,
}: RadioGroupFieldProps) {
  const { form } = useFormContext();
  const fieldState = form.getFieldState(name);
  const currentValue = fieldState.value as string;
  
  const groupId = `field-${name}`;
  const errorId = `${groupId}-error`;
  const descriptionId = `${groupId}-description`;
  const hasError = fieldState.touched && fieldState.error;

  const handleSelect = (value: string) => {
    if (disabled) return;
    form.setValue(name, value);
    form.setTouched(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent, optionIndex: number, value: string) => {
    const enabledOptions = options.filter(o => !o.disabled);
    const currentIndex = enabledOptions.findIndex(o => o.value === value);
    
    let nextIndex: number | null = null;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % enabledOptions.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleSelect(value);
        return;
    }
    
    if (nextIndex !== null) {
      const nextValue = enabledOptions[nextIndex].value;
      handleSelect(nextValue);
      // Focus the next radio
      const nextRadio = document.getElementById(`${groupId}-${nextValue}`);
      nextRadio?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? `${groupId}-label` : undefined}
      aria-describedby={cn(
        description && descriptionId,
        hasError && errorId
      )}
      aria-required={required}
      aria-invalid={hasError ? 'true' : undefined}
      className={cn('space-y-3', containerClassName)}
    >
      {label && (
        <Label
          id={`${groupId}-label`}
          className={cn(hasError && 'text-red-600')}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      
      {description && (
        <p id={descriptionId} className="text-sm text-slate-500">
          {description}
        </p>
      )}
      
      <div
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          className
        )}
      >
        {options.map((option, index) => {
          const optionId = `${groupId}-${option.value}`;
          const isSelected = currentValue === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <div key={option.value} className="flex items-start gap-3">
              <button
                type="button"
                role="radio"
                id={optionId}
                aria-checked={isSelected}
                aria-describedby={option.description ? `${optionId}-desc` : undefined}
                disabled={isDisabled}
                tabIndex={isSelected || (!currentValue && index === 0) ? 0 : -1}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index, option.value)}
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected
                    ? 'border-[var(--primary)]'
                    : 'border-slate-300',
                  hasError && 'border-red-500'
                )}
              >
                {isSelected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                )}
              </button>
              
              <div className="flex-1">
                <label
                  htmlFor={optionId}
                  className={cn(
                    'text-sm font-medium leading-none cursor-pointer',
                    isDisabled && 'cursor-not-allowed opacity-50',
                    hasError && 'text-red-600'
                  )}
                >
                  {option.label}
                </label>
                
                {option.description && (
                  <p id={`${optionId}-desc`} className="mt-1 text-sm text-slate-500">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {!hideError && hasError && (
        <FieldError id={errorId}>{fieldState.error}</FieldError>
      )}
    </div>
  );
}

// Standalone radio group (not form-connected)
export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  name?: string;
  className?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  options,
  label,
  orientation = 'vertical',
  disabled,
  name,
  className,
}: RadioGroupProps) {
  const groupId = name ?? React.useId();

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onValueChange?.(optionValue);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? `${groupId}-label` : undefined}
      className="space-y-3"
    >
      {label && (
        <Label id={`${groupId}-label`}>{label}</Label>
      )}
      
      <div
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          className
        )}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <div key={option.value} className="flex items-start gap-3">
              <button
                type="button"
                role="radio"
                id={optionId}
                aria-checked={isSelected}
                disabled={isDisabled}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected
                    ? 'border-[var(--primary)]'
                    : 'border-slate-300'
                )}
              >
                {isSelected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                )}
              </button>
              
              <div className="flex-1">
                <label
                  htmlFor={optionId}
                  className={cn(
                    'text-sm font-medium leading-none cursor-pointer',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option.label}
                </label>
                
                {option.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RadioGroupField;
