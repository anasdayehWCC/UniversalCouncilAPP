'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDomain } from '@/hooks/useDomain';
import type { ServiceDomain } from '@/lib/domain/types';

// ============================================================================
// Types
// ============================================================================

interface DomainIndicatorProps {
  /** Override domain to display (default: current domain) */
  domain?: ServiceDomain;
  /** Display variant */
  variant?: 'badge' | 'pill' | 'icon' | 'text' | 'full';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show domain icon */
  showIcon?: boolean;
  /** Show authority label */
  showAuthority?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Use domain color for styling */
  colored?: boolean;
}

// ============================================================================
// Helper: Get Lucide Icon
// ============================================================================

function getIcon(iconName: string): React.FC<{ className?: string }> {
  const IconComponent = (Icons as unknown as Record<string, React.FC<{ className?: string }>>)[iconName];
  return IconComponent || Icons.Circle;
}

// ============================================================================
// Size configurations
// ============================================================================

const sizeClasses = {
  xs: {
    container: 'gap-1 text-[10px]',
    icon: 'w-3 h-3',
    iconContainer: 'w-4 h-4',
    padding: 'px-1.5 py-0.5',
  },
  sm: {
    container: 'gap-1.5 text-xs',
    icon: 'w-3.5 h-3.5',
    iconContainer: 'w-5 h-5',
    padding: 'px-2 py-1',
  },
  md: {
    container: 'gap-2 text-sm',
    icon: 'w-4 h-4',
    iconContainer: 'w-6 h-6',
    padding: 'px-2.5 py-1.5',
  },
  lg: {
    container: 'gap-2.5 text-base',
    icon: 'w-5 h-5',
    iconContainer: 'w-8 h-8',
    padding: 'px-3 py-2',
  },
};

// ============================================================================
// Main Component: DomainIndicator
// ============================================================================

export function DomainIndicator({
  domain: overrideDomain,
  variant = 'badge',
  size = 'sm',
  showIcon = true,
  showAuthority = false,
  className,
  colored = true,
}: DomainIndicatorProps) {
  const { domain: currentDomain, config: currentConfig } = useDomain();

  // Use override domain config if provided
  const domain = overrideDomain ?? currentDomain;
  const config = currentConfig; // In real impl, fetch config for overrideDomain

  const Icon = getIcon(config.icon);
  const sizes = sizeClasses[size];

  // Base styles for different variants
  const variantStyles = {
    badge: cn(
      'inline-flex items-center rounded-md font-medium',
      sizes.container,
      sizes.padding,
      colored
        ? 'text-white'
        : 'bg-muted text-foreground'
    ),
    pill: cn(
      'inline-flex items-center rounded-full font-medium',
      sizes.container,
      sizes.padding,
      colored
        ? 'text-white'
        : 'bg-muted text-foreground'
    ),
    icon: cn(
      'inline-flex items-center justify-center rounded-md',
      sizes.iconContainer,
      colored ? 'text-white' : 'bg-muted text-foreground'
    ),
    text: cn(
      'inline-flex items-center font-medium',
      sizes.container,
      colored ? '' : 'text-foreground'
    ),
    full: cn(
      'inline-flex items-center rounded-lg border',
      sizes.container,
      sizes.padding,
      colored
        ? 'border-transparent text-white'
        : 'border-border bg-background text-foreground'
    ),
  };

  // Style with domain color
  const colorStyle = colored
    ? { backgroundColor: config.branding.primary }
    : undefined;

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <span
        className={cn(variantStyles.icon, className)}
        style={colorStyle}
        title={config.name}
        aria-label={`Current domain: ${config.name}`}
      >
        <Icon className={sizes.icon} />
      </span>
    );
  }

  // Text-only variant
  if (variant === 'text') {
    return (
      <span
        className={cn(variantStyles.text, className)}
        style={colored ? { color: config.branding.primary } : undefined}
        aria-label={`Current domain: ${config.name}`}
      >
        {showIcon && <Icon className={sizes.icon} />}
        <span>{config.shortName}</span>
        {showAuthority && (
          <span className="text-muted-foreground font-normal">
            • {config.authorityLabel}
          </span>
        )}
      </span>
    );
  }

  // Badge, pill, and full variants
  return (
    <span
      className={cn(variantStyles[variant], className)}
      style={colorStyle}
      aria-label={`Current domain: ${config.name}`}
    >
      {showIcon && <Icon className={sizes.icon} />}
      <span className="truncate">
        {variant === 'full' ? config.name : config.shortName}
      </span>
      {showAuthority && variant === 'full' && (
        <span className="text-white/70 font-normal ml-1">
          {config.authorityLabel}
        </span>
      )}
    </span>
  );
}

// ============================================================================
// Variant Components for convenience
// ============================================================================

/**
 * Domain badge with icon and short name
 */
export function DomainBadge(props: Omit<DomainIndicatorProps, 'variant'>) {
  return <DomainIndicator {...props} variant="badge" />;
}

/**
 * Domain pill (rounded) with icon and short name
 */
export function DomainPill(props: Omit<DomainIndicatorProps, 'variant'>) {
  return <DomainIndicator {...props} variant="pill" />;
}

/**
 * Domain icon only
 */
export function DomainIcon(props: Omit<DomainIndicatorProps, 'variant' | 'showIcon'>) {
  return <DomainIndicator {...props} variant="icon" showIcon />;
}

/**
 * Domain text with optional icon
 */
export function DomainText(props: Omit<DomainIndicatorProps, 'variant'>) {
  return <DomainIndicator {...props} variant="text" />;
}

/**
 * Full domain indicator with name and authority
 */
export function DomainFull(props: Omit<DomainIndicatorProps, 'variant'>) {
  return <DomainIndicator {...props} variant="full" showAuthority />;
}

// ============================================================================
// Export
// ============================================================================

export default DomainIndicator;
