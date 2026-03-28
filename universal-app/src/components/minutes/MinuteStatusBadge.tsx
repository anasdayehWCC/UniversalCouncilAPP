'use client';

import React from 'react';
import { MinuteStatus, MINUTE_STATUS_CONFIG } from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { 
  Edit3, 
  Clock, 
  CheckCircle, 
  Globe 
} from 'lucide-react';

interface MinuteStatusBadgeProps {
  status: MinuteStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  Edit3,
  Clock,
  CheckCircle,
  Globe
};

export function MinuteStatusBadge({ 
  status, 
  size = 'md',
  showIcon = true,
  className 
}: MinuteStatusBadgeProps) {
  const config = MINUTE_STATUS_CONFIG[status];
  const Icon = ICONS[config.icon];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border transition-colors',
        config.bgColor,
        config.color,
        config.borderColor,
        sizeClasses[size],
        // Glassmorphism enhancement for pending_review
        status === 'pending_review' && 'animate-pulse',
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn(iconSizes[size], 'flex-shrink-0')} />
      )}
      {config.label}
    </span>
  );
}

// Compact variant for tables/lists
export function MinuteStatusDot({ 
  status, 
  className 
}: { 
  status: MinuteStatus; 
  className?: string 
}) {
  const config = MINUTE_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
    >
      <span 
        className={cn(
          'w-2 h-2 rounded-full',
          config.bgColor,
          status === 'pending_review' && 'animate-pulse'
        )} 
      />
      <span className={cn('text-sm', config.color)}>
        {config.label}
      </span>
    </span>
  );
}
