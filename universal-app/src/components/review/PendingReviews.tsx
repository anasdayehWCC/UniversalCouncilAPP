'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, FileText, Shield } from 'lucide-react';
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
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 overflow-hidden relative">
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
	                  <Badge variant="outline" className={cn(
	                    item.status === 'flagged'
	                      ? "bg-red-50 text-red-700 border-red-200"
	                      : "bg-green-50 text-green-700 border-green-200"
	                  )}>
	                    {item.status === 'flagged' ? 'Changes Requested' : 'Ready for Review'}
	                  </Badge>
                  {item.riskScore && (
                    <Badge variant="outline" className={cn(
                      item.riskScore === 'high' ? "bg-red-50 text-red-700 border-red-200" :
                      item.riskScore === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      Risk: {item.riskScore}
                    </Badge>
                  )}
                  {item.processingMode && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                      {item.processingMode === 'fast' ? 'Fast Mode' : 'Economy'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  Submitted by <span className="font-medium text-slate-900">{item.submittedBy || 'Auto-upload'}</span> • {item.submittedAt ? formatDateTime(item.submittedAt) : 'just now'}
                  {(() => {
                    const sla = getSLAStatus(item.submittedAt);
                    return (
                      <span className={cn("ml-2 text-xs font-medium px-1.5 py-0.5 rounded", sla.bg, sla.color)}>
                        {sla.label}
                      </span>
                    );
                  })()}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <Clock className="w-3 h-3" /> {item.duration}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <FileText className="w-3 h-3" /> {item.templateId}
                  </span>
                  {item.tags && item.tags.length > 0 && (
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <Shield className="w-3 h-3" /> {item.tags.slice(0,2).join(', ')}
                    </span>
                  )}
                </div>
                {item.lastAction && (
                <p className="text-xs text-slate-500 mt-2">
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
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-slate-200"
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
