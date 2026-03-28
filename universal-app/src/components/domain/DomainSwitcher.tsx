'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ChevronDown, Check, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDomain } from '@/hooks/useDomain';
import type { ServiceDomain, DomainConfig, DomainStatus } from '@/lib/domain/types';
import { getDomainStatusLabel, getDomainStatusColor } from '@/lib/domain/config';

// ============================================================================
// Types
// ============================================================================

interface DomainSwitcherProps {
  /** Additional CSS classes */
  className?: string;
  /** Compact mode (icon only) */
  compact?: boolean;
  /** Show domain status badges */
  showStatus?: boolean;
  /** Callback when domain changes */
  onDomainChange?: (domain: ServiceDomain) => void;
  /** Disable switching */
  disabled?: boolean;
  /** Custom trigger content */
  trigger?: React.ReactNode;
  /** Dropdown alignment */
  align?: 'start' | 'center' | 'end';
}

// ============================================================================
// Helper: Get Lucide Icon
// ============================================================================

function getIcon(iconName: string): React.FC<{ className?: string }> {
  const IconComponent = (Icons as unknown as Record<string, React.FC<{ className?: string }>>)[iconName];
  return IconComponent || Icons.Circle;
}

// ============================================================================
// Component: Domain Option
// ============================================================================

interface DomainOptionProps {
  config: DomainConfig;
  isSelected: boolean;
  canAccess: boolean;
  onSelect: () => void;
  showStatus?: boolean;
}

function DomainOption({
  config,
  isSelected,
  canAccess,
  onSelect,
  showStatus,
}: DomainOptionProps) {
  const Icon = getIcon(config.icon);
  const isDisabled = !canAccess || config.status === 'coming_soon' || config.status === 'disabled';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'text-left group',
        isSelected
          ? 'bg-primary/10 text-primary'
          : isDisabled
          ? 'opacity-50 cursor-not-allowed text-muted-foreground'
          : 'hover:bg-muted/50 text-foreground'
      )}
    >
      {/* Icon with domain color */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
        style={{
          backgroundColor: isSelected ? config.branding.primary : undefined,
        }}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{config.name}</span>
          {showStatus && config.status !== 'active' && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full uppercase',
                getDomainStatusColor(config.status)
              )}
            >
              {getDomainStatusLabel(config.status)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{config.authorityLabel}</p>
      </div>

      {/* Status indicator */}
      <div className="flex-shrink-0">
        {isSelected ? (
          <Check className="w-4 h-4 text-primary" />
        ) : isDisabled ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : null}
      </div>
    </button>
  );
}

// ============================================================================
// Main Component: DomainSwitcher
// ============================================================================

export function DomainSwitcher({
  className,
  compact = false,
  showStatus = true,
  onDomainChange,
  disabled = false,
  trigger,
  align = 'start',
}: DomainSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { domain, config, availableDomains, switchTo, canAccess, isSwitching } = useDomain();

  const Icon = getIcon(config.icon);

  const handleSelect = useCallback(
    async (domainId: ServiceDomain) => {
      if (domainId === domain) {
        setIsOpen(false);
        return;
      }

      setIsOpen(false);
      await switchTo(domainId);
      onDomainChange?.(domainId);
    },
    [domain, switchTo, onDomainChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    []
  );

  // Close on click outside
  const handleClickOutside = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={cn('relative', className)} onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      {trigger ? (
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || isSwitching}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
            'border border-transparent',
            'hover:bg-muted/50 hover:border-border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            isOpen && 'bg-muted/50 border-border',
            (disabled || isSwitching) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Current domain icon */}
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white"
            style={{ backgroundColor: config.branding.primary }}
          >
            <Icon className="w-4 h-4" />
          </div>

          {!compact && (
            <>
              <div className="text-left">
                <div className="font-medium text-sm leading-tight">{config.shortName}</div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
                  {config.personaLabel}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </>
          )}
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={handleClickOutside}
              aria-hidden="true"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute z-50 mt-2 w-72 max-h-[400px] overflow-auto',
                'bg-popover border border-border rounded-xl shadow-xl',
                'p-2',
                align === 'start' && 'left-0',
                align === 'center' && 'left-1/2 -translate-x-1/2',
                align === 'end' && 'right-0'
              )}
              role="listbox"
              aria-label="Select service domain"
            >
              {/* Header */}
              <div className="px-2 py-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Switch Service Area
                </h3>
              </div>

              {/* Domain options */}
              <div className="space-y-1">
                {availableDomains.map((domainConfig) => (
                  <DomainOption
                    key={domainConfig.id}
                    config={domainConfig}
                    isSelected={domainConfig.id === domain}
                    canAccess={canAccess(domainConfig.id)}
                    onSelect={() => handleSelect(domainConfig.id)}
                    showStatus={showStatus}
                  />
                ))}
              </div>

              {/* Quick actions */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="px-2 py-1">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      Access {availableDomains.length} service{' '}
                      {availableDomains.length === 1 ? 'area' : 'areas'}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default DomainSwitcher;
