'use client';

import React, { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDomain } from '@/hooks/useDomain';
import type { ServiceDomain } from '@/lib/domain/types';
import { getDomainConfig, buildDomainPath } from '@/lib/domain/config';

// ============================================================================
// Types
// ============================================================================

interface DomainGuardProps {
  /** Domain(s) required to view this content */
  allowed: ServiceDomain | ServiceDomain[];
  /** Content to render if access granted */
  children: ReactNode;
  /** Fallback content if access denied */
  fallback?: ReactNode;
  /** Redirect to another path if denied */
  redirectTo?: string;
  /** Action when access denied */
  onDenied?: (currentDomain: ServiceDomain, requiredDomains: ServiceDomain[]) => void;
  /** Show a placeholder message instead of hiding */
  showMessage?: boolean;
  /** Custom denied message */
  deniedMessage?: string;
  /** Behavior when denied */
  behavior?: 'hide' | 'fallback' | 'redirect' | 'message';
}

// ============================================================================
// Default Fallback Component
// ============================================================================

interface AccessDeniedProps {
  currentDomain: ServiceDomain;
  requiredDomains: ServiceDomain[];
  message?: string;
  onSwitchDomain?: (domain: ServiceDomain) => void;
}

function AccessDenied({
  currentDomain,
  requiredDomains,
  message,
  onSwitchDomain,
}: AccessDeniedProps) {
  const currentConfig = getDomainConfig(currentDomain);
  const requiredNames = requiredDomains.map((d) => getDomainConfig(d).name);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        Domain Access Required
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {message ||
          `This content is only available in ${
            requiredNames.length === 1
              ? requiredNames[0]
              : `${requiredNames.slice(0, -1).join(', ')} or ${requiredNames.slice(-1)}`
          }.`}
      </p>

      <p className="text-xs text-muted-foreground mb-6">
        You're currently viewing: <strong>{currentConfig.name}</strong>
      </p>

      {/* Quick switch buttons */}
      {requiredDomains.length > 0 && onSwitchDomain && (
        <div className="flex flex-wrap gap-2 justify-center">
          {requiredDomains.map((domain) => {
            const config = getDomainConfig(domain);
            return (
              <button
                key={domain}
                onClick={() => onSwitchDomain(domain)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'text-sm font-medium transition-colors',
                  'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                style={{ backgroundColor: config.branding.primary }}
              >
                Switch to {config.shortName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component: DomainGuard
// ============================================================================

export function DomainGuard({
  allowed,
  children,
  fallback,
  redirectTo,
  onDenied,
  showMessage = false,
  deniedMessage,
  behavior = 'hide',
}: DomainGuardProps) {
  const router = useRouter();
  const { domain: currentDomain, canAccess, switchTo } = useDomain();

  // Normalize allowed domains to array
  const allowedDomains = useMemo(
    () => (Array.isArray(allowed) ? allowed : [allowed]),
    [allowed]
  );

  // Check if current domain is allowed
  const isAllowed = useMemo(
    () => allowedDomains.includes(currentDomain),
    [allowedDomains, currentDomain]
  );

  // Handle denial
  React.useEffect(() => {
    if (!isAllowed) {
      onDenied?.(currentDomain, allowedDomains);

      if (behavior === 'redirect' && redirectTo) {
        // Build redirect path for first allowed domain
        const targetDomain = allowedDomains.find((d) => canAccess(d)) || allowedDomains[0];
        const fullPath = buildDomainPath(targetDomain, redirectTo);
        router.replace(fullPath);
      }
    }
  }, [isAllowed, behavior, redirectTo, allowedDomains, currentDomain, canAccess, router, onDenied]);

  // If allowed, render children
  if (isAllowed) {
    return <>{children}</>;
  }

  // Handle different behaviors
  switch (behavior) {
    case 'hide':
      return null;

    case 'fallback':
      return <>{fallback}</> || null;

    case 'redirect':
      // Render nothing while redirecting
      return null;

    case 'message':
    default:
      if (fallback) {
        return <>{fallback}</>;
      }

      if (showMessage || behavior === 'message') {
        return (
          <AccessDenied
            currentDomain={currentDomain}
            requiredDomains={allowedDomains}
            message={deniedMessage}
            onSwitchDomain={(domain) => switchTo(domain)}
          />
        );
      }

      return null;
  }
}

// ============================================================================
// Specialized Guard Components
// ============================================================================

interface SingleDomainGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guard for children's services content only
 */
export function ChildrenDomainGuard({ children, fallback }: SingleDomainGuardProps) {
  return (
    <DomainGuard allowed="children" behavior="message" fallback={fallback}>
      {children}
    </DomainGuard>
  );
}

/**
 * Guard for adult services content only
 */
export function AdultsDomainGuard({ children, fallback }: SingleDomainGuardProps) {
  return (
    <DomainGuard allowed="adults" behavior="message" fallback={fallback}>
      {children}
    </DomainGuard>
  );
}

/**
 * Guard for housing content only
 */
export function HousingDomainGuard({ children, fallback }: SingleDomainGuardProps) {
  return (
    <DomainGuard allowed="housing" behavior="message" fallback={fallback}>
      {children}
    </DomainGuard>
  );
}

/**
 * Guard for social care domains (children + adults)
 */
export function SocialCareDomainGuard({ children, fallback }: SingleDomainGuardProps) {
  return (
    <DomainGuard allowed={['children', 'adults']} behavior="message" fallback={fallback}>
      {children}
    </DomainGuard>
  );
}

// ============================================================================
// Inline Guard Component
// ============================================================================

interface InlineDomainGuardProps {
  /** Domain(s) required */
  allowed: ServiceDomain | ServiceDomain[];
  /** Content when access granted */
  children: ReactNode;
  /** Alternative content when denied */
  otherwise?: ReactNode;
}

/**
 * Inline guard for conditionally rendering content
 * Does not show messages, just hides or swaps content
 */
export function InlineDomainGuard({
  allowed,
  children,
  otherwise = null,
}: InlineDomainGuardProps) {
  return (
    <DomainGuard allowed={allowed} behavior="fallback" fallback={otherwise}>
      {children}
    </DomainGuard>
  );
}

// ============================================================================
// HOC for domain-specific pages
// ============================================================================

interface WithDomainGuardOptions {
  allowed: ServiceDomain | ServiceDomain[];
  redirectTo?: string;
}

/**
 * Higher-order component to wrap pages with domain guard
 */
export function withDomainGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: WithDomainGuardOptions
) {
  return function WrappedComponent(props: P) {
    return (
      <DomainGuard
        allowed={options.allowed}
        behavior={options.redirectTo ? 'redirect' : 'message'}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </DomainGuard>
    );
  };
}

// ============================================================================
// Export
// ============================================================================

export default DomainGuard;
