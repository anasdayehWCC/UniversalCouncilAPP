'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, HelpCircle, Info } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type FieldSize = 'sm' | 'md' | 'lg';
export type FieldVariant = 'default' | 'filled' | 'ghost';

export interface FormFieldContextValue {
  id: string;
  name: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function useFormFieldContext() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormFieldContext must be used within a FormField');
  }
  return context;
}

// =============================================================================
// FormField Component
// =============================================================================

export interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  helpText?: string;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  hideError?: boolean;
  hideLabel?: boolean;
  size?: FieldSize;
  variant?: FieldVariant;
  className?: string;
  labelClassName?: string;
  inputContainerClassName?: string;
  children: React.ReactNode;
  id?: string;
  tooltip?: string;
}

export function FormField({
  name,
  label,
  description,
  helpText,
  error,
  required = false,
  optional = false,
  disabled = false,
  hideError = false,
  hideLabel = false,
  size = 'md',
  variant = 'default',
  className,
  labelClassName,
  inputContainerClassName,
  children,
  id,
  tooltip,
}: FormFieldProps) {
  const fieldId = id ?? `field-${name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const helpTextId = `${fieldId}-help`;
  
  const hasError = Boolean(error);
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const contextValue = React.useMemo<FormFieldContextValue>(() => ({
    id: fieldId,
    name,
    error,
    required,
    disabled,
  }), [fieldId, name, error, required, disabled]);
  
  return (
    <FormFieldContext.Provider value={contextValue}>
      <div
        className={cn(
          'space-y-1.5',
          size === 'sm' && 'space-y-1',
          size === 'lg' && 'space-y-2',
          className
        )}
        data-field={name}
        data-error={hasError ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        {/* Label row */}
        {(label || required || optional || tooltip) && !hideLabel && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {label && (
                <Label
                  htmlFor={fieldId}
                  className={cn(
                    'text-sm font-medium text-foreground',
                    size === 'sm' && 'text-xs',
                    size === 'lg' && 'text-base',
                    hasError && 'text-destructive',
                    disabled && 'opacity-50',
                    labelClassName
                  )}
                >
                  {label}
                </Label>
              )}
              {required && (
                <span className="text-destructive" aria-hidden="true">*</span>
              )}
              {optional && !required && (
                <span className="text-xs text-muted-foreground">(optional)</span>
              )}
              {tooltip && (
                <button
                  type="button"
                  className="relative ml-0.5"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  aria-label={`Help: ${tooltip}`}
                >
                  <HelpCircle
                    className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                    aria-hidden="true"
                  />
                  {showTooltip && (
                    <div
                      role="tooltip"
                      className={cn(
                        'absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2',
                        'rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg',
                        'max-w-xs whitespace-normal text-center',
                        'animate-in fade-in-0 zoom-in-95'
                      )}
                    >
                      {tooltip}
                      <div
                        className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-popover"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Description (above input) */}
        {description && (
          <p
            id={descriptionId}
            className={cn(
              'text-sm text-muted-foreground',
              size === 'sm' && 'text-xs',
              disabled && 'opacity-50'
            )}
          >
            {description}
          </p>
        )}
        
        {/* Input container */}
        <div
          className={cn(
            'relative',
            inputContainerClassName
          )}
        >
          {children}
        </div>
        
        {/* Help text (below input) */}
        {helpText && !hasError && (
          <p
            id={helpTextId}
            className={cn(
              'flex items-start gap-1.5 text-sm text-muted-foreground',
              size === 'sm' && 'text-xs',
              disabled && 'opacity-50'
            )}
          >
            <Info
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{helpText}</span>
          </p>
        )}
        
        {/* Error message */}
        {!hideError && hasError && (
          <FieldError id={errorId} size={size}>
            {error}
          </FieldError>
        )}
        
        {/* Screen reader only: announce required status */}
        {required && (
          <span className="sr-only">Required field</span>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

// =============================================================================
// FieldError Component
// =============================================================================

export interface FieldErrorProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  size?: FieldSize;
  icon?: boolean;
}

export function FieldError({
  children,
  id,
  className,
  size = 'md',
  icon = true,
}: FieldErrorProps) {
  if (!children) return null;
  
  // Use a ref to track if this is a new error for announcements
  const [isNew, setIsNew] = React.useState(true);
  
  React.useEffect(() => {
    setIsNew(true);
    const timer = setTimeout(() => setIsNew(false), 100);
    return () => clearTimeout(timer);
  }, [children]);
  
  return (
    <p
      id={id}
      role="alert"
      aria-live={isNew ? 'polite' : undefined}
      className={cn(
        'flex items-center gap-1.5 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1',
        size === 'sm' && 'text-xs gap-1',
        size === 'lg' && 'text-base gap-2',
        className
      )}
    >
      {icon && (
        <AlertCircle
          className={cn(
            'h-4 w-4 flex-shrink-0',
            size === 'sm' && 'h-3 w-3',
            size === 'lg' && 'h-5 w-5'
          )}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </p>
  );
}

// =============================================================================
// FormFieldInput - Input with automatic context integration
// =============================================================================

export interface FormFieldInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'id' | 'size'> {
  size?: FieldSize;
  variant?: FieldVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const FormFieldInput = React.forwardRef<HTMLInputElement, FormFieldInputProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      ...props
    },
    ref
  ) => {
    const context = useFormFieldContext();
    const hasError = Boolean(context.error);
    
    const sizeClasses = {
      sm: 'h-8 text-sm px-2.5',
      md: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4',
    };
    
    const variantClasses = {
      default: 'border-input bg-background focus-visible:border-[var(--primary)]',
      filled: 'border-transparent bg-muted focus-visible:bg-background focus-visible:border-[var(--primary)]',
      ghost: 'border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted',
    };
    
    const inputElement = (
      <Input
        ref={ref}
        id={context.id}
        name={context.name}
        disabled={context.disabled}
        required={context.required}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? `${context.id}-error` : undefined}
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          hasError && 'border-destructive focus-visible:ring-destructive',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        {...props}
      />
    );
    
    // If we have icons or addons, wrap the input
    if (leftIcon || rightIcon || leftAddon || rightAddon) {
      return (
        <div className="relative flex">
          {leftAddon && (
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              {leftAddon}
            </span>
          )}
          
          <div className="relative flex-1">
            {leftIcon && (
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                {leftIcon}
              </span>
            )}
            
            {inputElement}
            
            {rightIcon && (
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                {rightIcon}
              </span>
            )}
          </div>
          
          {rightAddon && (
            <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              {rightAddon}
            </span>
          )}
        </div>
      );
    }
    
    return inputElement;
  }
);

FormFieldInput.displayName = 'FormFieldInput';

// =============================================================================
// FormFieldTextarea - Textarea with automatic context integration
// =============================================================================

export interface FormFieldTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'id'> {
  size?: FieldSize;
  variant?: FieldVariant;
  showCharCount?: boolean;
  maxLength?: number;
}

export const FormFieldTextarea = React.forwardRef<HTMLTextAreaElement, FormFieldTextareaProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      showCharCount = false,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const context = useFormFieldContext();
    const hasError = Boolean(context.error);
    
    const charCount = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxLength && charCount >= maxLength * 0.9;
    const isAtLimit = maxLength && charCount >= maxLength;
    
    const sizeClasses = {
      sm: 'min-h-[60px] text-sm px-2.5 py-1.5',
      md: 'min-h-[80px] text-sm px-3 py-2',
      lg: 'min-h-[120px] text-base px-4 py-3',
    };
    
    const variantClasses = {
      default: 'border-input bg-background focus-visible:border-[var(--primary)]',
      filled: 'border-transparent bg-muted focus-visible:bg-background focus-visible:border-[var(--primary)]',
      ghost: 'border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted',
    };
    
    return (
      <div className="relative">
        <textarea
          ref={ref}
          id={context.id}
          name={context.name}
          disabled={context.disabled}
          required={context.required}
          maxLength={maxLength}
          value={value}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={hasError ? `${context.id}-error` : undefined}
          className={cn(
            'flex w-full rounded-md border ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            sizeClasses[size],
            variantClasses[variant],
            hasError && 'border-destructive focus-visible:ring-destructive',
            showCharCount && maxLength && 'pb-6',
            className
          )}
          {...props}
        />
        
        {showCharCount && maxLength && (
          <span
            className={cn(
              'absolute bottom-2 right-3 text-xs',
              isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'
            )}
            aria-live="polite"
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    );
  }
);

FormFieldTextarea.displayName = 'FormFieldTextarea';

// =============================================================================
// FormFieldGroup - Group related fields with a label
// =============================================================================

export interface FormFieldGroupProps {
  legend?: string;
  description?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

export function FormFieldGroup({
  legend,
  description,
  required,
  error,
  className,
  children,
}: FormFieldGroupProps) {
  const hasError = Boolean(error);
  
  return (
    <fieldset
      className={cn(
        'space-y-4 rounded-lg border border-border p-4',
        hasError && 'border-destructive bg-destructive/10',
        className
      )}
    >
      {legend && (
        <legend
          className={cn(
            'px-2 text-sm font-medium text-foreground',
            hasError && 'text-destructive'
          )}
        >
          {legend}
          {required && (
            <span className="ml-1 text-destructive" aria-hidden="true">*</span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </legend>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
      
      {hasError && (
        <FieldError>{error}</FieldError>
      )}
    </fieldset>
  );
}

// =============================================================================
// FormFieldRow - Horizontal layout for form fields
// =============================================================================

export interface FormFieldRowProps {
  className?: string;
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
}

export function FormFieldRow({
  className,
  children,
  gap = 'md',
}: FormFieldRowProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };
  
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2',
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default FormField;
