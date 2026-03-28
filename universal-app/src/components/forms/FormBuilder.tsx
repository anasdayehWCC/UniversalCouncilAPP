'use client';

import * as React from 'react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { getFieldMetadata, getRequiredFields } from '@/lib/forms/validation';
import { useFormValidation, UseFormValidationReturn } from '@/lib/forms/hooks';
import { FormField, FieldError, FormFieldRow, FormFieldGroup } from './FormField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from './Checkbox';
import { SelectField } from './Select';
import { Loader2 } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'hidden';

export interface FieldConfig<T = unknown> {
  name: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  tooltip?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  className?: string;
  
  // Type-specific options
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  pattern?: string;
  
  // Conditional rendering
  condition?: (values: T) => boolean;
  dependsOn?: string[];
  
  // Custom render
  render?: (props: {
    field: FieldConfig<T>;
    value: unknown;
    error: string | null;
    touched: boolean;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    form: UseFormValidationReturn<z.ZodRawShape>;
  }) => React.ReactNode;
  
  // Transformations
  transform?: {
    input?: (value: unknown) => unknown;
    output?: (value: unknown) => unknown;
  };
}

export interface FormBuilderSection<T = unknown> {
  id: string;
  title?: string;
  description?: string;
  fields: FieldConfig<T>[];
  columns?: 1 | 2 | 3;
  condition?: (values: T) => boolean;
  className?: string;
}

export interface FormBuilderConfig<T extends z.ZodRawShape = z.ZodRawShape> {
  schema: z.ZodObject<T>;
  sections?: FormBuilderSection<z.infer<z.ZodObject<T>>>[];
  fields?: FieldConfig<z.infer<z.ZodObject<T>>>[];
  defaultValues?: Partial<z.infer<z.ZodObject<T>>>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  onSubmit?: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  onSubmitError?: (errors: Record<string, string>) => void;
  onChange?: (values: z.infer<z.ZodObject<T>>) => void;
}

export interface FormBuilderProps<T extends z.ZodRawShape = z.ZodRawShape>
  extends FormBuilderConfig<T> {
  className?: string;
  children?: React.ReactNode | ((form: UseFormValidationReturn<T>) => React.ReactNode);
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showReset?: boolean;
  resetLabel?: string;
  footer?: React.ReactNode | ((form: UseFormValidationReturn<T>) => React.ReactNode);
  autoGenerateFields?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

// =============================================================================
// FormBuilder Context
// =============================================================================

interface FormBuilderContextValue<T extends z.ZodRawShape = z.ZodRawShape> {
  form: UseFormValidationReturn<T>;
  config: FormBuilderConfig<T>;
  disabled: boolean;
}

const FormBuilderContext = React.createContext<FormBuilderContextValue | null>(null);

export function useFormBuilderContext<T extends z.ZodRawShape = z.ZodRawShape>() {
  const context = React.useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilderContext must be used within a FormBuilder');
  }
  return context as FormBuilderContextValue<T>;
}

// =============================================================================
// FormBuilder Component
// =============================================================================

export function FormBuilder<T extends z.ZodRawShape>({
  schema,
  sections,
  fields,
  defaultValues,
  validateOnBlur = true,
  validateOnChange = false,
  onSubmit,
  onSubmitError,
  onChange,
  className,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  showReset = false,
  resetLabel = 'Reset',
  footer,
  autoGenerateFields = false,
  disabled = false,
  loading = false,
}: FormBuilderProps<T>) {
  type FormValues = z.infer<z.ZodObject<T>>;
  
  const form = useFormValidation({
    schema,
    defaultValues,
    validateOnBlur,
    validateOnChange,
    onSubmit,
    onSubmitError,
  });
  
  // Track value changes
  const prevValuesRef = React.useRef(form.state.values);
  React.useEffect(() => {
    if (onChange && prevValuesRef.current !== form.state.values) {
      onChange(form.state.values);
      prevValuesRef.current = form.state.values;
    }
  }, [form.state.values, onChange]);
  
  // Auto-generate fields from schema if requested
  const generatedFields = React.useMemo(() => {
    if (!autoGenerateFields || fields) return null;
    
    const schemaFields: FieldConfig<FormValues>[] = [];
    const required = getRequiredFields(schema);
    
    for (const key of Object.keys(schema.shape)) {
      const metadata = getFieldMetadata(schema, key as keyof T);
      
      let type: FieldType = 'text';
      if (metadata.type === 'number') type = 'number';
      else if (metadata.type === 'boolean') type = 'checkbox';
      else if (metadata.type === 'enum') type = 'select';
      
      const field: FieldConfig<FormValues> = {
        name: key,
        type,
        label: formatLabel(key),
        required: required.includes(key as keyof T),
        options: metadata.enumValues?.map(v => ({ value: v, label: formatLabel(v) })),
        min: metadata.min,
        max: metadata.max,
      };
      
      schemaFields.push(field);
    }
    
    return schemaFields;
  }, [schema, autoGenerateFields, fields]);
  
  const fieldsToRender = fields ?? generatedFields ?? [];
  
  const contextValue = React.useMemo<FormBuilderContextValue<T>>(() => ({
    form,
    config: { schema, sections, fields, defaultValues, validateOnBlur, validateOnChange, onSubmit, onSubmitError, onChange },
    disabled: disabled || loading,
  }), [form, schema, sections, fields, defaultValues, validateOnBlur, validateOnChange, onSubmit, onSubmitError, onChange, disabled, loading]);
  
  return (
    <FormBuilderContext.Provider value={contextValue as FormBuilderContextValue}>
      <form
        onSubmit={form.handleSubmit}
        className={cn('space-y-6', className)}
        noValidate
      >
        {/* Render sections if provided */}
        {sections?.map((section) => (
          <FormBuilderSection key={section.id} section={section} />
        ))}
        
        {/* Render flat fields if provided */}
        {fieldsToRender.length > 0 && !sections && (
          <div className="space-y-4">
            {fieldsToRender.map((field) => (
              <FormBuilderField key={field.name} field={field} />
            ))}
          </div>
        )}
        
        {/* Custom children */}
        {children && (
          <div className="space-y-4">
            {typeof children === 'function' ? children(form) : children}
          </div>
        )}
        
        {/* Form status */}
        {form.state.isSubmitted && Object.keys(form.state.errors).length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md border border-red-200 bg-red-50 p-3"
          >
            <p className="text-sm font-medium text-red-700">
              Please fix {Object.keys(form.state.errors).length} error
              {Object.keys(form.state.errors).length !== 1 ? 's' : ''} before submitting.
            </p>
          </div>
        )}
        
        {/* Footer */}
        {footer ? (
          typeof footer === 'function' ? footer(form) : footer
        ) : (
          <FormBuilderFooter
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            onCancel={onCancel}
            showReset={showReset}
            resetLabel={resetLabel}
            disabled={disabled}
            loading={loading}
          />
        )}
      </form>
    </FormBuilderContext.Provider>
  );
}

// =============================================================================
// FormBuilderSection Component
// =============================================================================

interface FormBuilderSectionProps<T = unknown> {
  section: FormBuilderSection<T>;
}

function FormBuilderSection<T>({ section }: FormBuilderSectionProps<T>) {
  const { form, disabled } = useFormBuilderContext();
  const values = form.state.values;
  
  // Check condition
  if (section.condition && !section.condition(values as T)) {
    return null;
  }
  
  const columnClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };
  
  return (
    <FormFieldGroup
      legend={section.title}
      description={section.description}
      className={section.className}
    >
      <div className={cn('grid gap-4', columnClass[section.columns ?? 1])}>
        {section.fields.map((field) => (
          <FormBuilderField key={field.name} field={field as unknown as FieldConfig<z.infer<z.ZodObject<z.ZodRawShape>>>} />
        ))}
      </div>
    </FormFieldGroup>
  );
}

// =============================================================================
// FormBuilderField Component
// =============================================================================

interface FormBuilderFieldProps<T = unknown> {
  field: FieldConfig<T>;
}

function FormBuilderField<T>({ field: fieldConfig }: FormBuilderFieldProps<T>) {
  const { form, disabled: formDisabled } = useFormBuilderContext();
  const values = form.state.values;
  
  // Check condition
  if (fieldConfig.condition && !fieldConfig.condition(values as T)) {
    return null;
  }
  
  const fieldState = form.getFieldState(fieldConfig.name as keyof typeof values);
  const isDisabled = formDisabled || fieldConfig.disabled;
  const hasError = fieldState.touched && fieldState.error !== null;
  
  // Get transformed value
  const value = fieldConfig.transform?.input
    ? fieldConfig.transform.input(fieldState.value)
    : fieldState.value;
  
  const handleChange = (newValue: unknown) => {
    const transformedValue = fieldConfig.transform?.output
      ? fieldConfig.transform.output(newValue)
      : newValue;
    form.setValue(fieldConfig.name as keyof typeof values, transformedValue);
  };
  
  const handleBlur = () => {
    form.setTouched(fieldConfig.name as keyof typeof values);
    form.validateField(fieldConfig.name as keyof typeof values);
  };
  
  // Custom render
  if (fieldConfig.render) {
    return fieldConfig.render({
      field: fieldConfig,
      value,
      error: fieldState.error,
      touched: fieldState.touched,
      onChange: handleChange,
      onBlur: handleBlur,
      form: form as UseFormValidationReturn<z.ZodRawShape>,
    });
  }
  
  // Hidden fields
  if (fieldConfig.type === 'hidden') {
    return (
      <input
        type="hidden"
        name={fieldConfig.name}
        value={String(value ?? '')}
      />
    );
  }
  
  // Select fields
  if (fieldConfig.type === 'select' && fieldConfig.options) {
    return (
      <FormField
        name={fieldConfig.name}
        label={fieldConfig.label}
        description={fieldConfig.description}
        helpText={fieldConfig.helpText}
        tooltip={fieldConfig.tooltip}
        error={hasError ? fieldState.error : null}
        required={fieldConfig.required}
        disabled={isDisabled}
        className={fieldConfig.className}
      >
        <SelectField
          name={fieldConfig.name}
          options={fieldConfig.options}
          placeholder={fieldConfig.placeholder}
          disabled={isDisabled}
        />
      </FormField>
    );
  }
  
  // Checkbox fields
  if (fieldConfig.type === 'checkbox') {
    return (
      <div className={cn('flex items-start gap-3', fieldConfig.className)}>
        <Checkbox
          id={`field-${fieldConfig.name}`}
          label={fieldConfig.label ?? fieldConfig.name}
          checked={Boolean(value)}
          onCheckedChange={(checked) => handleChange(checked)}
          disabled={isDisabled}
        />
        <div className="space-y-1">
          {fieldConfig.label && (
            <Label
              htmlFor={`field-${fieldConfig.name}`}
              className={cn(
                'text-sm font-medium cursor-pointer',
                hasError && 'text-red-600'
              )}
            >
              {fieldConfig.label}
              {fieldConfig.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
          )}
          {fieldConfig.description && (
            <p className="text-sm text-slate-500">{fieldConfig.description}</p>
          )}
          {hasError && (
            <FieldError id={`field-${fieldConfig.name}-error`}>
              {fieldState.error}
            </FieldError>
          )}
        </div>
      </div>
    );
  }
  
  // Textarea fields
  if (fieldConfig.type === 'textarea') {
    return (
      <FormField
        name={fieldConfig.name}
        label={fieldConfig.label}
        description={fieldConfig.description}
        helpText={fieldConfig.helpText}
        tooltip={fieldConfig.tooltip}
        error={hasError ? fieldState.error : null}
        required={fieldConfig.required}
        disabled={isDisabled}
        className={fieldConfig.className}
      >
        <textarea
          id={`field-${fieldConfig.name}`}
          name={fieldConfig.name}
          value={String(value ?? '')}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={fieldConfig.placeholder}
          disabled={isDisabled}
          readOnly={fieldConfig.readOnly}
          rows={fieldConfig.rows ?? 4}
          minLength={fieldConfig.minLength}
          maxLength={fieldConfig.maxLength}
          required={fieldConfig.required}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={hasError ? `field-${fieldConfig.name}-error` : undefined}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
            'placeholder:text-slate-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-red-500 focus-visible:ring-red-500'
          )}
        />
      </FormField>
    );
  }
  
  // Standard input fields
  return (
    <FormField
      name={fieldConfig.name}
      label={fieldConfig.label}
      description={fieldConfig.description}
      helpText={fieldConfig.helpText}
      tooltip={fieldConfig.tooltip}
      error={hasError ? fieldState.error : null}
      required={fieldConfig.required}
      disabled={isDisabled}
      className={fieldConfig.className}
    >
      <Input
        id={`field-${fieldConfig.name}`}
        name={fieldConfig.name}
        type={fieldConfig.type}
        value={String(value ?? '')}
        onChange={(e) => {
          const newValue = fieldConfig.type === 'number'
            ? e.target.valueAsNumber || 0
            : e.target.value;
          handleChange(newValue);
        }}
        onBlur={handleBlur}
        placeholder={fieldConfig.placeholder}
        disabled={isDisabled}
        readOnly={fieldConfig.readOnly}
        autoComplete={fieldConfig.autoComplete}
        min={fieldConfig.min}
        max={fieldConfig.max}
        step={fieldConfig.step}
        minLength={fieldConfig.minLength}
        maxLength={fieldConfig.maxLength}
        pattern={fieldConfig.pattern}
        required={fieldConfig.required}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? `field-${fieldConfig.name}-error` : undefined}
        className={cn(
          hasError && 'border-red-500 focus-visible:ring-red-500'
        )}
      />
    </FormField>
  );
}

// =============================================================================
// FormBuilderFooter Component
// =============================================================================

interface FormBuilderFooterProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showReset?: boolean;
  resetLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function FormBuilderFooter({
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  showReset = false,
  resetLabel = 'Reset',
  disabled = false,
  loading = false,
  className,
}: FormBuilderFooterProps) {
  const { form, disabled: formDisabled } = useFormBuilderContext();
  const isDisabled = disabled || formDisabled || form.state.isSubmitting || loading;
  
  return (
    <div className={cn('flex items-center justify-end gap-3 pt-4', className)}>
      {showReset && (
        <button
          type="button"
          onClick={() => form.reset()}
          disabled={isDisabled}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
            'text-slate-600 hover:bg-slate-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {resetLabel}
        </button>
      )}
      
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isDisabled}
          className={cn(
            'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium',
            'text-slate-700 hover:bg-slate-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {cancelLabel}
        </button>
      )}
      
      <button
        type="submit"
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm',
          'hover:opacity-90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {form.state.isSubmitting ? 'Submitting...' : submitLabel}
      </button>
    </div>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatLabel(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\s/, '')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// =============================================================================
// Field Builder Helpers
// =============================================================================

export function createFieldConfig<T>(config: FieldConfig<T>): FieldConfig<T> {
  return config;
}

export function createSectionConfig<T>(config: FormBuilderSection<T>): FormBuilderSection<T> {
  return config;
}

// Pre-built field configurations for common patterns
export const commonFields = {
  email: (overrides?: Partial<FieldConfig>): FieldConfig => ({
    name: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'you@example.com',
    autoComplete: 'email',
    required: true,
    ...overrides,
  }),
  
  phone: (overrides?: Partial<FieldConfig>): FieldConfig => ({
    name: 'phone',
    type: 'tel',
    label: 'Phone Number',
    placeholder: '+44 7XXX XXXXXX',
    autoComplete: 'tel',
    ...overrides,
  }),
  
  name: (overrides?: Partial<FieldConfig>): FieldConfig => ({
    name: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'John Smith',
    autoComplete: 'name',
    required: true,
    ...overrides,
  }),
  
  password: (overrides?: Partial<FieldConfig>): FieldConfig => ({
    name: 'password',
    type: 'password',
    label: 'Password',
    autoComplete: 'current-password',
    required: true,
    minLength: 8,
    ...overrides,
  }),
  
  date: (overrides?: Partial<FieldConfig>): FieldConfig => ({
    name: 'date',
    type: 'date',
    label: 'Date',
    required: true,
    ...overrides,
  }),
  
  notes: (overrides?: Partial<FieldConfig>): FieldConfig => ({
    name: 'notes',
    type: 'textarea',
    label: 'Notes',
    placeholder: 'Enter any additional notes...',
    rows: 4,
    maxLength: 2000,
    ...overrides,
  }),
};

// =============================================================================
// Exports
// =============================================================================

export default FormBuilder;

export {
  FormBuilderSection as FormSection,
  FormBuilderField as FormBuilderFieldComponent,
};
