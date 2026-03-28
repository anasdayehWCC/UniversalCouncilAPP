'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import type { Meeting, MeetingStatus } from '@/types/demo';
import { MeetingCard } from '@/components/MeetingCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyNotesPage() {
  const { currentUser, meetings, config } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const emptyCopy = currentUser.domain === 'adults'
    ? "No adult care notes yet. Start with Smart Capture or Upload."
    : currentUser.domain === 'children'
    ? "No children's notes yet. Record your first visit."
    : "No housing notes yet. Upload an inspection.";

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    // Domain check
    if (meeting.domain !== currentUser.domain) return false;
    
    // Search check
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          meeting.attendees.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    // Status check
    if (statusFilter !== 'all' && meeting.status !== statusFilter) return false;

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
        className="p-6 border-none text-white"
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
            <Button className="bg-white/10 text-white border border-white/30 hover:bg-white/20">
              New Recording
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by title, family name, or attendee..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MeetingStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
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
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No notes found</h3>
            <p className="text-slate-500">{emptyCopy}</p>
          </div>
        )}
      </div>
    </div>
  );
}
