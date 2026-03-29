'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Shield,
  MessageCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/dates';
import {
  ReviewItem,
  REVIEW_STATUS_CONFIG,
  PRIORITY_CONFIG,
  getSlaRemaining,
} from '@/lib/review/types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ReviewCardProps {
  item: ReviewItem;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
  compact?: boolean;
}

export default function ReviewCard({
  item,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onView,
  compact = false,
}: ReviewCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const statusConfig = REVIEW_STATUS_CONFIG[item.status];
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const slaStatus = getSlaRemaining(item.submittedAt);

  const initials = item.author.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-4 rounded-lg border border-border',
          'bg-card hover:bg-muted/50 transition-colors',
          isSelected && 'ring-2 ring-primary ring-offset-2',
          !prefersReducedMotion && 'transition-all duration-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-border"
            onClick={e => e.stopPropagation()}
          />
          <div className="min-w-0">
            <h4 className="font-medium text-foreground truncate">{item.minute.title}</h4>
            <p className="text-xs text-muted-foreground">{item.author.name} · {formatDateTime(item.submittedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(priorityConfig.bg, priorityConfig.color, 'text-xs')}>
            {priorityConfig.label}
          </Badge>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'p-6 hover:shadow-md border-border group',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        !prefersReducedMotion && 'transition-all duration-300'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Selection checkbox */}
          <div className="pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded border-border accent-primary"
            />
          </div>

          {/* Author avatar */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border overflow-hidden',
              item.priority === 'urgent'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-primary/10 text-primary border-primary/20'
            )}
          >
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Link href={`/review-queue/${item.id}`} className="hover:underline">
                <h3 className="font-bold text-lg text-foreground truncate max-w-md">
                  {item.minute.title}
                </h3>
              </Link>
              {(() => {
                const allBadges = [
                  <Badge key="status" variant="outline" className={cn(statusConfig.bg, statusConfig.color, statusConfig.border)}>
                    {statusConfig.label}
                  </Badge>,
                  ...(item.priority !== 'normal' ? [
                    <Badge key="priority" variant="outline" className={cn(priorityConfig.bg, priorityConfig.color)}>
                      {item.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {priorityConfig.label}
                    </Badge>
                  ] : []),
                  ...(item.minute.riskScore && item.minute.riskScore !== 'low' ? [
                    <Badge
                      key="risk"
                      variant="outline"
                      className={cn(
                        item.minute.riskScore === 'high'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      )}
                    >
                      Risk: {item.minute.riskScore}
                    </Badge>
                  ] : []),
                ];
                const visibleBadges = allBadges.slice(0, 3);
                const hiddenCount = allBadges.length - 3;
                return (
                  <>
                    {visibleBadges}
                    {hiddenCount > 0 && (
                      <Badge variant="outline" className="text-muted-foreground text-xs">+{hiddenCount}</Badge>
                    )}
                  </>
                );
              })()}
            </div>

            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2 flex-wrap">
              <span>
                Submitted by{' '}
                <span className="font-medium text-foreground">{item.author.name}</span>
                {' · '}
                {formatDateTime(item.submittedAt)}
              </span>
              {slaStatus.isOverdue ? (
                <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                  <Clock className="w-3 h-3" />
                  {slaStatus.label}
                </span>
              ) : (
                <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded bg-muted', slaStatus.color)}>
                  {slaStatus.label}
                </span>
              )}
            </p>

            {/* Metadata pills */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                <Clock className="w-3 h-3" /> {item.minute.duration}
              </span>
              <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                <FileText className="w-3 h-3" /> {item.minute.templateId}
              </span>
              {item.feedbackCount > 0 && (
                <span className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded border',
                  item.unresolvedCount > 0
                    ? 'bg-warning/10 border-warning/20 text-warning'
                    : 'bg-success/10 border-success/20 text-success'
                )}>
                  <MessageCircle className="w-3 h-3" />
                  {item.feedbackCount} feedback
                  {item.unresolvedCount > 0 && ` (${item.unresolvedCount} open)`}
                </span>
              )}
              {item.minute.tags && item.minute.tags.length > 0 && (
                <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                  <Shield className="w-3 h-3" /> {item.minute.tags.slice(0, 2).join(', ')}
                </span>
              )}
            </div>

            {/* Summary preview */}
            {item.minute.summary && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {item.minute.summary}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <Link href={`/review-queue/${item.id}`}>
            <Button className="w-full shadow-sm gap-2">
              Review
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              aria-label="Approve"
              title="Quick approve"
              variant="outline"
              className="flex-1 text-success hover:bg-success/10 border-border"
              onClick={onApprove}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <Button
              aria-label="Request changes"
              title="Request changes"
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive/10 border-border"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
