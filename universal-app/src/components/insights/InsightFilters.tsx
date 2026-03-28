'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, Filter, Calendar } from 'lucide-react';
import type { InsightFilters as IFilters, InsightPeriod } from '@/lib/insights/types';

interface InsightFiltersProps {
  filters: IFilters;
  onFiltersChange: (filters: Partial<IFilters>) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  domains?: { value: string; label: string }[];
  teams?: { value: string; label: string }[];
  users?: { value: string; label: string }[];
  isLoading?: boolean;
  className?: string;
}

const PERIOD_OPTIONS_LIST: Array<{ value: InsightPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

export function InsightFilters({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  domains = [],
  teams = [],
  users = [],
  isLoading = false,
  className = '',
}: InsightFiltersProps) {
  const hasActiveFilters = filters.domain || filters.team || filters.userId;

  const clearFilters = () => {
    onFiltersChange({
      domain: null,
      team: null,
      userId: null,
    });
  };

  return (
    <Card variant="glass" className={`p-4 bg-white/80 dark:bg-slate-900/80 ${className}`} hoverEffect={false}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Select
            value={filters.period}
            onValueChange={(value: InsightPeriod) => onFiltersChange({ period: value })}
          >
            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS_LIST.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Domain Filter */}
        {domains.length > 0 && (
          <Select
            value={filters.domain || 'all'}
            onValueChange={(value) => onFiltersChange({ domain: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map(domain => (
                <SelectItem key={domain.value} value={domain.value}>
                  {domain.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Team Filter */}
        {teams.length > 0 && (
          <Select
            value={filters.team || 'all'}
            onValueChange={(value) => onFiltersChange({ team: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.value} value={team.value}>
                  {team.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* User Filter */}
        {users.length > 0 && (
          <Select
            value={filters.userId || 'all'}
            onValueChange={(value) => onFiltersChange({ userId: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(user => (
                <SelectItem key={user.value} value={user.value}>
                  {user.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}

          {onExport && (
            <Button
              variant="default"
              size="sm"
              onClick={onExport}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default InsightFilters;
