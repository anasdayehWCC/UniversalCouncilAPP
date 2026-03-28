'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { getErrorMessages, getFieldMetadata, getRequiredFields } from './validation';

// =============================================================================
// Types
// =============================================================================

export interface FieldValidationState {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

export interface FormValidationState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
}

export interface UseFormValidationOptions<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  defaultValues?: Partial<z.infer<z.ZodObject<T>>>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validateOnMount?: boolean;
  revalidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
  delayError?: number;
  onSubmit?: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  onSubmitError?: (errors: Record<string, string>, data: Partial<z.infer<z.ZodObject<T>>>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface UseFormValidationReturn<T extends z.ZodRawShape> {
  // State
  state: FormValidationState<z.infer<z.ZodObject<T>>>;
  
  // Field helpers
  register: (name: keyof z.infer<z.ZodObject<T>>) => {
    name: string;
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  };
  
  // Field state
  getFieldState: (name: keyof z.infer<z.ZodObject<T>>) => FieldValidationState;
  getFieldError: (name: keyof z.infer<z.ZodObject<T>>) => string | null;
  isFieldValid: (name: keyof z.infer<z.ZodObject<T>>) => boolean;
  isFieldTouched: (name: keyof z.infer<z.ZodObject<T>>) => boolean;
  isFieldDirty: (name: keyof z.infer<z.ZodObject<T>>) => boolean;
  
  // Field actions
  setValue: (name: keyof z.infer<z.ZodObject<T>>, value: unknown) => void;
  setValues: (values: Partial<z.infer<z.ZodObject<T>>>) => void;
  setError: (name: keyof z.infer<z.ZodObject<T>>, error: string) => void;
  clearError: (name: keyof z.infer<z.ZodObject<T>>) => void;
  clearErrors: () => void;
  setTouched: (name: keyof z.infer<z.ZodObject<T>>, touched?: boolean) => void;
  
  // Validation
  validateField: (name: keyof z.infer<z.ZodObject<T>>) => Promise<boolean>;
  validateFields: (names: (keyof z.infer<z.ZodObject<T>>)[]) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  
  // Cross-field validation
  addCrossFieldValidation: (
    fields: (keyof z.infer<z.ZodObject<T>>)[],
    validate: (values: z.infer<z.ZodObject<T>>) => string | null,
    errorField?: keyof z.infer<z.ZodObject<T>>
  ) => () => void;
  
  // Form actions
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<z.infer<z.ZodObject<T>>>) => void;
  
  // Schema info
  getRequiredFields: () => (keyof z.infer<z.ZodObject<T>>)[];
  getFieldMetadata: (name: keyof z.infer<z.ZodObject<T>>) => ReturnType<typeof getFieldMetadata>;
}

// =============================================================================
// useFormValidation Hook
// =============================================================================

export function useFormValidation<T extends z.ZodRawShape>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  type FormValues = z.infer<z.ZodObject<T>>;
  
  const {
    schema,
    defaultValues = {} as Partial<FormValues>,
    validateOnBlur = true,
    validateOnChange = false,
    validateOnMount = false,
    revalidateMode = 'onBlur',
    delayError = 0,
    onSubmit,
    onSubmitError,
    onValidationChange,
  } = options;
  
  const initialValuesRef = useRef<Partial<FormValues>>(defaultValues);
  const crossFieldValidationsRef = useRef<Map<string, {
    fields: (keyof FormValues)[];
    validate: (values: FormValues) => string | null;
    errorField: keyof FormValues;
  }>>(new Map());
  const errorTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const [values, setValuesState] = useState<FormValues>(() => {
    return extractDefaultValues(schema, defaultValues);
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [dirty, setDirtyState] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  
  // Derived state
  const isValid = useMemo(() => {
    const result = schema.safeParse(values);
    return result.success && Object.keys(errors).length === 0;
  }, [values, schema, errors]);
  
  const isDirty = useMemo(() => {
    return Object.values(dirty).some(Boolean);
  }, [dirty]);
  
  const isValidating = useMemo(() => {
    return Object.values(validating).some(Boolean);
  }, [validating]);
  
  // Notify when validation state changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);
  
  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateFormInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      for (const timeout of errorTimeoutRef.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);
  
  // Internal validation function
  const validateFieldInternal = useCallback(async (name: keyof FormValues): Promise<boolean> => {
    const fieldName = name as string;
    
    // Clear existing timeout for this field
    const existingTimeout = errorTimeoutRef.current.get(fieldName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    setValidating(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      const fieldSchema = schema.shape[fieldName];
      if (!fieldSchema) return true;
      
      const result = fieldSchema.safeParse(values[name]);
      
      // Check cross-field validations
      let crossFieldError: string | null = null;
      for (const validation of crossFieldValidationsRef.current.values()) {
        if (validation.fields.includes(name)) {
          const error = validation.validate(values);
          if (error && validation.errorField === name) {
            crossFieldError = error;
            break;
          }
        }
      }
      
      const setErrorWithDelay = (error: string | null) => {
        if (delayError > 0 && error) {
          const timeout = setTimeout(() => {
            setErrors(prev => error ? { ...prev, [fieldName]: error } : removeKey(prev, fieldName));
          }, delayError);
          errorTimeoutRef.current.set(fieldName, timeout);
        } else {
          setErrors(prev => error ? { ...prev, [fieldName]: error } : removeKey(prev, fieldName));
        }
      };
      
      if (!result.success) {
        setErrorWithDelay(result.error.issues[0].message);
        return false;
      } else if (crossFieldError) {
        setErrorWithDelay(crossFieldError);
        return false;
      } else {
        setErrorWithDelay(null);
        return true;
      }
    } finally {
      setValidating(prev => ({ ...prev, [fieldName]: false }));
    }
  }, [schema.shape, values, delayError]);
  
  const validateFormInternal = useCallback(async (): Promise<boolean> => {
    const result = schema.safeParse(values);
    
    if (!result.success) {
      setErrors(getErrorMessages(result.error));
      return false;
    }
    
    // Run cross-field validations
    const crossFieldErrors: Record<string, string> = {};
    for (const validation of crossFieldValidationsRef.current.values()) {
      const error = validation.validate(values);
      if (error) {
        crossFieldErrors[validation.errorField as string] = error;
      }
    }
    
    if (Object.keys(crossFieldErrors).length > 0) {
      setErrors(crossFieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [schema, values]);
  
  // Public methods
  const setValue = useCallback((name: keyof FormValues, value: unknown) => {
    const fieldName = name as string;
    setValuesState(prev => ({ ...prev, [fieldName]: value }));
    setDirtyState(prev => ({ ...prev, [fieldName]: value !== initialValuesRef.current[name] }));
    
    if (validateOnChange) {
      validateFieldInternal(name);
    } else if (isSubmitted && revalidateMode === 'onChange') {
      validateFieldInternal(name);
    }
  }, [validateOnChange, isSubmitted, revalidateMode, validateFieldInternal]);
  
  const setValues = useCallback((newValues: Partial<FormValues>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
    
    const newDirty: Record<string, boolean> = {};
    for (const key of Object.keys(newValues)) {
      newDirty[key] = newValues[key as keyof FormValues] !== initialValuesRef.current[key as keyof FormValues];
    }
    setDirtyState(prev => ({ ...prev, ...newDirty }));
  }, []);
  
  const setError = useCallback((name: keyof FormValues, error: string) => {
    setErrors(prev => ({ ...prev, [name as string]: error }));
  }, []);
  
  const clearError = useCallback((name: keyof FormValues) => {
    setErrors(prev => removeKey(prev, name as string));
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  const setTouched = useCallback((name: keyof FormValues, isTouched = true) => {
    setTouchedState(prev => ({ ...prev, [name as string]: isTouched }));
  }, []);
  
  const validateField = useCallback(async (name: keyof FormValues): Promise<boolean> => {
    return validateFieldInternal(name);
  }, [validateFieldInternal]);
  
  const validateFields = useCallback(async (names: (keyof FormValues)[]): Promise<boolean> => {
    const results = await Promise.all(names.map(name => validateFieldInternal(name)));
    return results.every(Boolean);
  }, [validateFieldInternal]);
  
  const validateForm = useCallback(async (): Promise<boolean> => {
    return validateFormInternal();
  }, [validateFormInternal]);
  
  const addCrossFieldValidation = useCallback((
    fields: (keyof FormValues)[],
    validate: (values: FormValues) => string | null,
    errorField?: keyof FormValues
  ): () => void => {
    const id = Math.random().toString(36).slice(2);
    crossFieldValidationsRef.current.set(id, {
      fields,
      validate,
      errorField: errorField ?? fields[0],
    });
    
    return () => {
      crossFieldValidationsRef.current.delete(id);
    };
  }, []);
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitted(true);
    setSubmitCount(prev => prev + 1);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    for (const key of Object.keys(schema.shape)) {
      allTouched[key] = true;
    }
    setTouchedState(allTouched);
    
    const isValidForm = await validateFormInternal();
    
    if (!isValidForm) {
      onSubmitError?.(errors, values);
      return;
    }
    
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [schema.shape, values, errors, validateFormInternal, onSubmit, onSubmitError]);
  
  const reset = useCallback((newValues?: Partial<FormValues>) => {
    const resetTo = newValues ?? initialValuesRef.current;
    setValuesState(extractDefaultValues(schema, resetTo));
    setErrors({});
    setTouchedState({});
    setDirtyState({});
    setValidating({});
    setIsSubmitted(false);
    
    // Update initial values if new ones provided
    if (newValues) {
      initialValuesRef.current = newValues;
    }
  }, [schema]);
  
  const register = useCallback((name: keyof FormValues) => {
    const fieldName = name as string;
    const error = errors[fieldName];
    const isTouched = touched[fieldName];
    
    return {
      name: fieldName,
      value: values[name] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const newValue = target.type === 'checkbox'
          ? (target as HTMLInputElement).checked
          : target.value;
        setValue(name, newValue);
      },
      onBlur: () => {
        setTouched(name);
        if (validateOnBlur || (isSubmitted && revalidateMode === 'onBlur')) {
          validateFieldInternal(name);
        }
      },
      ...(isTouched && error ? {
        'aria-invalid': true,
        'aria-describedby': `${fieldName}-error`,
      } : {}),
    };
  }, [values, errors, touched, isSubmitted, revalidateMode, validateOnBlur, setValue, setTouched, validateFieldInternal]);
  
  const getFieldState = useCallback((name: keyof FormValues): FieldValidationState => ({
    value: values[name],
    error: errors[name as string] ?? null,
    touched: touched[name as string] ?? false,
    dirty: dirty[name as string] ?? false,
    validating: validating[name as string] ?? false,
  }), [values, errors, touched, dirty, validating]);
  
  const getFieldError = useCallback((name: keyof FormValues): string | null => {
    return errors[name as string] ?? null;
  }, [errors]);
  
  const isFieldValid = useCallback((name: keyof FormValues): boolean => {
    const fieldSchema = schema.shape[name as string];
    if (!fieldSchema) return true;
    return fieldSchema.safeParse(values[name]).success && !errors[name as string];
  }, [schema.shape, values, errors]);
  
  const isFieldTouched = useCallback((name: keyof FormValues): boolean => {
    return touched[name as string] ?? false;
  }, [touched]);
  
  const isFieldDirty = useCallback((name: keyof FormValues): boolean => {
    return dirty[name as string] ?? false;
  }, [dirty]);
  
  const getRequiredFieldsFromSchema = useCallback((): (keyof FormValues)[] => {
    return getRequiredFields(schema);
  }, [schema]);
  
  const getFieldMetadataFromSchema = useCallback((name: keyof FormValues) => {
    return getFieldMetadata(schema, name);
  }, [schema]);
  
  return {
    state: {
      values,
      errors,
      touched,
      dirty,
      isValid,
      isDirty,
      isValidating,
      isSubmitting,
      isSubmitted,
      submitCount,
    },
    register,
    getFieldState,
    getFieldError,
    isFieldValid,
    isFieldTouched,
    isFieldDirty,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setTouched,
    validateField,
    validateFields,
    validateForm,
    addCrossFieldValidation,
    handleSubmit,
    reset,
    getRequiredFields: getRequiredFieldsFromSchema,
    getFieldMetadata: getFieldMetadataFromSchema,
  };
}

// =============================================================================
// useFieldValidation Hook - For individual field validation
// =============================================================================

export interface UseFieldValidationOptions<T> {
  schema: z.ZodType<T>;
  initialValue?: T;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounce?: number;
}

export interface UseFieldValidationReturn<T> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  isValid: boolean;
  isValidating: boolean;
  setValue: (value: T) => void;
  setTouched: (touched?: boolean) => void;
  validate: () => Promise<boolean>;
  reset: () => void;
  inputProps: {
    value: T;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
}

export function useFieldValidation<T>(
  options: UseFieldValidationOptions<T>
): UseFieldValidationReturn<T> {
  const {
    schema,
    initialValue,
    validateOnChange = false,
    validateOnBlur = true,
    debounce = 0,
  } = options;
  
  const initialValueRef = useRef(initialValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const [value, setValueState] = useState<T>(() => initialValue as T);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const dirty = useMemo(() => value !== initialValueRef.current, [value]);
  const isValid = useMemo(() => schema.safeParse(value).success, [schema, value]);
  
  const validate = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const result = schema.safeParse(value);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return false;
      }
      setError(null);
      return true;
    } finally {
      setIsValidating(false);
    }
  }, [schema, value]);
  
  const debouncedValidate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (debounce > 0) {
      debounceRef.current = setTimeout(validate, debounce);
    } else {
      validate();
    }
  }, [validate, debounce]);
  
  const setValue = useCallback((newValue: T) => {
    setValueState(newValue);
    if (validateOnChange) {
      debouncedValidate();
    }
  }, [validateOnChange, debouncedValidate]);
  
  const handleSetTouched = useCallback((isTouched = true) => {
    setTouched(isTouched);
  }, []);
  
  const reset = useCallback(() => {
    setValueState(initialValueRef.current as T);
    setError(null);
    setTouched(false);
  }, []);
  
  const inputProps = useMemo(() => ({
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target;
      const newValue = target.type === 'checkbox'
        ? (target as HTMLInputElement).checked
        : target.value;
      setValue(newValue as T);
    },
    onBlur: () => {
      handleSetTouched(true);
      if (validateOnBlur) {
        validate();
      }
    },
  }), [value, setValue, handleSetTouched, validateOnBlur, validate]);
  
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return {
    value,
    error,
    touched,
    dirty,
    isValid,
    isValidating,
    setValue,
    setTouched: handleSetTouched,
    validate,
    reset,
    inputProps,
  };
}

// =============================================================================
// useFormSubmission Hook - For handling form submission with loading/error states
// =============================================================================

export interface UseFormSubmissionOptions<TData, TResult> {
  onSubmit: (data: TData) => Promise<TResult>;
  onSuccess?: (result: TResult, data: TData) => void;
  onError?: (error: Error, data: TData) => void;
  resetOnSuccess?: boolean;
  throwOnError?: boolean;
}

export interface UseFormSubmissionReturn<TData, TResult> {
  submit: (data: TData) => Promise<TResult | undefined>;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  result: TResult | null;
  reset: () => void;
}

export function useFormSubmission<TData, TResult = void>(
  options: UseFormSubmissionOptions<TData, TResult>
): UseFormSubmissionReturn<TData, TResult> {
  const {
    onSubmit,
    onSuccess,
    onError,
    resetOnSuccess = false,
    throwOnError = false,
  } = options;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TResult | null>(null);
  
  const submit = useCallback(async (data: TData): Promise<TResult | undefined> => {
    setIsSubmitting(true);
    setIsError(false);
    setError(null);
    
    try {
      const submitResult = await onSubmit(data);
      setResult(submitResult);
      setIsSuccess(true);
      onSuccess?.(submitResult, data);
      
      if (resetOnSuccess) {
        setTimeout(() => {
          setIsSuccess(false);
          setResult(null);
        }, 0);
      }
      
      return submitResult;
    } catch (err) {
      const submitError = err instanceof Error ? err : new Error(String(err));
      setError(submitError);
      setIsError(true);
      onError?.(submitError, data);
      
      if (throwOnError) {
        throw submitError;
      }
      
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onSuccess, onError, resetOnSuccess, throwOnError]);
  
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setResult(null);
  }, []);
  
  return {
    submit,
    isSubmitting,
    isSuccess,
    isError,
    error,
    result,
    reset,
  };
}

// =============================================================================
// useFormPersistence Hook - For persisting form state to storage
// =============================================================================

export interface UseFormPersistenceOptions<T> {
  key: string;
  storage?: Storage;
  debounce?: number;
  exclude?: (keyof T)[];
  serialize?: (data: T) => string;
  deserialize?: (data: string) => T;
}

export function useFormPersistence<T>(
  values: T,
  setValues: (values: Partial<T>) => void,
  options: UseFormPersistenceOptions<T>
): {
  clear: () => void;
  restore: () => void;
  isPersisted: boolean;
} {
  const {
    key,
    storage = typeof window !== 'undefined' ? window.localStorage : undefined,
    debounce = 500,
    exclude = [],
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;
  
  const [isPersisted, setIsPersisted] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Persist values with debounce
  useEffect(() => {
    if (!storage) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const toPersist = { ...values };
      for (const key of exclude) {
        delete toPersist[key];
      }
      
      try {
        storage.setItem(key, serialize(toPersist as T));
        setIsPersisted(true);
      } catch {
        console.warn('Failed to persist form data');
      }
    }, debounce);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [values, key, storage, debounce, exclude, serialize]);
  
  const clear = useCallback(() => {
    storage?.removeItem(key);
    setIsPersisted(false);
  }, [storage, key]);
  
  const restore = useCallback(() => {
    if (!storage) return;
    
    try {
      const stored = storage.getItem(key);
      if (stored) {
        const parsed = deserialize(stored);
        setValues(parsed);
        setIsPersisted(true);
      }
    } catch {
      console.warn('Failed to restore form data');
    }
  }, [storage, key, deserialize, setValues]);
  
  // Restore on mount
  useEffect(() => {
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
    clear,
    restore,
    isPersisted,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function removeKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  const result = { ...obj };
  delete result[key];
  return result;
}

function extractDefaultValues<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  defaults: Partial<z.infer<z.ZodObject<T>>>
): z.infer<z.ZodObject<T>> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(schema.shape)) {
    if (key in defaults && defaults[key as keyof typeof defaults] !== undefined) {
      result[key] = defaults[key as keyof typeof defaults];
      continue;
    }
    
    const def = value as z.ZodTypeAny;
    
    // Check for default value
    if (def._def.defaultValue !== undefined) {
      result[key] = typeof def._def.defaultValue === 'function' 
        ? def._def.defaultValue() 
        : def._def.defaultValue;
      continue;
    }
    
    // Unwrap optional/nullable to get base type
    let unwrapped = def;
    if (unwrapped instanceof z.ZodOptional || unwrapped instanceof z.ZodNullable) {
      unwrapped = unwrapped.unwrap();
    }
    if (unwrapped instanceof z.ZodDefault) {
      result[key] = unwrapped._def.defaultValue();
      continue;
    }
    
    // Set type-appropriate defaults
    if (unwrapped instanceof z.ZodString) {
      result[key] = '';
    } else if (unwrapped instanceof z.ZodNumber) {
      result[key] = 0;
    } else if (unwrapped instanceof z.ZodBoolean) {
      result[key] = false;
    } else if (unwrapped instanceof z.ZodArray) {
      result[key] = [];
    } else if (unwrapped instanceof z.ZodObject) {
      result[key] = {};
    } else if (def.isOptional() || def.isNullable()) {
      result[key] = undefined;
    } else {
      result[key] = undefined;
    }
  }
  
  return result as z.infer<z.ZodObject<T>>;
}

export default useFormValidation;
