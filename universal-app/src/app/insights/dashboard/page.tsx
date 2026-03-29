'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/context/DemoContext';
import { FlagGate } from '@/components/ui/flag-gate';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInsights } from '@/hooks/useInsights';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';
import { DOMAINS } from '@/config/domains';

/**
 * Enhanced Insights Dashboard Page
 * 
 * Provides comprehensive team performance analytics, adoption metrics,
 * and workload distribution visualizations for managers and admins.
 */
export default function InsightsDashboardPage() {
  useRoleGuard(['manager', 'admin']);
  
  const { meetings, domain, config, featureFlags, role, personas } = useDemo();
  
  const { data, filters, setFilters, exportToCsv, isLoading } = useInsights({
    meetings,
    personas,
    currentDomain: domain,
  });

  // Build domain options for filters
  const domainOptions = useMemo(() => {
    return Object.entries(DOMAINS).map(([key, cfg]) => ({
      value: key,
      label: cfg.name,
    }));
  }, []);

  // Build user options for filters
  const userOptions = useMemo(() => {
    return Object.values(personas).map(p => ({
      value: p.id,
      label: p.name,
    }));
  }, [personas]);

  return (
    <FlagGate
      flag="aiInsights"
      featureFlags={featureFlags}
      title="AI Insights disabled"
      message="AI Insights is currently disabled. Enable it in Admin to unlock advanced analytics."
      tone="warning"
      actions={
        <>
          {role === 'admin' && (
            <Link href="/admin">
              <Button className="bg-white/10 text-white border border-white/30 hover:bg-white/20">
                Open Admin
              </Button>
            </Link>
          )}
          <Link href="/insights">
            <Button variant="outline" className="bg-card text-foreground">
              Basic View
            </Button>
          </Link>
        </>
      }
    >
      <InsightsDashboard
        data={data}
        filters={filters}
        onFiltersChange={setFilters}
        onExport={exportToCsv}
        isLoading={isLoading}
        domains={domainOptions}
        users={userOptions}
        headerGradient={config.theme.gradient}
        headerTitle="Team Performance Dashboard"
        headerSubtitle={`Analytics and insights for ${config.name}`}
      />
    </FlagGate>
  );
}
