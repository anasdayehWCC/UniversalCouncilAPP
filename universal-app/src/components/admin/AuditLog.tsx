'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search,
  Filter,
  Download,
  User,
  Puzzle,
  FileText,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ToggleRight,
  ToggleLeft,
  LogIn,
  LogOut
} from 'lucide-react';
import { AuditLogEntry } from '@/types/admin';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDistanceToNow } from '@/lib/dates';

interface AuditLogProps {
  entries: AuditLogEntry[];
  pageSize?: number;
}

const ACTION_CONFIG: Record<AuditLogEntry['action'], { icon: React.ReactNode; label: string; color: string }> = {
  create: { icon: <Plus className="w-3.5 h-3.5" />, label: 'Created', color: 'bg-success/10 text-success' },
  update: { icon: <Pencil className="w-3.5 h-3.5" />, label: 'Updated', color: 'bg-info/10 text-info' },
  delete: { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Deleted', color: 'bg-destructive/10 text-destructive' },
  enable: { icon: <ToggleRight className="w-3.5 h-3.5" />, label: 'Enabled', color: 'bg-success/10 text-success' },
  disable: { icon: <ToggleLeft className="w-3.5 h-3.5" />, label: 'Disabled', color: 'bg-warning/10 text-warning' },
  login: { icon: <LogIn className="w-3.5 h-3.5" />, label: 'Logged in', color: 'bg-muted text-muted-foreground' },
  logout: { icon: <LogOut className="w-3.5 h-3.5" />, label: 'Logged out', color: 'bg-muted text-muted-foreground' }
};

const RESOURCE_ICONS: Record<AuditLogEntry['resource'], React.ReactNode> = {
  user: <User className="w-4 h-4" />,
  module: <Puzzle className="w-4 h-4" />,
  template: <FileText className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />
};

export function AuditLog({ entries, pageSize = 10 }: AuditLogProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = search === '' ||
        entry.userName.toLowerCase().includes(search.toLowerCase()) ||
        entry.resourceName.toLowerCase().includes(search.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
      const matchesResource = resourceFilter === 'all' || entry.resource === resourceFilter;
      
      return matchesSearch && matchesAction && matchesResource;
    });
  }, [entries, search, actionFilter, resourceFilter]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource Name', 'Details'].join(','),
      ...filteredEntries.map(e => [
        e.timestamp,
        e.userName,
        e.action,
        e.resource,
        e.resourceName,
        e.details ? JSON.stringify(e.details) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="glass" hoverEffect={false} className="bg-card/80 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by user or resource..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select 
              value={actionFilter} 
              onValueChange={(v) => {
                setActionFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Created</SelectItem>
                <SelectItem value="update">Updated</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="enable">Enabled</SelectItem>
                <SelectItem value="disable">Disabled</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={resourceFilter} 
              onValueChange={(v) => {
                setResourceFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="module">Modules</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="meeting">Meetings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export */}
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Log entries */}
      <div className="divide-y divide-border">
        {paginatedEntries.map((entry) => {
          const actionConfig = ACTION_CONFIG[entry.action];
          
          return (
            <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-4">
                {/* Resource icon */}
                <div className="p-2 bg-muted rounded-lg text-muted-foreground shrink-0">
                  {RESOURCE_ICONS[entry.resource]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{entry.userName}</span>
                    <Badge 
                      variant="outline" 
                      className={cn('gap-1', actionConfig.color)}
                    >
                      {actionConfig.icon}
                      {actionConfig.label}
                    </Badge>
                    <span className="text-muted-foreground">{entry.resource}</span>
                    <span className="font-medium text-foreground">&quot;{entry.resourceName}&quot;</span>
                  </div>

                  {/* Details */}
                  {entry.details && (
                    <div className="mt-2 text-sm text-muted-foreground bg-muted rounded p-2 font-mono text-xs">
                      {Object.entries(entry.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground/60">{key}:</span>{' '}
                          <span className="text-foreground/80">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground/60">
                    <span title={formatDateTime(entry.timestamp)}>
                      {formatDistanceToNow(new Date(entry.timestamp))}
                    </span>
                    {entry.ipAddress && (
                      <span>IP: {entry.ipAddress}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {paginatedEntries.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No audit log entries found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
