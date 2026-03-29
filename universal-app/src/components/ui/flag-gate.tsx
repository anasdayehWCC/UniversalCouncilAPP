import React from 'react';
import { Card } from './card';
import { FeatureFlags } from '@/types/flags';

interface FlagGateProps {
  flag: keyof FeatureFlags;
  featureFlags: FeatureFlags;
  children: React.ReactNode | ((enabled: boolean) => React.ReactNode);
  title?: string;
  message?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'info' | 'warning';
  className?: string;
}

const toneVariants: Record<NonNullable<FlagGateProps['tone']>, string> = {
  info: 'border-info/20 bg-info/10',
  warning: 'border-warning/30 bg-warning/10',
};

export function FlagGate({
  flag,
  featureFlags,
  children,
  title,
  message,
  actions,
  icon,
  tone = 'info',
  className,
}: FlagGateProps) {
  const enabled = featureFlags[flag];
  if (enabled) {
    if (typeof children === 'function') {
      return <>{children(true)}</>;
    }
    return <>{children}</>;
  }

  return (
    <Card className={`p-6 border ${toneVariants[tone]} ${className ?? ''}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div>
          {title && <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {actions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
