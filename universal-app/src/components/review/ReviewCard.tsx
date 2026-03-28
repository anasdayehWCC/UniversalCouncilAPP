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
          'flex items-center justify-between gap-4 p-4 rounded-lg border',
          'bg-white hover:bg-slate-50 transition-colors',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          !prefersReducedMotion && 'transition-all duration-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-slate-300"
            onClick={e => e.stopPropagation()}
          />
          <div className="min-w-0">
            <h4 className="font-medium text-slate-900 truncate">{item.minute.title}</h4>
            <p className="text-xs text-slate-500">{item.author.name} · {formatDateTime(item.submittedAt)}</p>
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
        'p-6 hover:shadow-md border-slate-200 group',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
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
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Author avatar */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border overflow-hidden',
              item.priority === 'urgent'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            )}
          >
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Link href={`/review-queue/${item.id}`} className="hover:underline">
                <h3 className="font-bold text-lg text-slate-900 truncate max-w-md">
                  {item.minute.title}
                </h3>
              </Link>
              <Badge variant="outline" className={cn(statusConfig.bg, statusConfig.color, statusConfig.border)}>
                {statusConfig.label}
              </Badge>
              {item.priority !== 'normal' && (
                <Badge variant="outline" className={cn(priorityConfig.bg, priorityConfig.color)}>
                  {item.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {priorityConfig.label}
                </Badge>
              )}
              {item.minute.riskScore && item.minute.riskScore !== 'low' && (
                <Badge
                  variant="outline"
                  className={cn(
                    item.minute.riskScore === 'high'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  )}
                >
                  Risk: {item.minute.riskScore}
                </Badge>
              )}
            </div>

            <p className="text-sm text-slate-600 mb-3">
              Submitted by{' '}
              <span className="font-medium text-slate-900">{item.author.name}</span>
              {' · '}
              {formatDateTime(item.submittedAt)}
              <span
                className={cn(
                  'ml-2 text-xs font-medium px-1.5 py-0.5 rounded',
                  slaStatus.isOverdue ? 'bg-red-50 text-red-700' : 'bg-slate-50',
                  slaStatus.color
                )}
              >
                {slaStatus.label}
              </span>
            </p>

            {/* Metadata pills */}
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                <Clock className="w-3 h-3" /> {item.minute.duration}
              </span>
              <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                <FileText className="w-3 h-3" /> {item.minute.templateId}
              </span>
              {item.feedbackCount > 0 && (
                <span className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded border',
                  item.unresolvedCount > 0
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                )}>
                  <MessageCircle className="w-3 h-3" />
                  {item.feedbackCount} feedback
                  {item.unresolvedCount > 0 && ` (${item.unresolvedCount} open)`}
                </span>
              )}
              {item.minute.tags && item.minute.tags.length > 0 && (
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <Shield className="w-3 h-3" /> {item.minute.tags.slice(0, 2).join(', ')}
                </span>
              )}
            </div>

            {/* Summary preview */}
            {item.minute.summary && (
              <p className="mt-3 text-sm text-slate-500 line-clamp-2">
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
              className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-slate-200"
              onClick={onApprove}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <Button
              aria-label="Request changes"
              title="Request changes"
              variant="outline"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200"
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
