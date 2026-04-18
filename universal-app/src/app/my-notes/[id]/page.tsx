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
  FileText, Mic, CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { formatDate, formatTime } from '@/lib/dates';

export default function MeetingDetailPage() {
  const params = useParams();
  const { meetings, templates, personas } = useDemo();
  const meeting = meetings.find(m => m.id === params.id);
  const template = templates.find(t => t.id === meeting?.templateId);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'tasks'>('summary');

  if (!meeting) {
    return <div className="p-12 text-center">Meeting not found</div>;
  }

  return (
    <div className="flex min-h-0 min-w-0">
      {/* Main Content Area — mr-80 makes room for the fixed AI sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/30 xl:mr-80">
        {/* Header */}
        <div className="px-4 sm:px-8 py-6 border-b border-border bg-card flex-shrink-0 shadow-sm z-10 animate-in fade-in slide-in-from-top-2 duration-500 motion-reduce:animate-none">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/my-notes" className="hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> My Notes
              </Link>
              <span className="opacity-30">/</span>
              <span className="font-medium text-foreground truncate max-w-[300px]">{meeting.title}</span>
            </nav>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-muted text-muted-foreground border-input">
                {template?.name || 'General Meeting'}
              </Badge>
              <Badge variant="outline" className={cn(
                "capitalize",
                meeting.status === 'draft' ? "bg-warning/10 text-warning border-warning/20" :
                meeting.status === 'processing' ? "bg-info/10 text-info border-info/20" :
                meeting.status === 'ready' ? "bg-success/10 text-success border-success/20" :
                meeting.status === 'flagged' ? "bg-destructive/10 text-destructive border-destructive/20" :
                "bg-muted text-foreground border-input"
              )}>
                {meeting.status === 'flagged' ? 'Changes Requested' : meeting.status.replace('_', ' ')}
              </Badge>
              {meeting.riskScore && (
                <Badge variant="outline" className={cn(
                  "capitalize",
                  meeting.riskScore === 'high' ? "bg-destructive/10 text-destructive border-destructive/20" :
                  meeting.riskScore === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}>
                  Risk: {meeting.riskScore}
                </Badge>
              )}
              {meeting.processingMode && (
                <Badge variant="outline" className="bg-muted text-foreground border-input">
                  Mode: {meeting.processingMode === 'fast' ? 'Fast' : 'Economy'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">{meeting.title}</h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(meeting.date)} at {formatTime(meeting.date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {meeting.duration}
                </div>
                {(meeting.uploadedAt || meeting.submittedAt) && (
                  <div className="flex items-center gap-2 text-xs px-2 py-1 bg-muted rounded-full border border-input">
                    Submitted {formatDate(meeting.uploadedAt || meeting.submittedAt || meeting.date)}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {meeting.attendees.map((a, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground" title={a}>
                        {a.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span>{meeting.attendees.length} Attendees</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button className="gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>


        {/* Custom Tabs Header */}
        <div className="px-4 sm:px-8 pt-6 pb-0 bg-card border-b border-border flex-shrink-0">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto">
            <button 
              onClick={() => {
                console.log('Switching to summary');
                setActiveTab('summary');
              }}
              className={cn(
                "pb-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap",
                activeTab === 'summary' 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              <FileText className="w-4 h-4" />
              Summary
            </button>
            <button 
              onClick={() => {
                console.log('Switching to transcript');
                setActiveTab('transcript');
              }}
              className={cn(
                "pb-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap",
                activeTab === 'transcript' 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              <Mic className="w-4 h-4" />
              Recording & Transcript
            </button>
            <button 
              onClick={() => {
                console.log('Switching to tasks');
                setActiveTab('tasks');
              }}
              className={cn(
                "pb-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap",
                activeTab === 'tasks' 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
              <span className="ml-1 bg-muted px-2 py-0.5 rounded-full text-xs font-bold text-muted-foreground">
                {meeting.tasks.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className={cn("max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none", activeTab !== 'summary' && "hidden")}>
            <Card variant="glass" className="rounded-xl border border-border shadow-sm p-8 min-h-[600px] bg-card/80" hoverEffect={false}>
              {/* Render Summary with Markdown-like parsing for bold headers */}
              {meeting.summary.split('\n\n').map((block, i) => {
                const isHeader = block.startsWith('**');
                if (isHeader) {
                  const match = block.match(/\*\*(.*?)\*\*\n?([\s\S]*)/);
                  if (match) {
                    return (
                      <div key={i} className="mb-8 last:mb-0 group">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2 font-display text-primary">
                          {match[1]}
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 text-xs text-primary transition-opacity">
                            Regenerate
                          </Button>
                        </h3>
                        <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                          {match[2]}
                        </p>
                      </div>
                    );
                  }
                }
                
                return (
                  <div key={i} className="mb-8 last:mb-0">
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{block}</p>
                  </div>
                );
              })}
            </Card>
          </div>

          <div className={cn("w-full min-h-0 h-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none", activeTab !== 'transcript' && "hidden")}>
            <TranscriptTab 
              recordingId={meeting.id} 
              legacyTranscript={meeting.transcript}
              duration={meeting.duration}
            />
          </div>

          <div className={cn("max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none", activeTab !== 'tasks' && "hidden")}>
            <Card variant="glass" className="rounded-xl border border-border shadow-sm overflow-hidden bg-card/80" hoverEffect={false}>
              {meeting.tasks.length > 0 ? meeting.tasks.map((task) => (
                <div key={task.id} className="p-4 border-b border-border last:border-0 flex items-center gap-4 hover:bg-muted/50 transition-colors group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${task.status === 'done' ? 'bg-success border-success text-white' : 'border-input hover:border-primary'}`}>
                    {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {formatDate(task.dueDate)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                          {(personas[task.assigneeId]?.name || task.assigneeId).charAt(0).toUpperCase()}
                        </div>
                        Assigned to {personas[task.assigneeId]?.name || task.assigneeId}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "capitalize",
                    task.status === 'done' ? "bg-success/10 text-success border-success/30" :
                    task.status === 'in_progress' ? "bg-info/10 text-info border-info/30" :
                    "bg-muted text-muted-foreground border-input"
                  )}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              )) : (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="mb-4">No tasks assigned for this meeting.</p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Create Task
                  </Button>
                </div>
              )}
            </Card>
            
            <div className="mt-6 flex justify-end">
                <Button className="gap-2 bg-card border border-input text-foreground hover:bg-muted hover:text-foreground">
                  + Add New Task
                </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Sidebar - Always visible */}
      <AIEditSidebar />
    </div>
  );
}
