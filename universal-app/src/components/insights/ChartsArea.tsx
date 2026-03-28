'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/dates';

interface ChartsAreaProps {
  counts: {
    total: number;
    templateCounts: Record<string, number>;
    roleBreakdown: Record<string, number>;
    activityBySubmitter: Record<string, { count: number; last: string | null }>;
  };
  templateNameMap?: Record<string, string>;
}

type ActivityStatus = 'high' | 'medium' | 'low';

interface ActivityRowProps {
  name: string;
  count: number;
  status: ActivityStatus;
  last?: string | null;
}

function ActivityRow({ name, count, status, last }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
          {name.charAt(0)}
        </div>
        <span className="font-medium text-slate-900">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${status === 'high' ? 'bg-green-500' : status === 'medium' ? 'bg-blue-500' : 'bg-yellow-500'}`}
            style={{ width: `${(count / 20) * 100}%` }}
          />
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-600 block">{count}</span>
          {last && <span className="text-[11px] text-slate-500 block">Last {formatDateTime(last)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChartsArea({ counts, templateNameMap }: ChartsAreaProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card variant="glass" className="p-6 bg-white/80" hoverEffect={false}>
        <h3 className="font-bold text-lg text-slate-900 mb-6 font-display">Minutes by Type</h3>
        <div className="h-64 flex items-end justify-between gap-4 px-4">
          {Object.entries(counts.templateCounts).map(([templateId, ct]) => (
            <div key={templateId} className="w-full bg-blue-100 rounded-t-lg relative group">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-600 rounded-t-lg transition-all duration-500 group-hover:bg-blue-700 shadow-lg"
                style={{ height: `${Math.min(100, (ct / Math.max(1, counts.total)) * 100)}%` }}
              />
              <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-slate-500 font-medium">
                {templateNameMap?.[templateId] || templateId}
              </div>
            </div>
          ))}
          {Object.keys(counts.templateCounts).length === 0 && (
            <div className="text-sm text-slate-500">No data for selected scope.</div>
          )}
        </div>
      </Card>

      <Card variant="glass" className="p-6 bg-white/80" hoverEffect={false}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900 font-display">Team Activity</h3>
          <div className="flex gap-2">
             {Object.entries(counts.roleBreakdown).map(([role, count]) => (
               <Badge key={role} variant="secondary" className="capitalize text-xs">
                 {role.replace('_', ' ')}: {count}
               </Badge>
             ))}
          </div>
        </div>
        <div className="space-y-6">
          {Object.entries(counts.activityBySubmitter).map(([name, data]) => (
            <ActivityRow
              key={name}
              name={name}
              count={data.count}
              status={data.count > 6 ? 'high' : data.count > 3 ? 'medium' : 'low'}
              last={data.last}
            />
          ))}
          {Object.keys(counts.activityBySubmitter).length === 0 && (
            <p className="text-sm text-slate-500">No submissions yet in this scope.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
