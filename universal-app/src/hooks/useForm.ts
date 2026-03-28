'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';
import { getErrorMessages } from '@/lib/forms/validation';

export interface UseFormOptions<T extends z.ZodObject<z.ZodRawShape>> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit?: (data: z.infer<T>) => void | Promise<void>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export interface FieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

export interface UseFormReturn<T extends z.ZodObject<z.ZodRawShape>> {
  // State
  values: z.infer<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  
  // Field helpers
  getFieldProps: (name: keyof z.infer<T>) => {
    name: string;
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
  getFieldState: (name: keyof z.infer<T>) => FieldState;
  
  // Actions
  setValue: (name: keyof z.infer<T>, value: unknown) => void;
  setValues: (values: Partial<z.infer<T>>) => void;
  setError: (name: keyof z.infer<T>, error: string) => void;
  clearError: (name: keyof z.infer<T>) => void;
  setTouched: (name: keyof z.infer<T>, touched?: boolean) => void;
  
  // Validation
  validateField: (name: keyof z.infer<T>) => boolean;
  validateForm: () => boolean;
  
  // Form actions
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<z.infer<T>>) => void;
}

export function useForm<T extends z.ZodObject<z.ZodRawShape>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  type FormValues = z.infer<T>;
  
  const { 
    schema, 
    defaultValues = {} as Partial<FormValues>,
    onSubmit,
    validateOnBlur = true,
    validateOnChange = false,
  } = options;
  
  const initialValues = useRef<Partial<FormValues>>(defaultValues);
  
  const [values, setValuesState] = useState<FormValues>(() => ({
    ...getDefaultValues(schema),
    ...defaultValues,
  } as FormValues));
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      key => values[key as keyof FormValues] !== initialValues.current[key as keyof FormValues]
    );
  }, [values]);
  
  const isValid = useMemo(() => {
    const result = schema.safeParse(values);
    return result.success;
  }, [values, schema]);
  
  const setValue = useCallback((name: keyof FormValues, value: unknown) => {
    setValuesState(prev => ({ ...prev, [name]: value }));
    if (validateOnChange) {
      const fieldSchema = schema.shape[name as string];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          setErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
        } else {
          setErrors(prev => {
            const next = { ...prev };
            delete next[name as string];
            return next;
          });
        }
      }
    }
  }, [schema.shape, validateOnChange]);
  
  const setValues = useCallback((newValues: Partial<FormValues>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);
  
  const setError = useCallback((name: keyof FormValues, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);
  
  const clearError = useCallback((name: keyof FormValues) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[name as string];
      return next;
    });
  }, []);
  
  const setTouched = useCallback((name: keyof FormValues, isTouched = true) => {
    setTouchedState(prev => ({ ...prev, [name]: isTouched }));
  }, []);
  
  const validateField = useCallback((name: keyof FormValues): boolean => {
    const fieldSchema = schema.shape[name as string];
    if (!fieldSchema) return true;
    
    const result = fieldSchema.safeParse(values[name]);
    if (!result.success) {
      setErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
      return false;
    }
    
    setErrors(prev => {
      const next = { ...prev };
      delete next[name as string];
      return next;
    });
    return true;
  }, [schema.shape, values]);
  
  const validateForm = useCallback((): boolean => {
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(getErrorMessages(result.error));
      return false;
    }
    setErrors({});
    return true;
  }, [schema, values]);
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitted(true);
    
    if (!validateForm()) return;
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);
  
  const reset = useCallback((newValues?: Partial<FormValues>) => {
    const resetTo = newValues ?? initialValues.current;
    setValuesState({
      ...getDefaultValues(schema),
      ...resetTo,
    } as FormValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitted(false);
  }, [schema]);
  
  const getFieldProps = useCallback((name: keyof FormValues) => ({
    name: name as string,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target;
      const newValue = target.type === 'checkbox' 
        ? (target as HTMLInputElement).checked 
        : target.value;
      setValue(name, newValue);
    },
    onBlur: () => {
      setTouched(name);
      if (validateOnBlur) {
        validateField(name);
      }
    },
  }), [values, setValue, setTouched, validateField, validateOnBlur]);
  
  const getFieldState = useCallback((name: keyof FormValues): FieldState => ({
    value: values[name],
    error: errors[name as string] ?? null,
    touched: touched[name as string] ?? false,
    dirty: values[name] !== initialValues.current[name],
  }), [values, errors, touched]);
  
  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isSubmitting,
    isSubmitted,
    getFieldProps,
    getFieldState,
    setValue,
    setValues,
    setError,
    clearError,
    setTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
  };
}

// Helper to extract default values from Zod schema
function getDefaultValues<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
): Partial<z.infer<T>> {
  const defaults: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(schema.shape)) {
    const def = value as z.ZodTypeAny;
    if (def._def.defaultValue !== undefined) {
      defaults[key] = def._def.defaultValue();
    } else if (def instanceof z.ZodString) {
      defaults[key] = '';
    } else if (def instanceof z.ZodNumber) {
      defaults[key] = 0;
    } else if (def instanceof z.ZodBoolean) {
      defaults[key] = false;
    } else if (def instanceof z.ZodArray) {
      defaults[key] = [];
    }
  }
  
  return defaults as Partial<z.infer<T>>;
}

export default useForm;
