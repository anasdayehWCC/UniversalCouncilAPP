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
    draft: 'bg-warning/10 text-warning border-warning/30',
    processing: 'bg-info/10 text-info border-info/30',
    ready: 'bg-success/10 text-success border-success/30',
    approved: 'bg-muted text-muted-foreground border-input',
    flagged: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  const statusLabels = {
    draft: 'Draft',
    processing: 'Processing',
    ready: 'Ready for Review',
    approved: 'Approved',
    flagged: 'Changes Requested',
  };
  const riskColors = {
    low: 'bg-success/10 text-success border-success/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    high: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <div className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <Badge variant="outline" className={cn("capitalize font-medium border", statusColors[meeting.status], meeting.status === 'processing' && "animate-pulse motion-reduce:animate-none")}>
              {statusLabels[meeting.status]}
            </Badge>
            {meeting.riskScore && (
              <Badge variant="outline" className={cn("font-medium border", riskColors[meeting.riskScore], "badge-accent-soft")}>
                Risk: {meeting.riskScore}
              </Badge>
            )}
            {meeting.processingMode && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-input">
                {meeting.processingMode === 'fast' ? 'Fast Mode' : 'Economy'}
              </Badge>
            )}
          </div>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground focus-visible:ring-0" aria-label="More actions">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/my-notes/${meeting.id}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
                  View Details
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer" onClick={() => alert('Edit functionality coming soon')}>
                <Edit className="w-4 h-4 mr-2 text-muted-foreground" />
                Edit Note
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => alert('PDF generation started...')}>
                <Download className="w-4 h-4 mr-2 text-muted-foreground" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => alert('Delete functionality restricted in demo')}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/my-notes/${meeting.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-display font-semibold text-lg text-foreground mb-1 line-clamp-1">
            {meeting.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(meeting.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{meeting.duration}</span>
          </div>
          {(meeting.uploadedAt || meeting.submittedAt) && (
            <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full border border-input">
              Submitted {formatDate(meeting.uploadedAt || meeting.submittedAt || meeting.date)}
            </span>
          )}
        </div>

        {!compact && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {meeting.summary || "No summary available yet..."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex -space-x-2">
            {meeting.attendees.slice(0, 3).map((attendee, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground" title={attendee}>
                {attendee.charAt(0)}
              </div>
            ))}
            {meeting.attendees.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                +{meeting.attendees.length - 3}
              </div>
            )}
          </div>

          <Link href={`/my-notes/${meeting.id}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1 pl-2 pr-1">
              Open
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
