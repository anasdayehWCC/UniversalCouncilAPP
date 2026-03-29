'use client';

import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSubmit' | 'size'> {
  /** Current search value */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Submit handler (on Enter) */
  onSubmit?: (value: string) => void;
  /** Debounce delay in ms (0 to disable) */
  debounceMs?: number;
  /** Show loading indicator */
  isLoading?: boolean;
  /** Show clear button */
  showClear?: boolean;
  /** Icon to show (defaults to Search) */
  icon?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'filled' | 'ghost';
}

// ============================================================================
// Component
// ============================================================================

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      debounceMs = 300,
      isLoading = false,
      showClear = true,
      icon,
      size = 'md',
      variant = 'default',
      className,
      placeholder = 'Search...',
      disabled,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(value);
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    // Sync external value changes
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Cleanup debounce on unmount
    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        if (debounceMs > 0) {
          debounceRef.current = setTimeout(() => {
            onChange(newValue);
          }, debounceMs);
        } else {
          onChange(newValue);
        }
      },
      [onChange, debounceMs]
    );

    const handleClear = React.useCallback(() => {
      setLocalValue('');
      onChange('');
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }, [onChange]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSubmit) {
          e.preventDefault();
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          onChange(localValue);
          onSubmit(localValue);
        }
        if (e.key === 'Escape' && localValue) {
          e.preventDefault();
          handleClear();
        }
      },
      [localValue, onChange, onSubmit, handleClear]
    );

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-sm px-2.5 gap-1.5',
      md: 'h-10 text-base px-3 gap-2',
      lg: 'h-12 text-lg px-4 gap-2.5',
    };

    const iconSizeClasses = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    // Variant classes
    const variantClasses = {
      default:
        'border border-input bg-background hover:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      filled:
        'border-0 bg-muted hover:bg-muted/80 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      ghost:
        'border-0 bg-transparent hover:bg-muted/50 focus-within:bg-muted/50',
    };

    return (
      <div
        className={cn(
          'flex items-center rounded-md transition-colors',
          sizeClasses[size],
          variantClasses[variant],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {/* Search Icon */}
        <span className="text-muted-foreground shrink-0">
          {icon ?? (
            <Search className={cn(iconSizeClasses[size])} aria-hidden="true" />
          )}
        </span>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed'
          )}
          aria-label="Search"
          {...props}
        />

        {/* Loading / Clear */}
        <div className="flex items-center gap-1 shrink-0">
          {isLoading && (
            <Loader2
              className={cn(iconSizeClasses[size], 'animate-spin motion-reduce:animate-none text-muted-foreground')}
              aria-hidden="true"
            />
          )}
          {showClear && localValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'rounded-sm p-0.5 text-muted-foreground hover:text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                'transition-colors'
              )}
              aria-label="Clear search"
            >
              <X className={iconSizeClasses[size]} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================================================
// Controlled Search Input Hook
// ============================================================================

export interface UseSearchInputOptions {
  /** Initial search value */
  initialValue?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Callback when debounced value changes */
  onSearch?: (value: string) => void;
}

export function useSearchInput(options: UseSearchInputOptions = {}) {
  const { initialValue = '', debounceMs = 300, onSearch } = options;
  
  const [value, setValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      onSearch?.(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const clear = React.useCallback(() => {
    setValue('');
    setDebouncedValue('');
  }, []);

  return {
    value,
    debouncedValue,
    setValue,
    clear,
    inputProps: {
      value,
      onChange: setValue,
      debounceMs: 0, // We handle debounce ourselves
    },
  };
}

export default SearchInput;
