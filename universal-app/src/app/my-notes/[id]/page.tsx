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
    <div className="flex h-[calc(100vh-6rem)] -m-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-white/80 backdrop-blur-md flex-shrink-0 shadow-sm z-10 animate-in fade-in slide-in-from-top-2 duration-500">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/my-notes" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> My Notes
              </Link>
              <span className="opacity-30">/</span>
              <span className="font-medium text-slate-900 truncate max-w-[300px]">{meeting.title}</span>
            </nav>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                {template?.name || 'General Meeting'}
              </Badge>
              <Badge variant="outline" className={cn(
                "capitalize",
                meeting.status === 'draft' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                meeting.status === 'processing' ? "bg-blue-50 text-blue-700 border-blue-200" :
                meeting.status === 'ready' ? "bg-green-50 text-green-700 border-green-200" :
                meeting.status === 'flagged' ? "bg-red-50 text-red-700 border-red-200" :
                "bg-slate-50 text-slate-700 border-slate-200"
              )}>
                {meeting.status === 'flagged' ? 'Changes Requested' : meeting.status.replace('_', ' ')}
              </Badge>
              {meeting.riskScore && (
                <Badge variant="outline" className={cn(
                  "capitalize",
                  meeting.riskScore === 'high' ? "bg-red-50 text-red-700 border-red-200" :
                  meeting.riskScore === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}>
                  Risk: {meeting.riskScore}
                </Badge>
              )}
              {meeting.processingMode && (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                  Mode: {meeting.processingMode === 'fast' ? 'Fast' : 'Economy'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">{meeting.title}</h1>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(meeting.date)} at {formatTime(meeting.date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {meeting.duration}
                </div>
                {(meeting.uploadedAt || meeting.submittedAt) && (
                  <div className="flex items-center gap-2 text-xs px-2 py-1 bg-slate-100 rounded-full border border-slate-200">
                    Submitted {formatDate(meeting.uploadedAt || meeting.submittedAt || meeting.date)}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {meeting.attendees.map((a, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={a}>
                        {a.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span>{meeting.attendees.length} Attendees</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
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
        <div className="px-8 pt-6 pb-0 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex gap-8">
            <button 
              onClick={() => {
                console.log('Switching to summary');
                setActiveTab('summary');
              }}
              className={cn(
                "pb-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2",
                activeTab === 'summary' 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
                "pb-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2",
                activeTab === 'transcript' 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
                "pb-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2",
                activeTab === 'tasks' 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
              <span className="ml-1 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">
                {meeting.tasks.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className={cn("max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500", activeTab !== 'summary' && "hidden")}>
            <Card variant="glass" className="rounded-xl border border-slate-200 shadow-sm p-8 min-h-[600px] bg-white/80" hoverEffect={false}>
              {/* Render Summary with Markdown-like parsing for bold headers */}
              {meeting.summary.split('\n\n').map((block, i) => {
                const isHeader = block.startsWith('**');
                if (isHeader) {
                  const match = block.match(/\*\*(.*?)\*\*\n?([\s\S]*)/);
                  if (match) {
                    return (
                      <div key={i} className="mb-8 last:mb-0 group">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 font-display text-blue-900">
                          {match[1]}
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 text-xs text-blue-600 transition-opacity">
                            Regenerate
                          </Button>
                        </h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {match[2]}
                        </p>
                      </div>
                    );
                  }
                }
                
                return (
                  <div key={i} className="mb-8 last:mb-0">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{block}</p>
                  </div>
                );
              })}
            </Card>
          </div>

          <div className={cn("w-full h-[calc(100vh-18rem)] pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500", activeTab !== 'transcript' && "hidden")}>
            <TranscriptTab 
              recordingId={meeting.id} 
              legacyTranscript={meeting.transcript}
              duration={meeting.duration}
            />
          </div>

          <div className={cn("max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500", activeTab !== 'tasks' && "hidden")}>
            <Card variant="glass" className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white/80" hoverEffect={false}>
              {meeting.tasks.length > 0 ? meeting.tasks.map((task) => (
                <div key={task.id} className="p-4 border-b border-slate-100 last:border-0 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}>
                    {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {formatDate(task.dueDate)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">
                          {(personas[task.assigneeId]?.name || task.assigneeId).charAt(0).toUpperCase()}
                        </div>
                        Assigned to {personas[task.assigneeId]?.name || task.assigneeId}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "capitalize",
                    task.status === 'done' ? "bg-green-50 text-green-700 border-green-200" :
                    task.status === 'in_progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-50 text-slate-600 border-slate-200"
                  )}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-500">
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
                <Button className="gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
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
