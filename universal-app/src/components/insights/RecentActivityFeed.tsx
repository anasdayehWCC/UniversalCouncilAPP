'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/dates';
import {
  Mic,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityItem } from '@/lib/insights/types';

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  onItemClick?: (activity: ActivityItem) => void;
  className?: string;
}

const ACTIVITY_CONFIG: Record<ActivityItem['type'], { 
  icon: LucideIcon; 
  color: string; 
  bgColor: string; 
  label: string;
}> = {
  recording: {
    icon: Mic,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    label: 'New Recording',
  },
  approval: {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    label: 'Approved',
  },
  completion: {
    icon: Clock,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900',
    label: 'Ready for Review',
  },
  flagged: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900',
    label: 'Flagged',
  },
  returned: {
    icon: RotateCcw,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    label: 'Returned',
  },
};

function ActivityRow({ activity, onClick }: { activity: ActivityItem; onClick?: () => void }) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;
  const formattedTime = formatDateTime(activity.timestamp);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-lg border ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="w-px h-full bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">
            {activity.title}
          </span>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${config.bgColor} ${config.color} border`}
          >
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {activity.userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">
              {activity.userName}
            </span>
          </div>
          <span className="text-border">·</span>
          <span className="text-xs text-muted-foreground">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}

export function RecentActivityFeed({
  activities,
  title = 'Recent Activity',
  maxItems = 10,
  onItemClick,
  className = '',
}: RecentActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card variant="glass" className={`p-6 bg-card/80 ${className}`} hoverEffect={false}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground font-display">{title}</h3>
        {activities.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activities.length} total
          </Badge>
        )}
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 -mr-2">
        {displayActivities.length > 0 ? (
          displayActivities.map(activity => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onClick={onItemClick ? () => onItemClick(activity) : undefined}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>

      {activities.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <button className="text-xs text-primary hover:underline">
            View all {activities.length} activities →
          </button>
        </div>
      )}
    </Card>
  );
}

export default RecentActivityFeed;
