'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ReviewFilter,
  ReviewStatus,
  ReviewPriority,
  REVIEW_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/review/types';
import { ServiceDomain, DOMAINS } from '@/config/domains';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ReviewFiltersProps {
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  stats: {
    totalPending: number;
    urgentCount: number;
    overdueCount: number;
    totalInReview: number;
    totalChangesRequested: number;
  };
  authors?: Array<{ id: string; name: string }>;
  showAdvanced?: boolean;
}

const STATUS_OPTIONS: ReviewStatus[] = [
  'pending',
  'in_review',
  'changes_requested',
  'approved',
];

const PRIORITY_OPTIONS: ReviewPriority[] = [
  'urgent',
  'high',
  'normal',
  'low',
];

export default function ReviewFilters({
  filter,
  onFilterChange,
  stats,
  authors = [],
  showAdvanced: initialShowAdvanced = false,
}: ReviewFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleSearchChange = (searchQuery: string) => {
    onFilterChange({ ...filter, searchQuery: searchQuery || undefined });
  };

  const handleStatusToggle = (status: ReviewStatus) => {
    const current = filter.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFilterChange({ ...filter, status: updated.length > 0 ? updated : undefined });
  };

  const handlePriorityToggle = (priority: ReviewPriority) => {
    const current = filter.priority || [];
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority];
    onFilterChange({ ...filter, priority: updated.length > 0 ? updated : undefined });
  };

  const handleDomainToggle = (domain: ServiceDomain) => {
    const current = filter.domain || [];
    const updated = current.includes(domain)
      ? current.filter(d => d !== domain)
      : [...current, domain];
    onFilterChange({ ...filter, domain: updated.length > 0 ? updated : undefined });
  };

  const handleOverdueToggle = () => {
    onFilterChange({ ...filter, isOverdue: !filter.isOverdue });
  };

  const handleUnresolvedToggle = () => {
    onFilterChange({ ...filter, hasUnresolvedFeedback: !filter.hasUnresolvedFeedback });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const activeFilterCount =
    (filter.status?.length || 0) +
    (filter.priority?.length || 0) +
    (filter.domain?.length || 0) +
    (filter.searchQuery ? 1 : 0) +
    (filter.isOverdue ? 1 : 0) +
    (filter.hasUnresolvedFeedback ? 1 : 0);

  return (
    <Card className="p-4 border-slate-200">
      {/* Quick filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by title, author..."
            value={filter.searchQuery || ''}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick status pills */}
        <div className="flex items-center gap-2">
          <Button
            variant={!filter.status || filter.status.length === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ ...filter, status: undefined })}
          >
            All ({stats.totalPending + stats.totalInReview + stats.totalChangesRequested})
          </Button>
          <Button
            variant={filter.status?.includes('pending') ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ ...filter, status: ['pending'] })}
            className="gap-1"
          >
            <Clock className="w-3 h-3" />
            Pending ({stats.totalPending})
          </Button>
          <Button
            variant={filter.isOverdue ? 'default' : 'outline'}
            size="sm"
            onClick={handleOverdueToggle}
            className={cn('gap-1', filter.isOverdue && 'bg-red-600 hover:bg-red-700')}
          >
            <AlertTriangle className="w-3 h-3" />
            Overdue ({stats.overdueCount})
          </Button>
          <Button
            variant={filter.priority?.includes('urgent') ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ ...filter, priority: ['urgent', 'high'] })}
            className={cn('gap-1', filter.priority?.includes('urgent') && 'bg-orange-600 hover:bg-orange-700')}
          >
            <AlertCircle className="w-3 h-3" />
            Urgent ({stats.urgentCount})
          </Button>
        </div>

        {/* Toggle advanced */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-1 text-slate-600"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
          {showAdvanced ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div
          className={cn(
            'pt-4 border-t border-slate-200 grid gap-4 md:grid-cols-2 lg:grid-cols-4',
            !prefersReducedMotion && 'animate-in fade-in slide-in-from-top-2 duration-300'
          )}
        >
          {/* Status filter */}
          <div>
            <label className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2 block">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(status => {
                const config = REVIEW_STATUS_CONFIG[status];
                const isActive = filter.status?.includes(status);
                return (
                  <Badge
                    key={status}
                    variant="outline"
                    className={cn(
                      'cursor-pointer transition-colors',
                      isActive
                        ? cn(config.bg, config.color, config.border)
                        : 'bg-white hover:bg-slate-50'
                    )}
                    onClick={() => handleStatusToggle(status)}
                  >
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <label className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2 block">
              Priority
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map(priority => {
                const config = PRIORITY_CONFIG[priority];
                const isActive = filter.priority?.includes(priority);
                return (
                  <Badge
                    key={priority}
                    variant="outline"
                    className={cn(
                      'cursor-pointer transition-colors',
                      isActive
                        ? cn(config.bg, config.color)
                        : 'bg-white hover:bg-slate-50'
                    )}
                    onClick={() => handlePriorityToggle(priority)}
                  >
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Domain filter */}
          <div>
            <label className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2 block">
              Service Domain
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(DOMAINS) as ServiceDomain[]).map(domain => {
                const config = DOMAINS[domain];
                const isActive = filter.domain?.includes(domain);
                return (
                  <Badge
                    key={domain}
                    variant="outline"
                    className={cn(
                      'cursor-pointer transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white hover:bg-slate-50'
                    )}
                    onClick={() => handleDomainToggle(domain)}
                  >
                    {config.name}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Additional toggles */}
          <div>
            <label className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2 block">
              Options
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filter.hasUnresolvedFeedback || false}
                  onChange={handleUnresolvedToggle}
                  className="w-4 h-4 rounded border-slate-300"
                />
                Has unresolved feedback
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filter.isOverdue || false}
                  onChange={handleOverdueToggle}
                  className="w-4 h-4 rounded border-slate-300"
                />
                Overdue items only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilterCount > 0 && !showAdvanced && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {filter.status?.map(status => (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer hover:bg-slate-200"
              onClick={() => handleStatusToggle(status)}
            >
              {REVIEW_STATUS_CONFIG[status].label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filter.priority?.map(priority => (
            <Badge
              key={priority}
              variant="secondary"
              className="cursor-pointer hover:bg-slate-200"
              onClick={() => handlePriorityToggle(priority)}
            >
              {PRIORITY_CONFIG[priority].label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filter.isOverdue && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-slate-200"
              onClick={handleOverdueToggle}
            >
              Overdue
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filter.searchQuery && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-slate-200"
              onClick={() => handleSearchChange('')}
            >
              &ldquo;{filter.searchQuery}&rdquo;
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
