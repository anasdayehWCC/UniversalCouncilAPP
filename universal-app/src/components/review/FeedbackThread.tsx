'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  Send,
  Check,
  Reply,
  AtSign,
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
  HelpCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dates';
import {
  ReviewFeedback,
  FeedbackReply,
  FeedbackType,
  FEEDBACK_TYPE_CONFIG,
} from '@/lib/review/types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FeedbackThreadProps {
  feedback: ReviewFeedback[];
  currentUserId: string;
  currentUserName: string;
  onAddFeedback: (feedback: Omit<ReviewFeedback, 'id' | 'createdAt' | 'replies'>) => void;
  onResolveFeedback: (feedbackId: string) => void;
  onReply: (feedbackId: string, reply: Omit<FeedbackReply, 'id' | 'createdAt'>) => void;
  section?: string;
  className?: string;
}

const FEEDBACK_ICONS: Record<FeedbackType, React.ElementType> = {
  suggestion: Lightbulb,
  required: AlertTriangle,
  praising: ThumbsUp,
  question: HelpCircle,
};

export default function FeedbackThread({
  feedback,
  currentUserId,
  currentUserName,
  onAddFeedback,
  onResolveFeedback,
  onReply,
  section,
  className,
}: FeedbackThreadProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [newComment, setNewComment] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [showAddForm, setShowAddForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const filteredFeedback = section
    ? feedback.filter(f => f.section === section)
    : feedback;

  const unresolvedCount = filteredFeedback.filter(f => !f.resolved).length;

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    onAddFeedback({
      reviewItemId: '',
      authorId: currentUserId,
      authorName: currentUserName,
      comment: newComment,
      section,
      type: feedbackType,
      resolved: false,
    });

    setNewComment('');
    setShowAddForm(false);
  };

  const handleReply = (feedbackId: string) => {
    if (!replyText.trim()) return;

    onReply(feedbackId, {
      feedbackId,
      authorId: currentUserId,
      authorName: currentUserName,
      comment: replyText,
    });

    setReplyText('');
    setReplyingTo(null);
  };

  const toggleThread = (feedbackId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(feedbackId)) {
        next.delete(feedbackId);
      } else {
        next.add(feedbackId);
      }
      return next;
    });
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            Feedback {section && `· ${section}`}
          </span>
          {unresolvedCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {unresolvedCount} unresolved
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1"
        >
          <MessageCircle className="w-4 h-4" />
          Add Feedback
        </Button>
      </div>

      {/* Add feedback form */}
      {showAddForm && (
        <Card
          className={cn(
            'p-4 border-slate-200',
            !prefersReducedMotion && 'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          {/* Type selector */}
          <div className="flex gap-2 mb-3">
            {(Object.keys(FEEDBACK_TYPE_CONFIG) as FeedbackType[]).map(type => {
              const config = FEEDBACK_TYPE_CONFIG[type];
              const Icon = FEEDBACK_ICONS[type];
              return (
                <Button
                  key={type}
                  variant={feedbackType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType(type)}
                  className={cn(
                    'gap-1',
                    feedbackType === type && type === 'required' && 'bg-red-600 hover:bg-red-700',
                    feedbackType === type && type === 'praising' && 'bg-green-600 hover:bg-green-700',
                    feedbackType === type && type === 'question' && 'bg-purple-600 hover:bg-purple-700'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Comment input */}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Type your feedback... Use @name to mention someone"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            />
            <Button onClick={handleSubmit} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Feedback list */}
      {filteredFeedback.length === 0 && !showAddForm && (
        <Card className="p-8 text-center border-dashed border-2">
          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No feedback yet</p>
        </Card>
      )}

      {filteredFeedback.map(item => {
        const config = FEEDBACK_TYPE_CONFIG[item.type];
        const Icon = FEEDBACK_ICONS[item.type];
        const isExpanded = expandedThreads.has(item.id);
        const hasReplies = item.replies && item.replies.length > 0;

        return (
          <Card
            key={item.id}
            className={cn(
              'border-l-4 transition-all',
              item.resolved ? 'border-l-green-400 bg-green-50/50' : `border-l-${item.type === 'required' ? 'red' : item.type === 'praising' ? 'green' : item.type === 'question' ? 'purple' : 'blue'}-400`,
              !prefersReducedMotion && 'hover:shadow-md'
            )}
          >
            <div className="p-4">
              {/* Feedback header */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600 flex-shrink-0">
                  {getInitials(item.authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-slate-900">{item.authorName}</span>
                    <Badge variant="outline" className={cn(config.bg, config.color, 'text-xs')}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    {item.resolved && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(item.createdAt)}
                    </span>
                  </div>
                  
                  {/* Referenced text */}
                  {item.highlightedText && (
                    <blockquote className="border-l-2 border-slate-200 pl-3 py-1 mb-2 text-sm text-slate-500 italic bg-slate-50 rounded-r">
                      &ldquo;{item.highlightedText}&rdquo;
                    </blockquote>
                  )}
                  
                  {/* Comment */}
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.comment}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {!item.resolved && item.type === 'required' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolveFeedback(item.id)}
                        className="text-green-600 hover:bg-green-50 gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark Resolved
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                      className="gap-1 text-slate-600"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </Button>
                    {hasReplies && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleThread(item.id)}
                        className="gap-1 text-slate-500"
                      >
                        {item.replies!.length} repl{item.replies!.length === 1 ? 'y' : 'ies'}
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply form */}
              {replyingTo === item.id && (
                <div
                  className={cn(
                    'mt-3 pl-11 flex gap-2',
                    !prefersReducedMotion && 'animate-in fade-in slide-in-from-top-1 duration-150'
                  )}
                >
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleReply(item.id)}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleReply(item.id)}
                    disabled={!replyText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Replies */}
              {hasReplies && isExpanded && (
                <div className="mt-3 pl-11 space-y-3 border-l-2 border-slate-100 ml-4">
                  {item.replies!.map(reply => (
                    <div key={reply.id} className="pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {getInitials(reply.authorName)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {reply.authorName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 ml-8">{reply.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
