'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MinuteStatusBadge } from '@/components/minutes/MinuteStatusBadge';
import { MinuteStatus, MINUTE_STATUS_CONFIG } from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  ChevronRight,
  Users,
  CheckSquare,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';

// Demo data for minutes list
const DEMO_MINUTES = [
  {
    id: 'min-001',
    title: 'Home Visit - Smith Family',
    date: '2024-03-15T10:00:00Z',
    duration: '45:23',
    status: 'draft' as MinuteStatus,
    caseName: 'Smith Family Support',
    templateName: 'Home Visit Notes',
    attendeeCount: 3,
    actionItemCount: 4,
    hasRisks: false
  },
  {
    id: 'min-002',
    title: 'Case Conference - Johnson Child Protection',
    date: '2024-03-14T14:00:00Z',
    duration: '1:32:15',
    status: 'pending_review' as MinuteStatus,
    caseName: 'Johnson Family',
    templateName: 'Case Conference',
    attendeeCount: 8,
    actionItemCount: 12,
    hasRisks: true
  },
  {
    id: 'min-003',
    title: 'Initial Assessment - Brown Family',
    date: '2024-03-13T09:30:00Z',
    duration: '58:42',
    status: 'approved' as MinuteStatus,
    caseName: 'Brown Family Assessment',
    templateName: 'Initial Assessment',
    attendeeCount: 4,
    actionItemCount: 6,
    hasRisks: false
  },
  {
    id: 'min-004',
    title: 'Review Meeting - Davis Ongoing Support',
    date: '2024-03-12T11:00:00Z',
    duration: '35:18',
    status: 'published' as MinuteStatus,
    caseName: 'Davis Support Plan',
    templateName: 'Review Meeting',
    attendeeCount: 5,
    actionItemCount: 3,
    hasRisks: false
  },
  {
    id: 'min-005',
    title: 'Team Strategy Session',
    date: '2024-03-11T15:00:00Z',
    duration: '1:15:00',
    status: 'pending_review' as MinuteStatus,
    caseName: 'Multi-Agency Response',
    templateName: 'Strategy Meeting',
    attendeeCount: 10,
    actionItemCount: 15,
    hasRisks: true
  }
];

export default function MinutesListPage() {
  const { currentUser } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MinuteStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredMinutes = useMemo(() => {
    return DEMO_MINUTES.filter(minute => {
      const matchesSearch = 
        minute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        minute.caseName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || minute.status === statusFilter;
      
      const matchesTab = 
        activeTab === 'all' ||
        (activeTab === 'drafts' && minute.status === 'draft') ||
        (activeTab === 'pending' && minute.status === 'pending_review') ||
        (activeTab === 'completed' && (minute.status === 'approved' || minute.status === 'published'));
      
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [searchQuery, statusFilter, activeTab]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const statusCounts = useMemo(() => ({
    all: DEMO_MINUTES.length,
    drafts: DEMO_MINUTES.filter(m => m.status === 'draft').length,
    pending: DEMO_MINUTES.filter(m => m.status === 'pending_review').length,
    completed: DEMO_MINUTES.filter(m => m.status === 'approved' || m.status === 'published').length
  }), []);

  return (
    <div className="min-h-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-display">
              Meeting Minutes
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your generated meeting minutes
            </p>
          </div>
          <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90">
            <Plus className="w-4 h-4 mr-2" />
            New Minutes
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Minutes', count: statusCounts.all, icon: FileText, color: 'text-muted-foreground' },
            { label: 'Drafts', count: statusCounts.drafts, icon: Clock, color: 'text-warning' },
            { label: 'Pending Review', count: statusCounts.pending, icon: AlertTriangle, color: 'text-info' },
            { label: 'Completed', count: statusCounts.completed, icon: CheckSquare, color: 'text-success' }
          ].map((stat) => (
            <Card key={stat.label} variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  'bg-[var(--primary-soft)]'
                )}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.count}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search minutes by title or case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-lg border',
                'bg-card border-input',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent'
              )}
            />
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts ({statusCounts.drafts})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Review ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({statusCounts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Minutes List */}
        <div className="space-y-3">
          {filteredMinutes.length === 0 ? (
            <Card variant="glass" className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No minutes found matching your criteria</p>
              <Button variant="link" className="mt-2" onClick={() => { setSearchQuery(''); setActiveTab('all'); }}>
                Clear filters
              </Button>
            </Card>
          ) : (
            filteredMinutes.map((minute) => (
              <Link key={minute.id} href={`/minutes/${minute.id}`}>
                <Card 
                  variant="glass" 
                  className={cn(
                    'p-4 cursor-pointer transition-all duration-200',
                    'hover:shadow-md hover:border-[var(--card-hover-border)]',
                    'group'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                      'bg-[var(--primary-soft)] group-hover:bg-[var(--accent-soft)]',
                      'transition-colors'
                    )}>
                      <FileText className="w-5 h-5 text-[var(--primary)]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {minute.title}
                        </h3>
                        <MinuteStatusBadge status={minute.status} size="sm" />
                        {minute.hasRisks && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Risks
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {minute.caseName} • {minute.templateName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(minute.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {minute.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {minute.attendeeCount} attendees
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          {minute.actionItemCount} actions
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
