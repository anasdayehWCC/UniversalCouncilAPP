'use client';

/**
 * ModuleGuard Component
 * 
 * Wraps module-specific content to control access based on module status.
 * Shows fallback UI when module is disabled or unauthorized.
 */

import React, { ReactNode } from 'react';
import { useModule, useRouteAccess, useModuleContext } from '@/lib/modules';
import { AlertTriangle, Lock, Loader2, Package } from 'lucide-react';

interface FallbackProps {
  moduleId: string;
  moduleName?: string;
  reason: 'disabled' | 'unauthorized' | 'not-found' | 'loading' | 'missing-dependencies';
  missingDependencies?: string[];
}

/**
 * Default fallback component when module is not available
 */
function DefaultFallback({ moduleId, moduleName, reason, missingDependencies }: FallbackProps) {
  const displayName = moduleName || moduleId;

  if (reason === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading module...</p>
      </div>
    );
  }

  const config = {
    disabled: {
      icon: Package,
      title: 'Module Not Available',
      description: `The ${displayName} module is not enabled for your organization.`,
      action: 'Contact your administrator to enable this feature.',
    },
    unauthorized: {
      icon: Lock,
      title: 'Access Restricted',
      description: `You don't have permission to access the ${displayName} module.`,
      action: 'Contact your manager to request access.',
    },
    'not-found': {
      icon: AlertTriangle,
      title: 'Module Not Found',
      description: `The ${displayName} module could not be found.`,
      action: 'This may be a configuration error. Please contact support.',
    },
    'missing-dependencies': {
      icon: AlertTriangle,
      title: 'Module Dependencies Missing',
      description: `The ${displayName} module requires other modules to be enabled first.`,
      action: missingDependencies?.length
        ? `Required modules: ${missingDependencies.join(', ')}`
        : 'Contact your administrator to resolve this.',
    },
  };

  const { icon: Icon, title, description, action } = config[reason];

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-6">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-4">{description}</p>
      <p className="text-sm text-muted-foreground/80">{action}</p>
    </div>
  );
}

interface ModuleGuardProps {
  /** Module ID to check */
  moduleId: string;
  /** Optional route ID for route-specific access checks */
  routeId?: string;
  /** Content to render when module is available */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Callback when access is denied */
  onAccessDenied?: (reason: FallbackProps['reason']) => void;
  /** Redirect path when unauthorized */
  redirectTo?: string;
  /** Whether to require auth even if route doesn't */
  requireAuth?: boolean;
}

/**
 * ModuleGuard - Guards content based on module availability
 * 
 * @example
 * // Basic usage
 * <ModuleGuard moduleId="insights">
 *   <InsightsDashboard />
 * </ModuleGuard>
 * 
 * @example
 * // With route check
 * <ModuleGuard moduleId="admin" routeId="admin-users">
 *   <UserManagement />
 * </ModuleGuard>
 * 
 * @example
 * // With custom fallback
 * <ModuleGuard 
 *   moduleId="recording"
 *   fallback={<CustomUpgradePrompt />}
 * >
 *   <RecordingInterface />
 * </ModuleGuard>
 */
export function ModuleGuard({
  moduleId,
  routeId,
  children,
  fallback,
  showLoading = true,
  onAccessDenied,
  redirectTo,
  requireAuth,
}: ModuleGuardProps) {
  const { module, isEnabled, isLoading } = useModule(moduleId);
  const { authContext, initialized } = useModuleContext();
  const { isAccessible } = useRouteAccess(moduleId, routeId || '');

  // Loading state
  if (isLoading || !initialized) {
    if (showLoading) {
      return renderFallback({ moduleId, reason: 'loading' });
    }
    return null;
  }

  // Module not found
  if (!module) {
    onAccessDenied?.('not-found');
    return renderFallback({ moduleId, reason: 'not-found' });
  }

  // Module disabled
  if (!isEnabled) {
    const enabledResult = module ? undefined : undefined;
    const missingDeps = module?.dependenciesSatisfied === false ? [] : undefined;
    
    if (missingDeps?.length) {
      onAccessDenied?.('missing-dependencies');
      return renderFallback({
        moduleId,
        moduleName: module.name,
        reason: 'missing-dependencies',
        missingDependencies: missingDeps,
      });
    }

    onAccessDenied?.('disabled');
    return renderFallback({ moduleId, moduleName: module.name, reason: 'disabled' });
  }

  // Route access check (if routeId provided)
  if (routeId && !isAccessible) {
    onAccessDenied?.('unauthorized');
    
    // Handle redirect
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    return renderFallback({ moduleId, moduleName: module.name, reason: 'unauthorized' });
  }

  // Auth check (if requireAuth specified)
  if (requireAuth && !authContext) {
    onAccessDenied?.('unauthorized');
    return renderFallback({ moduleId, moduleName: module.name, reason: 'unauthorized' });
  }

  // All checks passed - render children
  return <>{children}</>;

  function renderFallback(props: FallbackProps) {
    if (typeof fallback === 'function') {
      return <>{fallback(props)}</>;
    }
    if (fallback) {
      return <>{fallback}</>;
    }
    return <DefaultFallback {...props} />;
  }
}

/**
 * Higher-order component version of ModuleGuard
 */
export function withModuleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleId: string,
  routeId?: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithModuleGuardComponent(props: P) {
    return (
      <ModuleGuard moduleId={moduleId} routeId={routeId}>
        <WrappedComponent {...props} />
      </ModuleGuard>
    );
  }

  WithModuleGuardComponent.displayName = `withModuleGuard(${displayName})`;
  return WithModuleGuardComponent;
}

/**
 * Hook to check module access imperatively
 */
export function useModuleGuard(moduleId: string, routeId?: string) {
  const { module, isEnabled, isLoading } = useModule(moduleId);
  const { authContext, initialized } = useModuleContext();
  const { isAccessible } = useRouteAccess(moduleId, routeId || '');

  const isReady = !isLoading && initialized;
  const hasModule = !!module;
  const hasAccess = routeId ? isAccessible : isEnabled;

  return {
    isReady,
    hasModule,
    isEnabled,
    hasAccess,
    module,
    authContext,
    reason: !isReady
      ? 'loading'
      : !hasModule
      ? 'not-found'
      : !isEnabled
      ? 'disabled'
      : !hasAccess
      ? 'unauthorized'
      : null,
  };
}

export default ModuleGuard;
