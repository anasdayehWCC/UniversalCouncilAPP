'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { QuickAction } from '@/lib/navigation';

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

/**
 * QuickActions Component
 * 
 * Role-specific action buttons with:
 * - Primary CTA highlighting
 * - Keyboard shortcut display
 * - Multiple layout variants
 * - Premium glass styling
 */
export function QuickActions({
  actions,
  className,
  variant = 'horizontal',
  showLabels = true,
}: QuickActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  const primaryAction = actions.find((action) => action.isPrimary);
  const secondaryActions = actions.filter((action) => !action.isPrimary);

  const getButtonStyles = (action: QuickAction) => {
    const base = cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
      showLabels ? 'px-4 py-2.5' : 'p-2.5',
    );

    switch (action.variant) {
      case 'primary':
        return cn(
          base,
          'bg-card text-foreground shadow-lg shadow-white/20',
          'hover:bg-card/90 hover:shadow-xl hover:shadow-white/30',
          'focus:ring-white/50',
        );
      case 'secondary':
        return cn(
          base,
          'bg-white/10 text-white border border-white/20',
          'hover:bg-white/20 hover:border-white/30',
          'focus:ring-white/30',
        );
      case 'glass':
        return cn(
          base,
          'bg-white/5 backdrop-blur-sm text-white border border-white/10',
          'hover:bg-white/15 hover:border-white/25',
          'focus:ring-white/20',
        );
      case 'ghost':
      default:
        return cn(
          base,
          'text-white/80',
          'hover:bg-white/10 hover:text-white',
          'focus:ring-white/20',
        );
    }
  };

  const renderAction = (action: QuickAction) => {
    const Icon = action.icon;
    const buttonContent = (
      <>
        <Icon className={cn('shrink-0', showLabels ? 'h-4 w-4' : 'h-5 w-5')} />
        {showLabels && <span>{action.label}</span>}
        {action.shortcut && showLabels && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded">
            {action.shortcut}
          </kbd>
        )}
      </>
    );

    if (action.href) {
      return (
        <Link
          key={action.id}
          href={action.href}
          className={getButtonStyles(action)}
          title={!showLabels ? action.label : undefined}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <button
        key={action.id}
        onClick={action.action}
        className={getButtonStyles(action)}
        title={!showLabels ? action.label : undefined}
      >
        {buttonContent}
      </button>
    );
  };

  return (
    <div
      className={cn(
        'flex gap-2',
        variant === 'vertical' && 'flex-col',
        className,
      )}
    >
      {/* Primary action first */}
      {primaryAction && renderAction(primaryAction)}
      
      {/* Secondary actions */}
      {secondaryActions.map(renderAction)}
    </div>
  );
}

/**
 * QuickActionButton - Single action button component
 */
export function QuickActionButton({
  action,
  showLabel = true,
  size = 'default',
}: {
  action: QuickAction;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  const Icon = action.icon;
  
  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    default: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  const variantStyles = {
    primary: 'bg-card text-foreground hover:bg-card/90 shadow-lg',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    glass: 'bg-white/5 backdrop-blur text-white hover:bg-white/15 border border-white/10',
    ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
  };

  const content = (
    <>
      <Icon className={cn(size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
      {showLabel && <span className="ml-2">{action.label}</span>}
    </>
  );

  const className = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-all',
    'focus:outline-none focus:ring-2 focus:ring-white/30',
    sizeStyles[size],
    variantStyles[action.variant || 'ghost'],
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={action.action} className={className}>
      {content}
    </button>
  );
}

export default QuickActions;
