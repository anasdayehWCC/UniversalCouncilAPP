'use client';

import React from 'react';
import { Minute } from '@/lib/minutes/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Users, 
  CheckSquare,
  AlertTriangle,
  User,
  Briefcase
} from 'lucide-react';

interface MinuteInfoSidebarProps {
  minute: Minute;
  className?: string;
}

export function MinuteInfoSidebar({ minute, className }: MinuteInfoSidebarProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const presentAttendees = minute.attendees.filter(a => a.present);
  const absentAttendees = minute.attendees.filter(a => !a.present);
  const completedActions = minute.actionItems.filter(a => a.status === 'completed');
  const pendingActions = minute.actionItems.filter(a => a.status !== 'completed' && a.status !== 'cancelled');

  return (
    <Card variant="glass" className={cn('p-4 space-y-6', className)}>
      {/* Meeting Info */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Meeting Info
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{formatDate(minute.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{minute.duration}</span>
          </div>
          {minute.metadata.templateName && (
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{minute.metadata.templateName}</span>
            </div>
          )}
          {minute.metadata.caseName && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{minute.metadata.caseName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendees Summary */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Attendees ({presentAttendees.length}/{minute.attendees.length})
        </h3>
        <div className="space-y-2">
          {presentAttendees.slice(0, 5).map((attendee) => (
            <div key={attendee.id} className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-xs font-medium text-[var(--primary)]">
                {attendee.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{attendee.name}</p>
                <p className="text-xs text-muted-foreground/70">{attendee.role}</p>
              </div>
            </div>
          ))}
          {presentAttendees.length > 5 && (
            <p className="text-xs text-muted-foreground pl-8">
              +{presentAttendees.length - 5} more
            </p>
          )}
          {absentAttendees.length > 0 && (
            <p className="text-xs text-muted-foreground/70 mt-2">
              {absentAttendees.length} absent
            </p>
          )}
        </div>
      </div>

      {/* Action Items Progress */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Action Items
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-medium text-success">{completedActions.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium text-warning">{pendingActions.length}</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-success"
              style={{ 
                width: `${minute.actionItems.length > 0 
                  ? (completedActions.length / minute.actionItems.length) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Risks Indicator */}
      {minute.sections.some(s => s.type === 'risks' && s.content.trim() !== '') && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              Risks Identified
            </span>
          </div>
          <p className="text-xs text-warning/80 mt-1">
            Review the risks section for important concerns.
          </p>
        </div>
      )}

      {/* Document Stats */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{minute.metadata.wordCount} words</span>
          <span>~{minute.metadata.estimatedReadTime} min read</span>
        </div>
      </div>
    </Card>
  );
}
