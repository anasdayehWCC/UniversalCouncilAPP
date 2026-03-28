import { useMemo } from 'react';
import { Meeting } from '@/types/demo';
import { PersonaMetadata } from '@/config/personas';

export interface MeetingMetrics {
  total: number;
  ready: number;
  approved: number;
  processing: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  noneRisk: number;
  avgDurationMin: number | null;
  complianceRate: number;
  activityBySubmitter: Record<string, { count: number; last: string | null }>;
  roleBreakdown: Record<string, number>;
  templateCounts: Record<string, number>;
}

export function useMeetingMetrics(meetings: Meeting[], personas?: Record<string, PersonaMetadata>) {
  return useMemo((): MeetingMetrics => {
    const total = meetings.length;
    const ready = meetings.filter(m => m.status === 'ready').length;
    const approved = meetings.filter(m => m.status === 'approved').length;
    const processing = meetings.filter(m => m.status === 'processing').length;
    const highRisk = meetings.filter(m => m.riskScore === 'high').length;
    const mediumRisk = meetings.filter(m => m.riskScore === 'medium').length;
    const lowRisk = meetings.filter(m => m.riskScore === 'low').length;
    const noneRisk = total - (highRisk + mediumRisk + lowRisk);

    const toMinutes = (s: string): number | null => {
      if (!s) return null;
      const lower = s.toLowerCase();
      if (lower.includes('processing')) return null;

      if (lower.includes(':')) {
        const parts = lower.split(':').map(Number);
        if (parts.every(p => Number.isFinite(p))) {
          if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
          if (parts.length === 2) return parts[0] + parts[1] / 60;
        }
      }

      const hMatch = lower.match(/(\d+(?:\.\d+)?)\s*h/);
      const mMatch = lower.match(/(\d+(?:\.\d+)?)\s*m/);
      if (hMatch || mMatch) {
        const hours = hMatch ? Number(hMatch[1]) : 0;
        const mins = mMatch ? Number(mMatch[1]) : 0;
        const totalMins = hours * 60 + mins;
        return Number.isFinite(totalMins) ? totalMins : null;
      }

      const numMatch = lower.match(/(\d+(?:\.\d+)?)/);
      return numMatch ? Number(numMatch[1]) : null;
    };

    const numericDurations = meetings
      .map(m => toMinutes(m.duration))
      .filter((val): val is number => val !== null);
    const avgDurationMin =
      numericDurations.length === 0
        ? null
        : Math.round((numericDurations.reduce((sum, v) => sum + v, 0) / numericDurations.length) * 10) / 10;
    const complianceRate = total === 0 ? 0 : Math.round(((approved + ready) / total) * 100);

    const activityBySubmitter = meetings.reduce<Record<string, { count: number; last: string | null }>>((acc, m) => {
      const persona = m.submittedById && personas ? personas[m.submittedById] : undefined;
      const key = persona?.name || m.submittedBy || 'Unattributed';
      acc[key] = acc[key] || { count: 0, last: null };
      acc[key].count += 1;
      acc[key].last = m.submittedAt || acc[key].last;
      return acc;
    }, {});

    // Create a map of name -> role for efficient lookup
    const nameToRole: Record<string, string> = {};
    if (personas) {
      Object.values(personas).forEach(p => {
        nameToRole[p.name] = p.role;
      });
    }

    const roleBreakdown = meetings.reduce<Record<string, number>>((acc, m) => {
      const role =
        (m.submittedById && personas?.[m.submittedById]?.role) ||
        (m.submittedBy && nameToRole[m.submittedBy]) ||
        'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const templateCounts = meetings.reduce<Record<string, number>>((acc, m) => {
      acc[m.templateId] = (acc[m.templateId] || 0) + 1;
      return acc;
    }, {});

    return { total, ready, approved, processing, highRisk, mediumRisk, lowRisk, noneRisk, avgDurationMin, complianceRate, activityBySubmitter, roleBreakdown, templateCounts };
  }, [meetings, personas]);
}
