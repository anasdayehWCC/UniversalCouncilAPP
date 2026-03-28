'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext } from './Form';
import { Label } from '@/components/ui/label';
import { FieldError } from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  hideError?: boolean;
  className?: string;
  containerClassName?: string;
}

export function SelectField({
  name,
  label,
  description,
  placeholder = 'Select an option',
  options,
  required,
  disabled,
  hideError = false,
  className,
  containerClassName,
}: SelectFieldProps) {
  const { form } = useFormContext();
  const fieldState = form.getFieldState(name);
  
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const hasError = fieldState.touched && fieldState.error;

  const handleValueChange = (value: string) => {
    form.setValue(name, value);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.setTouched(name);
      form.validateField(name);
    }
  };

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <Label 
          htmlFor={fieldId}
          className={cn(hasError && 'text-red-600')}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      
      <SelectPrimitive.Root
        value={fieldState.value as string ?? ''}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={fieldId}
          aria-describedby={cn(
            description && descriptionId,
            hasError && errorId
          )}
          aria-invalid={hasError ? 'true' : undefined}
          aria-required={required}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm ring-offset-white',
            'placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-200 focus:border-[var(--primary)]',
            '[&>span]:line-clamp-1',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none',
                    'focus:bg-slate-100 focus:text-slate-900',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  )}
                >
                  <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      
      {description && !hasError && (
        <p id={descriptionId} className="text-sm text-slate-500">
          {description}
        </p>
      )}
      
      {!hideError && hasError && (
        <FieldError id={errorId}>{fieldState.error}</FieldError>
      )}
    </div>
  );
}

// Native select for simpler use cases
export interface NativeSelectFieldProps 
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  name: string;
  label?: string;
  description?: string;
  options: SelectOption[];
  hideError?: boolean;
  containerClassName?: string;
}

export const NativeSelectField = React.forwardRef<HTMLSelectElement, NativeSelectFieldProps>(
  ({
    name,
    label,
    description,
    options,
    hideError = false,
    className,
    containerClassName,
    id,
    required,
    ...props
  }, ref) => {
    const { form } = useFormContext();
    const fieldState = form.getFieldState(name);
    const fieldProps = form.getFieldProps(name);
    
    const fieldId = id ?? `field-${name}`;
    const errorId = `${fieldId}-error`;
    const descriptionId = `${fieldId}-description`;
    const hasError = fieldState.touched && fieldState.error;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label 
            htmlFor={fieldId}
            className={cn(hasError && 'text-red-600')}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
        )}
        
        <select
          ref={ref}
          id={fieldId}
          {...fieldProps}
          aria-describedby={cn(
            description && descriptionId,
            hasError && errorId
          )}
          aria-invalid={hasError ? 'true' : undefined}
          aria-required={required}
          className={cn(
            'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError 
              ? 'border-red-500 focus-visible:ring-red-500' 
              : 'border-slate-200',
            className
          )}
          value={fieldProps.value as string ?? ''}
          {...props}
        >
          <option value="" disabled>
            Select an option
          </option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {description && !hasError && (
          <p id={descriptionId} className="text-sm text-slate-500">
            {description}
          </p>
        )}
        
        {!hideError && hasError && (
          <FieldError id={errorId}>{fieldState.error}</FieldError>
        )}
      </div>
    );
  }
);

NativeSelectField.displayName = 'NativeSelectField';

export default SelectField;
