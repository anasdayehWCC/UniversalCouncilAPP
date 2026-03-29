'use client';

import * as React from 'react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useForm, UseFormReturn, UseFormOptions } from '@/hooks/useForm';

// Context for form state
interface FormContextValue<T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  form: UseFormReturn<T>;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export function useFormContext<T extends z.ZodObject<z.ZodRawShape>>() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form');
  }
  return context as FormContextValue<T>;
}

// Form props
interface FormProps<T extends z.ZodObject<z.ZodRawShape>> 
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onError' | 'children'> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit?: (data: z.infer<T>) => void | Promise<void>;
  onValidationError?: (errors: Record<string, string>) => void;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  children: React.ReactNode | ((form: UseFormReturn<T>) => React.ReactNode);
}

export function Form<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  defaultValues,
  onSubmit,
  onValidationError,
  validateOnBlur = true,
  validateOnChange = false,
  children,
  className,
  ...props
}: FormProps<T>) {
  const form = useForm({
    schema,
    defaultValues,
    onSubmit: async (data) => {
      await onSubmit?.(data);
    },
    validateOnBlur,
    validateOnChange,
  } as UseFormOptions<T>);

  // Call onValidationError when form is submitted with errors
  React.useEffect(() => {
    if (form.isSubmitted && Object.keys(form.errors).length > 0) {
      onValidationError?.(form.errors);
    }
  }, [form.isSubmitted, form.errors, onValidationError]);

  const contextValue = React.useMemo(
    () => ({ form }),
    [form]
  );

  return (
    <FormContext.Provider value={contextValue as FormContextValue}>
      <form
        onSubmit={form.handleSubmit}
        className={cn('space-y-4', className)}
        noValidate
        {...props}
      >
        {typeof children === 'function' ? children(form) : children}
      </form>
    </FormContext.Provider>
  );
}

// Form submit button helper
interface FormSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  submittingText?: string;
}

export function FormSubmit({
  children = 'Submit',
  submittingText = 'Submitting...',
  className,
  disabled,
  ...props
}: FormSubmitProps) {
  const { form } = useFormContext();

  return (
    <button
      type="submit"
      disabled={disabled || form.isSubmitting}
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors',
        'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {form.isSubmitting ? submittingText : children}
    </button>
  );
}

// Form reset button helper
interface FormResetProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function FormReset({
  children = 'Reset',
  className,
  onClick,
  ...props
}: FormResetProps) {
  const { form } = useFormContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    form.reset();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Status message component
interface FormStatusProps {
  className?: string;
}

export function FormStatus({ className }: FormStatusProps) {
  const { form } = useFormContext();
  const errorCount = Object.keys(form.errors).length;

  if (!form.isSubmitted || errorCount === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive',
        className
      )}
    >
      <p className="font-medium">
        Please fix {errorCount} {errorCount === 1 ? 'error' : 'errors'} before submitting.
      </p>
    </div>
  );
}

export default Form;
