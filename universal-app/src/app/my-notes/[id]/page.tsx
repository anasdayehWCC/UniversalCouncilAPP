'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TranscriptTab } from './components';
import { AIEditSidebar } from '@/components/AIEditSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calendar, Clock, Share2, Download, 
  FileText, Mic, CheckSquare, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { formatDate, formatTime } from '@/lib/dates';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PageHeader, ShellPage } from '@/components/layout';

export default function MeetingDetailPage() {
  const params = useParams();
  const { meetings, templates, personas } = useDemo();
  const meeting = meetings.find(m => m.id === params.id);
  const template = templates.find(t => t.id === meeting?.templateId);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'tasks'>('summary');
  const [assistantOpen, setAssistantOpen] = useState(false);

  if (!meeting) {
    return <div className="p-12 text-center">Meeting not found</div>;
  }

  return (
    <ShellPage
      padded={false}
      header={
        <PageHeader
          eyebrow="My Notes"
          title={meeting.title}
          description={
            <div className="space-y-3">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/my-notes" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  My Notes
                </Link>
                <span className="opacity-30">/</span>
                <span className="truncate font-medium text-foreground">Details</span>
              </nav>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(meeting.date)} at {formatTime(meeting.date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {meeting.duration}
                </span>
                {(meeting.uploadedAt || meeting.submittedAt) && (
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs">
                    Submitted {formatDate(meeting.uploadedAt || meeting.submittedAt || meeting.date)}
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {meeting.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground"
                        title={attendee}
                      >
                        {attendee.charAt(0)}
                      </div>
                    ))}
                  </div>
                  {meeting.attendees.length} attendees
                </span>
              </div>
            </div>
          }
          metrics={[
            { label: 'Template', value: template?.name || 'General Meeting', tone: 'default' },
            {
              label: 'Status',
              value: meeting.status === 'flagged' ? 'Changes Requested' : meeting.status.replace('_', ' '),
              tone:
                meeting.status === 'ready'
                  ? 'success'
                  : meeting.status === 'flagged'
                  ? 'destructive'
                  : meeting.status === 'processing'
                  ? 'info'
                  : 'warning',
            },
            ...(meeting.riskScore
              ? [{
                  label: 'Risk',
                  value: meeting.riskScore,
                  tone:
                    meeting.riskScore === 'high'
                      ? 'destructive'
                      : meeting.riskScore === 'medium'
                      ? 'warning'
                      : 'success',
                } as const]
              : []),
            ...(meeting.processingMode
              ? [{
                  label: 'Mode',
                  value: meeting.processingMode === 'fast' ? 'Fast' : 'Economy',
                  tone: 'info',
                } as const]
              : []),
          ]}
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 xl:hidden"
                onClick={() => setAssistantOpen(true)}
              >
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button className="gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </>
          }
        />
      }
      inspector={<AIEditSidebar />}
      inspectorClassName="hidden xl:block"
      contentClassName="min-h-0"
    >
      <div className="space-y-6 xl:pr-4">
        <div className="rounded-[22px] border border-border/70 bg-card/92 p-2 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)]">
          <div role="tablist" aria-label="Note sections" className="flex flex-wrap gap-2">
            <button
              role="tab"
              aria-selected={activeTab === 'summary'}
              aria-controls="tabpanel-summary"
              onClick={() => setActiveTab('summary')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'summary'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <FileText className="w-4 h-4" />
              Summary
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'transcript'}
              aria-controls="tabpanel-transcript"
              onClick={() => setActiveTab('transcript')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'transcript'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Mic className="w-4 h-4" />
              Recording & Transcript
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'tasks'}
              aria-controls="tabpanel-tasks"
              onClick={() => setActiveTab('tasks')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'tasks'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-bold',
                  activeTab === 'tasks'
                    ? 'bg-white/18 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {meeting.tasks.length}
              </span>
            </button>
          </div>
        </div>

        <div id="tabpanel-summary" role="tabpanel" aria-label="Summary" className={cn('animate-in fade-in slide-in-from-bottom-4 duration-500', activeTab !== 'summary' && 'hidden')}>
          <Card variant="glass" className="min-h-[34rem] rounded-[24px] border border-border/70 bg-card/84 p-8 shadow-sm" hoverEffect={false}>
            {meeting.summary.split('\n\n').map((block, index) => {
              const isHeader = block.startsWith('**');
              if (isHeader) {
                const match = block.match(/\*\*(.*?)\*\*\n?([\s\S]*)/);
                if (match) {
                  return (
                    <div key={index} className="group mb-8 last:mb-0">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                        {match[1]}
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Regenerate
                        </Button>
                      </h3>
                      <p className="whitespace-pre-line leading-relaxed text-foreground/80">
                        {match[2]}
                      </p>
                    </div>
                  );
                }
              }

              return (
                <div key={index} className="mb-8 last:mb-0">
                  <p className="whitespace-pre-line leading-relaxed text-foreground/80">{block}</p>
                </div>
              );
            })}
          </Card>
        </div>

        <div id="tabpanel-transcript" role="tabpanel" aria-label="Recording and Transcript" className={cn('min-h-0 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500', activeTab !== 'transcript' && 'hidden')}>
          <TranscriptTab
            recordingId={meeting.id}
            legacyTranscript={meeting.transcript}
            duration={meeting.duration}
          />
        </div>

        <div id="tabpanel-tasks" role="tabpanel" aria-label="Tasks" className={cn('animate-in fade-in slide-in-from-bottom-4 duration-500', activeTab !== 'tasks' && 'hidden')}>
          <Card variant="glass" className="overflow-hidden rounded-[24px] border border-border/70 bg-card/84 shadow-sm" hoverEffect={false}>
            {meeting.tasks.length > 0 ? meeting.tasks.map((task) => (
              <div key={task.id} className="group flex items-center gap-4 border-b border-border p-4 transition-colors last:border-0 hover:bg-muted/40">
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                  task.status === 'done' ? 'border-success bg-success text-white' : 'border-input hover:border-primary'
                )}>
                  {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1">
                  <p className={cn('font-medium', task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {formatDate(task.dueDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                        {(personas[task.assigneeId]?.name || task.assigneeId).charAt(0).toUpperCase()}
                      </div>
                      Assigned to {personas[task.assigneeId]?.name || task.assigneeId}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  'capitalize',
                  task.status === 'done'
                    ? 'border-success/30 bg-success/10 text-success'
                    : task.status === 'in_progress'
                    ? 'border-info/30 bg-info/10 text-info'
                    : 'border-input bg-muted text-muted-foreground'
                )}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            )) : (
              <div className="p-12 text-center text-muted-foreground">
                <CheckSquare className="mx-auto mb-4 w-12 h-12 opacity-20" />
                <p className="mb-4">No tasks assigned for this meeting.</p>
                <Button variant="outline" size="sm" className="gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Create Task
                </Button>
              </div>
            )}
          </Card>

          <div className="mt-6 flex justify-end">
            <Button className="gap-2 border border-input bg-card text-foreground hover:bg-muted hover:text-foreground">
              + Add New Task
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] overflow-hidden p-0 sm:max-w-lg">
          <AIEditSidebar />
        </DialogContent>
      </Dialog>
    </ShellPage>
  );
}
