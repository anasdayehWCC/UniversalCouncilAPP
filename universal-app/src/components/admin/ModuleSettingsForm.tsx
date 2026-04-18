'use client';

import React, { useState, useCallback, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleSettingsFormProps {
  moduleId: string;
  moduleName: string;
  settings: Record<string, unknown>;
  onSave: (moduleId: string, settings: Record<string, unknown>) => void;
  disabled?: boolean;
}

/** Known setting keys and their allowed select options */
const SETTING_OPTIONS: Record<string, string[]> = {
  quality: ['low', 'medium', 'high', 'ultra'],
  language: ['en-GB', 'en-US', 'cy', 'gd', 'fr', 'de', 'es'],
};

/** Human-readable labels for setting keys */
const SETTING_LABELS: Record<string, string> = {
  quality: 'Quality',
  language: 'Language',
  channels: 'Notification Channels',
};

/**
 * Infer the field type from a setting value.
 * Returns 'select' when a known option set exists for the key.
 */
function inferFieldType(
  key: string,
  value: unknown
): 'text' | 'number' | 'boolean' | 'select' | 'multi-text' {
  if (key in SETTING_OPTIONS) return 'select';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value) && value.every((v) => typeof v === 'string'))
    return 'multi-text';
  return 'text';
}

function formatLabel(key: string): string {
  return (
    SETTING_LABELS[key] ??
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function ModuleSettingsForm({
  moduleId,
  moduleName,
  settings,
  onSave,
  disabled = false,
}: ModuleSettingsFormProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...settings });
  const [isDirty, setIsDirty] = useState(false);
  const formId = useId();

  const updateField = useCallback(
    (key: string, value: unknown) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleReset = useCallback(() => {
    setDraft({ ...settings });
    setIsDirty(false);
  }, [settings]);

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(moduleId, draft);
      setIsDirty(false);
    },
    [moduleId, draft, onSave]
  );

  const entries = Object.entries(settings);
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No configurable settings for this module.
      </p>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4" aria-label={`Settings for ${moduleName}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map(([key, originalValue]) => {
          const fieldType = inferFieldType(key, originalValue);
          const fieldId = `${formId}-${key}`;
          const label = formatLabel(key);
          const currentValue = draft[key];

          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={fieldId} className="text-foreground">
                {label}
              </Label>

              {fieldType === 'select' && (
                <Select
                  value={String(currentValue ?? '')}
                  onValueChange={(v) => updateField(key, v)}
                  disabled={disabled}
                >
                  <SelectTrigger id={fieldId}>
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(SETTING_OPTIONS[key] ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {fieldType === 'text' && (
                <Input
                  id={fieldId}
                  type="text"
                  value={String(currentValue ?? '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  disabled={disabled}
                />
              )}

              {fieldType === 'number' && (
                <Input
                  id={fieldId}
                  type="number"
                  value={currentValue != null ? String(currentValue) : ''}
                  onChange={(e) =>
                    updateField(
                      key,
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={disabled}
                />
              )}

              {fieldType === 'boolean' && (
                <button
                  id={fieldId}
                  type="button"
                  role="switch"
                  aria-checked={Boolean(currentValue)}
                  aria-label={`${label}: ${currentValue ? 'enabled' : 'disabled'}`}
                  disabled={disabled}
                  onClick={() => updateField(key, !currentValue)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    currentValue
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
                      currentValue ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              )}

              {fieldType === 'multi-text' && (
                <MultiTextInput
                  id={fieldId}
                  values={Array.isArray(currentValue) ? (currentValue as string[]) : []}
                  onChange={(vals) => updateField(key, vals)}
                  disabled={disabled}
                  label={label}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={disabled || !isDirty}
          className="gap-1.5"
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !isDirty}
          onClick={handleReset}
          className="gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </Button>
        {isDirty && (
          <span className="text-xs text-muted-foreground ml-2">
            Unsaved changes
          </span>
        )}
      </div>
    </form>
  );
}

/** Editable comma-separated tag list for array-of-string settings */
function MultiTextInput({
  id,
  values,
  onChange,
  disabled,
  label,
}: {
  id: string;
  values: string[];
  onChange: (vals: string[]) => void;
  disabled?: boolean;
  label: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const addValue = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  }, [inputValue, values, onChange]);

  const removeValue = useCallback(
    (val: string) => {
      onChange(values.filter((v) => v !== val));
    },
    [values, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addValue();
      }
    },
    [addValue]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
          >
            {val}
            <button
              type="button"
              onClick={() => removeValue(val)}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              aria-label={`Remove ${val} from ${label}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Add to ${label.toLowerCase()}...`}
          disabled={disabled}
          className="h-8 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !inputValue.trim()}
          onClick={addValue}
          className="h-8 px-2 text-xs"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
