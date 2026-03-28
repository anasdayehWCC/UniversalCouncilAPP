'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFormContext } from './Form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: string;
  label?: string;
  description?: string;
  hideError?: boolean;
  containerClassName?: string;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ 
    name, 
    label, 
    description, 
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
        
        <Input
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
            hasError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          value={fieldProps.value as string ?? ''}
          {...props}
        />
        
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

Field.displayName = 'Field';

// Textarea variant
export interface TextareaFieldProps 
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  name: string;
  label?: string;
  description?: string;
  hideError?: boolean;
  containerClassName?: string;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ 
    name, 
    label, 
    description,
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
        
        <textarea
          ref={ref}
          id={fieldId}
          name={fieldProps.name}
          value={fieldProps.value as string ?? ''}
          onChange={fieldProps.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          onBlur={fieldProps.onBlur}
          aria-describedby={cn(
            description && descriptionId,
            hasError && errorId
          )}
          aria-invalid={hasError ? 'true' : undefined}
          aria-required={required}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white',
            'placeholder:text-slate-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
        
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

TextareaField.displayName = 'TextareaField';

// Error display component
interface FieldErrorProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function FieldError({ children, id, className }: FieldErrorProps) {
  if (!children) return null;
  
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        'flex items-center gap-1.5 text-sm text-red-600',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export default Field;
