'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import type { Meeting, MeetingStatus } from '@/types/demo';
import { MeetingCard } from '@/components/MeetingCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, SlidersHorizontal, Tag, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyNotesPage() {
  const { currentUser, meetings, templates, config } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const emptyCopy = currentUser.domain === 'adults'
    ? "No adult care notes yet. Start with Smart Capture or Upload."
    : currentUser.domain === 'children'
    ? "No children's notes yet. Record your first visit."
    : "No housing notes yet. Upload an inspection.";

  // Meetings belonging to the current user's domain
  const domainMeetings = useMemo(
    () => meetings.filter(m => m.domain === currentUser.domain),
    [meetings, currentUser.domain],
  );

  // Collect unique tags and unique template names from domain meetings
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const m of domainMeetings) {
      for (const t of m.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [domainMeetings]);

  const availableTemplates = useMemo(() => {
    const tplIds = new Set<string>();
    for (const m of domainMeetings) tplIds.add(m.templateId);
    return templates.filter(t => tplIds.has(t.id));
  }, [domainMeetings, templates]);

  // Whether any filter beyond search is active
  const hasActiveFilters = statusFilter !== 'all' || templateFilter !== 'all' || activeTags.size > 0;

  function toggleTag(tag: string) {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function clearFilters() {
    setStatusFilter('all');
    setTemplateFilter('all');
    setActiveTags(new Set());
  }

  // Filter meetings
  const filteredMeetings = domainMeetings.filter(meeting => {
    // Search check
    const query = searchQuery.toLowerCase();
    const matchesSearch = meeting.title.toLowerCase().includes(query) ||
                          meeting.attendees.some(a => a.toLowerCase().includes(query));
    if (!matchesSearch) return false;

    // Status check
    if (statusFilter !== 'all' && meeting.status !== statusFilter) return false;

    // Template check
    if (templateFilter !== 'all' && meeting.templateId !== templateFilter) return false;

    // Tag check (AND logic: meeting must contain ALL selected tags)
    if (activeTags.size > 0) {
      for (const tag of activeTags) {
        if (!meeting.tags.includes(tag)) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const getDate = (m: Meeting) => new Date(m.uploadedAt || m.submittedAt || m.date).getTime();
    return getDate(b) - getDate(a);
  });

  return (
    <div className="space-y-6">
      <Card
        variant="glass"
        hoverEffect={false}
        className="p-6 border-none text-primary-foreground"
        style={{ background: config.theme.gradient }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">My Notes</h1>
            <p className="text-sm opacity-80">Manage your recordings, minutes, and reports.</p>
            <div className="info-rail mt-3">
              <span className="info-rail__item">
                <span className="info-rail__dot" style={{ background: '#22c55e' }} />
                Total: {filteredMeetings.length}
              </span>
              <span className="info-rail__item">
                <span className="info-rail__dot" style={{ background: '#f59e0b' }} />
                Filter: {statusFilter === 'all' ? 'All' : statusFilter}
              </span>
            </div>
          </div>
          <Link href="/record">
            <Button className="bg-white/10 text-primary-foreground border border-white/30 hover:bg-white/20">
              New Recording
            </Button>
          </Link>
        </div>
      </Card>

      {/* Search and dropdown filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, family name, or attendee..."
            className="pl-9 bg-muted border-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MeetingStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready for Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Changes Requested</SelectItem>
            </SelectContent>
          </Select>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by template" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              {availableTemplates.map(tpl => (
                <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tag filter chips */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
          {availableTags.map(tag => {
            const isActive = activeTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={
                  isActive
                    ? 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    : 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border border-input hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                }
              >
                {tag}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No notes found</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'No notes match the current filters. Try adjusting your filters or search.'
                : emptyCopy}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="mt-3 text-primary">
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
