'use client';

import React from 'react';
import { Meeting } from '@/types/demo';
import { Calendar, Clock, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/dates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Eye, Download } from 'lucide-react';

interface MeetingCardProps {
  meeting: Meeting;
  compact?: boolean;
}

export function MeetingCard({ meeting, compact = false }: MeetingCardProps) {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200',
    ready: 'bg-green-100 text-green-700 border-green-200',
    approved: 'bg-slate-100 text-slate-700 border-slate-200',
    flagged: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels = {
    draft: 'Draft',
    processing: 'Processing',
    ready: 'Ready for Review',
    approved: 'Approved',
    flagged: 'Changes Requested',
  };
  const riskColors = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <Badge variant="outline" className={cn("capitalize font-medium border", statusColors[meeting.status], meeting.status === 'processing' && "animate-pulse")}>
              {statusLabels[meeting.status]}
            </Badge>
            {meeting.riskScore && (
              <Badge variant="outline" className={cn("font-medium border", riskColors[meeting.riskScore], "badge-accent-soft")}>
                Risk: {meeting.riskScore}
              </Badge>
            )}
            {meeting.processingMode && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                {meeting.processingMode === 'fast' ? 'Fast Mode' : 'Economy'}
              </Badge>
            )}
          </div>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600 focus-visible:ring-0" aria-label="More actions">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/my-notes/${meeting.id}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="w-4 h-4 mr-2 text-slate-500" />
                  View Details
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer" onClick={() => alert('Edit functionality coming soon')}>
                <Edit className="w-4 h-4 mr-2 text-slate-500" />
                Edit Note
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => alert('PDF generation started...')}>
                <Download className="w-4 h-4 mr-2 text-slate-500" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => alert('Delete functionality restricted in demo')}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/my-notes/${meeting.id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-display font-semibold text-lg text-slate-900 mb-1 line-clamp-1">
            {meeting.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(meeting.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{meeting.duration}</span>
          </div>
          {(meeting.uploadedAt || meeting.submittedAt) && (
            <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Submitted {formatDate(meeting.uploadedAt || meeting.submittedAt || meeting.date)}
            </span>
          )}
        </div>

        {!compact && (
          <div className="mb-4">
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {meeting.summary || "No summary available yet..."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex -space-x-2">
            {meeting.attendees.slice(0, 3).map((attendee, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600" title={attendee}>
                {attendee.charAt(0)}
              </div>
            ))}
            {meeting.attendees.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-500">
                +{meeting.attendees.length - 3}
              </div>
            )}
          </div>
          
          <Link href={`/my-notes/${meeting.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 gap-1 pl-2 pr-1">
              Open
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
