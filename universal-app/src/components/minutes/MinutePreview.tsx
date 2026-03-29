'use client';

import React, { useRef } from 'react';
import { Minute, MINUTE_STATUS_CONFIG, SECTION_TYPES, ACTION_PRIORITY_CONFIG } from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MinuteStatusBadge } from './MinuteStatusBadge';
import { 
  Printer, 
  Share2, 
  Download, 
  Calendar,
  Clock,
  Users,
  FileText,
  CheckSquare,
  Flag,
  User,
  Building2
} from 'lucide-react';

interface MinutePreviewProps {
  minute: Minute;
  showActions?: boolean;
  onShare?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function MinutePreview({
  minute,
  showActions = true,
  onShare,
  onPrint,
  onDownload,
  className
}: MinutePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc">
            {line.substring(2)}
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <li key={i} className="ml-4 list-decimal">
            {line.replace(/^\d+\. /, '')}
          </li>
        );
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Actions Bar */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      )}

      {/* Document */}
      <div 
        ref={printRef}
        className={cn(
          'bg-card rounded-xl shadow-lg border border-border',
          'print:shadow-none print:border-none print:rounded-none'
        )}
      >
        {/* Header */}
        <div className={cn(
          'px-8 py-6 border-b border-border',
          'bg-gradient-to-br from-muted/30 to-card',
          'print:bg-white'
        )}>
          <div className="flex items-start justify-between">
            <div>
              <MinuteStatusBadge status={minute.status} size="sm" className="mb-3 print:hidden" />
              <h1 className="text-2xl font-bold text-foreground font-display">
                {minute.title}
              </h1>
              {minute.metadata.caseName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Case: {minute.metadata.caseName}
                </p>
              )}
            </div>
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-end gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(minute.date)}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Clock className="w-4 h-4" />
                Duration: {minute.duration}
              </div>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
            {minute.metadata.templateName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                Template: {minute.metadata.templateName}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {minute.attendees.filter(a => a.present).length} attendees
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckSquare className="w-4 h-4" />
              {minute.actionItems.length} action items
            </div>
          </div>
        </div>

        {/* Attendees */}
        {minute.attendees.length > 0 && (
          <div className="px-8 py-5 border-b border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Attendees
            </h2>
            <div className="flex flex-wrap gap-2">
              {minute.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                    attendee.present
                      ? 'bg-muted text-foreground'
                      : 'bg-muted/50 text-muted-foreground line-through'
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  {attendee.name}
                  <span className="text-xs text-muted-foreground">({attendee.role})</span>
                  {!attendee.present && <span className="text-xs text-muted-foreground/70">- Absent</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="px-8 py-6 space-y-8">
          {minute.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div key={section.id} className="break-inside-avoid">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-md text-xs',
                    'bg-[var(--primary-soft)] text-[var(--primary)]'
                  )}>
                    {section.order + 1}
                  </span>
                  {section.title}
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/80">
                  {renderMarkdown(section.content)}
                </div>
              </div>
            ))}
        </div>

        {/* Action Items */}
        {minute.actionItems.length > 0 && (
          <div className="px-8 py-6 border-t border-border/50 bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
              Action Items
            </h2>
            <div className="space-y-3">
              {minute.actionItems.map((item, index) => {
                const priorityConfig = ACTION_PRIORITY_CONFIG[item.priority];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg',
                      'bg-card border border-border'
                    )}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.description}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.assignee}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={cn('flex items-center gap-1', priorityConfig.color)}>
                          <Flag className="w-3 h-3" />
                          {priorityConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Generated: {new Date(minute.metadata.generatedAt).toLocaleString('en-GB')}</span>
              {minute.metadata.lastEditedBy && (
                <span>Last edited by: {minute.metadata.lastEditedBy}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>{minute.metadata.wordCount} words</span>
              <span>•</span>
              <span>~{minute.metadata.estimatedReadTime} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
