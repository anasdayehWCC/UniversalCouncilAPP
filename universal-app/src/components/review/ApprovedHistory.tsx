'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Meeting } from '@/types/demo';
import { formatDateTime } from '@/lib/dates';

interface ApprovedHistoryProps {
  items: Meeting[];
  filteredQueueLength: number;
}

export default function ApprovedHistory({ items, filteredQueueLength }: ApprovedHistoryProps) {
  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <Card className="p-12 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No approvals yet</h3>
          <p className="text-slate-500 mb-4">Actions you approve will appear here with timestamps.</p>
        </Card>
      )}
      {items.map(item => (
        <Card key={item.id} className="p-6 border border-green-200 bg-green-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600">
                Approved {item.lastActionAt ? formatDateTime(item.lastActionAt) : 'recently'} {item.lastActionBy ? `by ${item.lastActionBy}` : ''}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
          </div>
        </Card>
      ))}
      {filteredQueueLength === 0 && (
        <Card className="p-8 border-dashed border-2 border-slate-200 text-center bg-white">
          <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No items pending</h3>
          <p className="text-sm text-slate-500 mb-4">As soon as your team submits notes, they will appear here.</p>
          <div className="flex justify-center gap-2">
            <Link href="/my-notes">
              <Button>View team notes</Button>
            </Link>
            <Link href="/record">
              <Button variant="outline">Create a Smart Capture</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
