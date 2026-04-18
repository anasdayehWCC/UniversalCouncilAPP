'use client';

import React, { use, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useDemo } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useReview } from '@/hooks/useReview';
import ReviewDetail from '@/components/review/ReviewDetail';

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = use(params);
  const { isReady, isAuthorized } = useRoleGuard(['manager', 'admin']);
  const { config } = useDemo();
  const {
    getItem,
    getFeedback,
    submitReview,
    addFeedback,
    resolveFeedback,
    replyToFeedback,
    isLoading,
  } = useReview();

  const item = getItem(id);
  const feedback = getFeedback(id);

  if (!isReady || !isAuthorized) {
    return null;
  }

  if (!item) {
    notFound();
  }

  const handleApprove = async () => {
    await submitReview(id, 'approve');
  };

  const handleReject = async () => {
    await submitReview(id, 'reject');
  };

  const handleRequestChanges = async () => {
    await submitReview(id, 'request_changes');
  };

  const handleAddFeedback = (fb: Parameters<typeof addFeedback>[1]) => {
    addFeedback(id, fb);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <Card
        className="p-6 border-none text-white"
        style={{ background: config.theme.gradient }}
      >
        <p className="text-sm uppercase tracking-wide opacity-80">Manager Review</p>
        <h1 className="text-2xl font-display font-bold">Review Details</h1>
        <p className="text-sm opacity-80">
          Review meeting minutes, provide feedback, and make approval decisions.
        </p>
      </Card>

      {/* Detail view */}
      <ReviewDetail
        item={item}
        feedback={feedback}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onAddFeedback={handleAddFeedback}
        onResolveFeedback={resolveFeedback}
        onReplyToFeedback={replyToFeedback}
        isLoading={isLoading}
      />
    </div>
  );
}
