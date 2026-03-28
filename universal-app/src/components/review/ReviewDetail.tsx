'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Calendar,
  MessageCircle,
  Shield,
  Play,
  Pause,
  Eye,
  Download,
  Share,
  History,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDistanceToNow } from '@/lib/dates';
import {
  ReviewItem,
  ReviewFeedback,
  REVIEW_STATUS_CONFIG,
  PRIORITY_CONFIG,
  getSlaRemaining,
} from '@/lib/review/types';
import { useDemo } from '@/context/DemoContext';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import FeedbackThread from './FeedbackThread';

interface ReviewDetailProps {
  item: ReviewItem;
  feedback: ReviewFeedback[];
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
  onAddFeedback: (feedback: Omit<ReviewFeedback, 'id' | 'createdAt' | 'replies'>) => void;
  onResolveFeedback: (feedbackId: string) => void;
  onReplyToFeedback: (feedbackId: string, reply: { feedbackId: string; authorId: string; authorName: string; comment: string }) => void;
  isLoading?: boolean;
}

export default function ReviewDetail({
  item,
  feedback,
  onApprove,
  onReject,
  onRequestChanges,
  onAddFeedback,
  onResolveFeedback,
  onReplyToFeedback,
  isLoading = false,
}: ReviewDetailProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { currentUser, config } = useDemo();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const statusConfig = REVIEW_STATUS_CONFIG[item.status];
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const slaStatus = getSlaRemaining(item.submittedAt);

  const unresolvedCount = feedback.filter(f => !f.resolved).length;
  const requiredChanges = feedback.filter(f => f.type === 'required' && !f.resolved);

  // Extract sections from meeting summary (mock)
  const sections = useMemo(() => {
    return [
      { id: 'summary', title: 'Summary', content: item.minute.summary || 'No summary available.' },
      { id: 'family-context', title: 'Family Context', content: 'Family composition and relevant background information.' },
      { id: 'observations', title: 'Observations', content: 'Key observations from the visit.' },
      { id: 'safeguarding', title: 'Safeguarding Concerns', content: 'Any safeguarding risks identified and actions taken.' },
      { id: 'actions', title: 'Actions & Next Steps', content: 'Follow-up actions and responsibilities.' },
    ];
  }, [item.minute.summary]);

  const handleSectionFeedback = (section: string) => {
    setSelectedSection(selectedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/review-queue">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{item.minute.title}</h1>
              <Badge variant="outline" className={cn(statusConfig.bg, statusConfig.color, statusConfig.border)}>
                {statusConfig.label}
              </Badge>
              {item.priority !== 'normal' && (
                <Badge variant="outline" className={cn(priorityConfig.bg, priorityConfig.color)}>
                  {item.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {priorityConfig.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {item.author.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateTime(item.submittedAt)}
              </span>
              <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', slaStatus.color, slaStatus.isOverdue ? 'bg-red-50' : 'bg-slate-50')}>
                <Clock className="w-3 h-3" />
                {slaStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Alert for required changes */}
      {requiredChanges.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">
              {requiredChanges.length} required change{requiredChanges.length !== 1 ? 's' : ''} before approval
            </span>
          </div>
          <ul className="text-sm text-red-700 pl-7 space-y-1">
            {requiredChanges.map(f => (
              <li key={f.id}>{f.comment}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Minute content - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 overflow-hidden">
            {/* Minute header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{item.minute.templateId}</p>
                  <p className="text-xs text-slate-500">{item.minute.duration} · {item.minute.attendees?.length || 0} attendees</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Audio playback mock */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="gap-1"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play Audio'}
                </Button>
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sections */}
            <div className="p-6 space-y-6">
              {sections.map(section => {
                const sectionFeedback = feedback.filter(f => f.section === section.id);
                const hasUnresolved = sectionFeedback.some(f => !f.resolved);

                return (
                  <div
                    key={section.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      selectedSection === section.id
                        ? 'border-blue-300 bg-blue-50/50'
                        : hasUnresolved
                        ? 'border-orange-200 bg-orange-50/30'
                        : 'border-slate-100 hover:border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{section.title}</h3>
                      <div className="flex items-center gap-2">
                        {sectionFeedback.length > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              hasUnresolved
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            )}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {sectionFeedback.length}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSectionFeedback(section.id)}
                          className={cn(
                            'gap-1 text-xs',
                            selectedSection === section.id && 'bg-blue-100 text-blue-700'
                          )}
                        >
                          <Edit3 className="w-3 h-3" />
                          {selectedSection === section.id ? 'Close' : 'Comment'}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>

                    {/* Inline feedback for section */}
                    {selectedSection === section.id && (
                      <div
                        className={cn(
                          'mt-4 pt-4 border-t border-slate-200',
                          !prefersReducedMotion && 'animate-in fade-in slide-in-from-top-2 duration-200'
                        )}
                      >
                        <FeedbackThread
                          feedback={sectionFeedback}
                          currentUserId={currentUser.id}
                          currentUserName={currentUser.name}
                          onAddFeedback={fb => onAddFeedback({ ...fb, section: section.id, reviewItemId: item.id })}
                          onResolveFeedback={onResolveFeedback}
                          onReply={onReplyToFeedback}
                          section={section.id}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Risk / tags */}
            {(item.minute.riskScore || (item.minute.tags && item.minute.tags.length > 0)) && (
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {item.minute.riskScore && (
                    <div className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
                      item.minute.riskScore === 'high' ? 'bg-red-50 text-red-700' :
                      item.minute.riskScore === 'medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    )}>
                      <Shield className="w-4 h-4" />
                      Risk: {item.minute.riskScore}
                    </div>
                  )}
                  {item.minute.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-4">
          {/* Decision panel */}
          <Card className="p-4 border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Review Decision</h3>

            {unresolvedCount > 0 && item.status !== 'approved' && (
              <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-sm text-orange-700">
                  {unresolvedCount} unresolved feedback item{unresolvedCount !== 1 ? 's' : ''} 
                  {requiredChanges.length > 0 && ` (${requiredChanges.length} required)`}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={onApprove}
                disabled={isLoading || requiredChanges.length > 0}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={onRequestChanges}
                disabled={isLoading}
              >
                <AlertTriangle className="w-4 h-4" />
                Request Changes
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onReject}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
          </Card>

          {/* Author info */}
          <Card className="p-4 border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Submitted By</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                {item.author.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-medium text-slate-900">{item.author.name}</p>
                <p className="text-sm text-slate-500">{item.author.team}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600">
              <p>Submitted {formatDistanceToNow(item.submittedAt)}</p>
            </div>
          </Card>

          {/* All feedback */}
          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">All Feedback</h3>
              <Badge variant="secondary">{feedback.length}</Badge>
            </div>
            <FeedbackThread
              feedback={feedback}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              onAddFeedback={fb => onAddFeedback({ ...fb, reviewItemId: item.id })}
              onResolveFeedback={onResolveFeedback}
              onReply={onReplyToFeedback}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
