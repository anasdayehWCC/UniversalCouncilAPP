'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Meeting } from '@/types/demo';

interface ChangesRequestedProps {
  items: Meeting[];
  onAction: (meeting: Meeting, action: 'approve' | 'return') => void;
}

export default function ChangesRequested({ items, onAction }: ChangesRequestedProps) {
  return (
    <div className="space-y-4">
      {items.map(item => (
        <Card key={item.id} className="p-6 border border-destructive/30 bg-destructive/10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                {item.title}
                <Badge variant="destructive">Changes Requested</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{item.summary || 'Awaiting notes'}</p>
            </div>
            <Button variant="outline" onClick={() => onAction(item, 'approve')}>
              Mark Approved
            </Button>
          </div>
        </Card>
      ))}
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
