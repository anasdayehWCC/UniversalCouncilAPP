'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MessageSquare, Clock, RotateCcw } from 'lucide-react';
import { Meeting } from '@/types/demo';
import { formatDateTime } from '@/lib/dates';

/**
 * Mock return reasons keyed by meeting ID.
 * In production these would come from the API alongside the review action history.
 */
const MOCK_RETURN_REASONS: Record<string, { reason: string; cycleCount: number }> = {};

function getReturnDetails(item: Meeting): { reason: string; cycleCount: number } {
  // Use cached mock data if present
  if (MOCK_RETURN_REASONS[item.id]) return MOCK_RETURN_REASONS[item.id];

  // Derive a contextual reason from the meeting metadata
  const reasons = [
    'Please add more detail about the safeguarding concerns raised.',
    'Risk assessment section is incomplete — please expand.',
    'Missing attendee confirmation and action items.',
    'Terminology needs clarification for compliance review.',
  ];
  const idx = Math.abs(item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % reasons.length;

  const result = {
    reason: reasons[idx],
    // In a real app, cycleCount would be tracked via an action history log
    cycleCount: 1,
  };

  MOCK_RETURN_REASONS[item.id] = result;
  return result;
}

interface ChangesRequestedProps {
  items: Meeting[];
  onAction: (meeting: Meeting, action: 'approve' | 'return') => void;
}

export default function ChangesRequested({ items, onAction }: ChangesRequestedProps) {
  return (
    <div className="space-y-4">
      {items.map(item => {
        const { reason, cycleCount } = getReturnDetails(item);

        return (
          <Card key={item.id} className="p-6 border border-destructive/30 bg-destructive/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <Badge variant="destructive">Changes Requested</Badge>
                  {cycleCount > 1 && (
                    <Badge variant="outline" className="text-muted-foreground border-border gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Returned {cycleCount}x
                    </Badge>
                  )}
                </div>

                {/* Return reason */}
                <div className="flex items-start gap-2 mt-2 p-3 rounded-md bg-card border border-border">
                  <MessageSquare className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.lastActionBy || 'Reviewer'}:
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{reason}</p>
                  </div>
                </div>

                {/* Metadata row: returned date */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Returned {item.lastActionAt ? formatDateTime(item.lastActionAt) : 'recently'}
                  </span>
                  {item.submittedBy && (
                    <span>
                      Author: <span className="font-medium text-foreground">{item.submittedBy}</span>
                    </span>
                  )}
                </div>
              </div>

              <Button variant="outline" className="shrink-0" onClick={() => onAction(item, 'approve')}>
                Mark Approved
              </Button>
            </div>
          </Card>
        );
      })}
      {items.length === 0 && (
        <Card className="p-12 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No items requiring changes</h3>
          <p className="text-muted-foreground">Great job! Your team is on track.</p>
        </Card>
      )}
    </div>
  );
}
