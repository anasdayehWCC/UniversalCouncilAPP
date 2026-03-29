import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show error styling */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const errorId = errorMessage ? `${props.id || props.name}-error` : undefined;
    
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            // Error state styling
            error && "border-destructive focus-visible:ring-destructive/50 text-destructive placeholder:text-destructive/70",
            className
          )}
          ref={ref}
          aria-invalid={ariaInvalid ?? error}
          aria-describedby={[ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {errorMessage && (
          <p 
            id={errorId}
            className="mt-1.5 text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <svg 
              className="h-3.5 w-3.5 shrink-0" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 4v5M8 11v1" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
