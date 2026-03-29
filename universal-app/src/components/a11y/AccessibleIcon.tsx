'use client';

/**
 * Accessible Icon Component
 * 
 * Wraps icons with proper accessibility attributes.
 * Ensures icons are properly labeled for screen readers or
 * hidden when purely decorative.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from './VisuallyHidden';

export interface AccessibleIconProps {
  /** The icon element to render */
  children: React.ReactElement;
  /** Accessible label for the icon (required for meaningful icons) */
  label?: string;
  /** Whether the icon is purely decorative (no label needed) */
  decorative?: boolean;
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size mappings
 */
const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

/**
 * AccessibleIcon Component
 * 
 * Wraps an icon component to ensure proper accessibility.
 * - For meaningful icons: adds aria-label or visually hidden text
 * - For decorative icons: adds aria-hidden="true"
 * 
 * @example
 * ```tsx
 * // Meaningful icon (announces to screen readers)
 * <AccessibleIcon label="Close dialog">
 *   <XIcon />
 * </AccessibleIcon>
 * 
 * // Decorative icon (hidden from screen readers)
 * <AccessibleIcon decorative>
 *   <CheckIcon />
 * </AccessibleIcon>
 * <span>Success</span>
 * ```
 */
export function AccessibleIcon({
  children,
  label,
  decorative = false,
  size,
  className,
}: AccessibleIconProps) {
  // Clone the child element to add necessary props
  // Type assertion needed for React 19 strict typing
  const childProps = children.props as { className?: string };
  const iconElement = React.cloneElement(
    children as React.ReactElement<React.SVGProps<SVGSVGElement>>,
    {
      'aria-hidden': true,
      focusable: 'false',
      className: cn(
        size && SIZES[size],
        childProps.className,
        className
      ),
    }
  );
  
  if (decorative || !label) {
    // Decorative icon - hidden from screen readers
    return iconElement;
  }
  
  // Meaningful icon - include accessible label
  return (
    <span className="inline-flex items-center">
      {iconElement}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

/**
 * Icon Button Component
 * 
 * A button that contains only an icon with a required accessible name.
 * 
 * @example
 * ```tsx
 * <IconButton
 *   label="Delete item"
 *   onClick={handleDelete}
 *   icon={<TrashIcon />}
 * />
 * ```
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon element */
  icon: React.ReactElement;
  /** Required accessible label */
  label: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
}

const BUTTON_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const;

const BUTTON_VARIANTS = {
  default: 'bg-[var(--primary)] text-white hover:opacity-90',
  ghost: 'hover:bg-muted text-foreground',
  outline: 'border border-border hover:bg-muted text-foreground',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
} as const;

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    >
      <AccessibleIcon decorative size={size === 'sm' ? 'sm' : 'md'}>
        {icon}
      </AccessibleIcon>
    </button>
  );
}

/**
 * Icon Link Component
 * 
 * A link that contains only an icon with a required accessible name.
 * 
 * @example
 * ```tsx
 * <IconLink
 *   href="/settings"
 *   label="Settings"
 *   icon={<SettingsIcon />}
 * />
 * ```
 */
export interface IconLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The icon element */
  icon: React.ReactElement;
  /** Required accessible label */
  label: string;
  /** Link size */
  size?: 'sm' | 'md' | 'lg';
}

export function IconLink({
  icon,
  label,
  size = 'md',
  className,
  href,
  ...props
}: IconLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'text-muted-foreground hover:text-foreground',
        'transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      <AccessibleIcon decorative size={size === 'sm' ? 'sm' : 'md'}>
        {icon}
      </AccessibleIcon>
    </a>
  );
}

/**
 * Loading Icon Component
 * 
 * Accessible loading spinner with announcement.
 */
export function LoadingIcon({
  label = 'Loading',
  size = 'md',
  className,
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center', className)}
    >
      <svg
        aria-hidden="true"
        className={cn(
          'animate-spin motion-reduce:animate-none',
          SIZES[size],
          'text-[var(--primary)]'
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

/**
 * Status Icon Component
 * 
 * Icon that conveys status with proper accessibility.
 */
export function StatusIcon({
  status,
  size = 'md',
  className,
}: {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const statusConfig = {
    success: {
      label: 'Success',
      color: 'text-success',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      label: 'Error',
      color: 'text-destructive',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      label: 'Warning',
      color: 'text-amber-600',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      label: 'Information',
      color: 'text-info',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    loading: {
      label: 'Loading',
      color: 'text-muted-foreground',
      icon: null,
    },
  };
  
  const config = statusConfig[status];
  
  if (status === 'loading') {
    return <LoadingIcon label={config.label} size={size} className={className} />;
  }
  
  return (
    <AccessibleIcon label={config.label} size={size}>
      <span className={cn(config.color, className)}>{config.icon}</span>
    </AccessibleIcon>
  );
}

export default AccessibleIcon;
