'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext } from './Form';
import { FieldError } from './Field';

export interface CheckboxFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  hideError?: boolean;
  className?: string;
  containerClassName?: string;
}

export function CheckboxField({
  name,
  label,
  description,
  required,
  disabled,
  hideError = false,
  className,
  containerClassName,
}: CheckboxFieldProps) {
  const { form } = useFormContext();
  const fieldState = form.getFieldState(name);
  
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const hasError = fieldState.touched && fieldState.error;
  const isChecked = fieldState.value === true;

  const handleToggle = () => {
    if (disabled) return;
    form.setValue(name, !isChecked);
    form.setTouched(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          id={fieldId}
          aria-checked={isChecked}
          aria-describedby={cn(
            description && descriptionId,
            hasError && errorId
          )}
          aria-invalid={hasError ? 'true' : undefined}
          aria-required={required}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isChecked
              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
              : 'border-input bg-background',
            hasError && 'border-destructive',
            className
          )}
        >
          {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>
        
        <div className="flex-1">
          <label
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium leading-none cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
              hasError && 'text-destructive'
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
          
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {!hideError && hasError && (
        <FieldError id={errorId}>{fieldState.error}</FieldError>
      )}
    </div>
  );
}

// Simple standalone checkbox (not form-connected)
export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
  className,
}: CheckboxProps) {
  const checkboxId = id ?? React.useId();

  const handleToggle = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="checkbox"
        id={checkboxId}
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
            : 'border-input bg-background',
          className
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      
      <div className="flex-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm font-medium leading-none cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </label>
        
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default CheckboxField;
