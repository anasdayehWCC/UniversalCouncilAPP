'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, FileText, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Meeting } from '@/types/demo';
import { cn } from '@/lib/utils';
import { formatDateTime, getSLAStatus } from '@/lib/dates';

interface PendingReviewsProps {
  items: Meeting[];
  onAction: (meeting: Meeting, action: 'approve' | 'return') => void;
}

export default function PendingReviews({ items, onAction }: PendingReviewsProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="p-6 hover:shadow-md transition-all border-slate-200 group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/30 overflow-hidden relative">
                {(() => {
                   // We need to import PERSONAS or pass it. Since this is a client component, we can import it.
                   // But wait, PERSONAS is in config.
                   // Let's try to find the user.
                   // Actually, better to just use the fallback if we don't want to import the huge config here.
                   // But for quality, we should.
                   return (item.submittedBy || 'Auto-upload').split(' ').map(n => n[0]).join('');
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                  {(() => {
                    const allBadges = [
                      <Badge key="status" variant="outline" className={cn(
                        item.status === 'flagged'
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-success/10 text-success border-success/30"
                      )}>
                        {item.status === 'flagged' ? 'Changes Requested' : 'Ready for Review'}
                      </Badge>,
                      ...(item.riskScore ? [
                        <Badge key="risk" variant="outline" className={cn(
                          item.riskScore === 'high' ? "bg-destructive/10 text-destructive border-destructive/30" :
                          item.riskScore === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {item.riskScore === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          Risk: {item.riskScore}
                        </Badge>
                      ] : []),
                      ...(item.processingMode ? [
                        <Badge key="mode" variant="secondary" className="bg-muted text-muted-foreground border-border">
                          {item.processingMode === 'fast' ? 'Fast Mode' : 'Economy'}
                        </Badge>
                      ] : []),
                    ];
                    const visibleBadges = allBadges.slice(0, 3);
                    const hiddenCount = allBadges.length - 3;
                    return (
                      <>
                        {visibleBadges}
                        {hiddenCount > 0 && (
                          <Badge variant="outline" className="text-muted-foreground text-xs">+{hiddenCount}</Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2 flex-wrap">
                  <span>
                    Submitted by <span className="font-medium text-foreground">{item.submittedBy || 'Auto-upload'}</span> • {item.submittedAt ? formatDateTime(item.submittedAt) : 'just now'}
                  </span>
                  {(() => {
                    const sla = getSLAStatus(item.submittedAt);
                    return sla.isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                        <Clock className="w-3 h-3" />
                        {sla.label}
                      </span>
                    ) : (
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded bg-muted", sla.color)}>
                        {sla.label}
                      </span>
                    );
                  })()}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                    <Clock className="w-3 h-3" /> {item.duration}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <FileText className="w-3 h-3" /> {item.templateId}
                  </span>
                  {item.tags && item.tags.length > 0 && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded border border-border">
                      <Shield className="w-3 h-3" /> {item.tags.slice(0,2).join(', ')}
                    </span>
                  )}
                </div>
                {item.lastAction && (
                <p className="text-xs text-muted-foreground mt-2">
                    Last action: {item.lastAction} {item.lastActionAt ? formatDateTime(item.lastActionAt) : 'just now'} {item.lastActionBy ? `by ${item.lastActionBy}` : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[140px]">
	              <Link href={`/my-notes/${item.id}`}>
	                <Button className="w-full shadow-sm">
	                  Review Note
	                </Button>
	              </Link>
              <div className="flex gap-2">
                <Button 
                  aria-label="Approve note"
                  title="Approve note"
                  variant="outline" 
                  className="flex-1 text-success hover:text-success hover:bg-success/10 border-border"
                  onClick={() => onAction(item, 'approve')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button 
                  aria-label="Return for changes"
                  title="Return for changes"
                  variant="outline" 
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200"
                  onClick={() => onAction(item, 'return')}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <Card className="p-12 text-center border-dashed border-2">
          <h3 className="text-lg font-bold text-slate-900">No items match this filter</h3>
          <p className="text-slate-500">Try switching filters or wait for new submissions.</p>
        </Card>
      )}
    </div>
  );
}
