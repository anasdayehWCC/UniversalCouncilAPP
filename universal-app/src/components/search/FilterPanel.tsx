'use client';

import * as React from 'react';
import { X, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveFilter, FilterDefinition, FilterOption } from '@/lib/search/types';

// ============================================================================
// Types
// ============================================================================

export interface FilterPanelProps<T = unknown> {
  /** Filter definitions */
  filters: FilterDefinition<T>[];
  /** Active filter values */
  activeFilters: Map<string, unknown>;
  /** Filter change handler */
  onFilterChange: (filterId: string, value: unknown) => void;
  /** Clear a specific filter */
  onClearFilter: (filterId: string) => void;
  /** Clear all filters */
  onClearAll: () => void;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Show active filter chips */
  showChips?: boolean;
  /** Collapsible panel */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Container className */
  className?: string;
}

// ============================================================================
// Filter Chip Component
// ============================================================================

export interface FilterChipProps {
  /** Filter label */
  label: string;
  /** Display value */
  value: string;
  /** Remove handler */
  onRemove: () => void;
  /** Container className */
  className?: string;
}

export function FilterChip({ label, value, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-sm bg-primary/10 text-primary',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'rounded-full p-0.5 hover:bg-primary/20',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'transition-colors'
        )}
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ============================================================================
// Filter Select Component
// ============================================================================

export interface FilterSelectProps {
  /** Filter definition */
  filter: FilterDefinition;
  /** Current value */
  value: unknown;
  /** Change handler */
  onChange: (value: unknown) => void;
  /** Container className */
  className?: string;
}

export function FilterSelect({ filter, value, onChange, className }: FilterSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = filter.options?.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label ?? filter.placeholder ?? `Select ${filter.label}`;

  const handleSelect = (optionValue: unknown) => {
    if (filter.multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues.length > 0 ? newValues : undefined);
    } else {
      onChange(optionValue === value ? undefined : optionValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue: unknown) => {
    if (filter.multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between gap-2 w-full',
          'px-3 py-2 rounded-md border border-input bg-background',
          'text-sm hover:bg-muted/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          value !== undefined && 'border-primary/50'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(!selectedOption && 'text-muted-foreground')}>
          {displayValue}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && filter.options && (
        <div
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg',
            'max-h-60 overflow-auto',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {filter.options.map((option) => (
            <div
              key={String(option.value)}
              role="option"
              aria-selected={isSelected(option.value)}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer',
                'hover:bg-muted transition-colors',
                isSelected(option.value) && 'bg-primary/10',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {filter.multiple && (
                <span
                  className={cn(
                    'h-4 w-4 rounded border flex items-center justify-center',
                    isSelected(option.value)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-input'
                  )}
                >
                  {isSelected(option.value) && <Check className="h-3 w-3" />}
                </span>
              )}
              <span className="flex-1">{option.label}</span>
              {option.count !== undefined && (
                <span className="text-xs text-muted-foreground">({option.count})</span>
              )}
              {!filter.multiple && isSelected(option.value) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Text Input Component
// ============================================================================

export interface FilterTextInputProps {
  /** Filter definition */
  filter: FilterDefinition;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string | undefined) => void;
  /** Container className */
  className?: string;
}

export function FilterTextInput({ filter, value, onChange, className }: FilterTextInputProps) {
  const [localValue, setLocalValue] = React.useState(value ?? '');

  React.useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleBlur = () => {
    onChange(localValue.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(localValue.trim() || undefined);
    }
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={filter.placeholder ?? `Filter by ${filter.label}`}
      className={cn(
        'w-full px-3 py-2 rounded-md border border-input bg-background',
        'text-sm placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        value && 'border-primary/50',
        className
      )}
    />
  );
}

// ============================================================================
// Active Filters Bar
// ============================================================================

export interface ActiveFiltersBarProps<T = unknown> {
  /** Filter definitions */
  filters: FilterDefinition<T>[];
  /** Active filter values */
  activeFilters: Map<string, unknown>;
  /** Clear a specific filter */
  onClearFilter: (filterId: string) => void;
  /** Clear all filters */
  onClearAll: () => void;
  /** Container className */
  className?: string;
}

export function ActiveFiltersBar<T>({
  filters,
  activeFilters,
  onClearFilter,
  onClearAll,
  className,
}: ActiveFiltersBarProps<T>) {
  const activeList: ActiveFilter[] = [];

  activeFilters.forEach((value, filterId) => {
    const filter = filters.find((f) => f.id === filterId);
    if (!filter || value === undefined) return;

    let displayValue: string;
    if (Array.isArray(value)) {
      const labels = value
        .map((v) => filter.options?.find((o) => o.value === v)?.label ?? String(v))
        .join(', ');
      displayValue = labels;
    } else {
      displayValue = filter.options?.find((o) => o.value === value)?.label ?? String(value);
    }

    activeList.push({
      id: filterId,
      label: filter.label,
      displayValue,
      value,
    });
  });

  if (activeList.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {activeList.map((active) => (
        <FilterChip
          key={active.id}
          label={active.label}
          value={active.displayValue}
          onRemove={() => onClearFilter(active.id)}
        />
      ))}
      {activeList.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'text-sm text-muted-foreground hover:text-foreground',
            'transition-colors underline-offset-4 hover:underline'
          )}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Filter Panel Component
// ============================================================================

export function FilterPanel<T>({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilter,
  onClearAll,
  direction = 'horizontal',
  showChips = true,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: FilterPanelProps<T>) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const activeCount = activeFilters.size;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Collapsible header */}
      {collapsible && (
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'flex items-center gap-2 text-sm font-medium',
            'hover:text-foreground transition-colors'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', isCollapsed && '-rotate-90')}
          />
        </button>
      )}

      {/* Filter controls */}
      {(!collapsible || !isCollapsed) && (
        <div
          className={cn(
            direction === 'horizontal'
              ? 'flex flex-wrap items-start gap-3'
              : 'flex flex-col gap-3'
          )}
        >
          {filters.map((filter) => {
            const value = activeFilters.get(filter.id);
            const key = filter.id;

            switch (filter.type) {
              case 'select':
              case 'multiselect':
                return (
                  <div
                    key={key}
                    className={cn(direction === 'horizontal' ? 'w-48' : 'w-full')}
                  >
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {filter.label}
                    </label>
                    <FilterSelect
                      filter={{ ...filter, multiple: filter.type === 'multiselect' } as FilterDefinition}
                      value={value}
                      onChange={(v) => onFilterChange(filter.id, v)}
                    />
                  </div>
                );

              case 'text':
                return (
                  <div
                    key={key}
                    className={cn(direction === 'horizontal' ? 'w-48' : 'w-full')}
                  >
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {filter.label}
                    </label>
                    <FilterTextInput
                      filter={filter as FilterDefinition}
                      value={value as string}
                      onChange={(v) => onFilterChange(filter.id, v)}
                    />
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      )}

      {/* Active filter chips */}
      {showChips && (!collapsible || !isCollapsed) && (
        <ActiveFiltersBar
          filters={filters}
          activeFilters={activeFilters}
          onClearFilter={onClearFilter}
          onClearAll={onClearAll}
        />
      )}
    </div>
  );
}

export default FilterPanel;
