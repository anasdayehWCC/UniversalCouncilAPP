'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle2, type LucideIcon, Activity, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/context/DemoContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FlagGate } from '@/components/ui/flag-gate';
import { useMeetingMetrics } from '@/hooks/useMeetingMetrics';

import { useRoleGuard } from '@/hooks/useRoleGuard';
import dynamic from 'next/dynamic';

const ChartsArea = dynamic(() => import('@/components/insights/ChartsArea'), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card variant="glass" className="p-6 bg-white/80 h-64 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
        <div className="h-full bg-slate-100 rounded" />
      </Card>
      <Card variant="glass" className="p-6 bg-white/80 h-64 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
        </div>
      </Card>
    </div>
  ),
  ssr: false
});

export default function InsightsPage() {
  useRoleGuard(['manager', 'admin']);
  const { meetings, domain, config, featureFlags, role, personas, templates } = useDemo();
  const canViewAllScope = role !== 'social_worker';
  const [scope, setScope] = useState<'current' | 'all'>('current');

  const filteredMeetings = useMemo(() => {
    return scope === 'all' ? meetings : meetings.filter(m => m.domain === domain);
  }, [scope, meetings, domain]);

  const counts = useMeetingMetrics(filteredMeetings, personas);
  const templateNameMap = useMemo(() => {
    return Object.fromEntries(templates.map(t => [t.id, t.name]));
  }, [templates]);

  const handleExport = () => {
    const headers = ['ID', 'Title', 'Date', 'Status', 'Risk Score', 'Submitted By', 'Domain'];
    const rows = filteredMeetings.map(m => [
      m.id,
      `"${m.title.replace(/"/g, '""')}"`, // Escape quotes
      m.date,
      m.status,
      m.riskScore || 'N/A',
      m.submittedBy,
      m.domain
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `insights_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <FlagGate
      flag="aiInsights"
      featureFlags={featureFlags}
      title="AI Insights disabled"
      message="Priya has turned off AI Insights for this demo. Enable it in Admin to unlock trend visualisations."
      tone="warning"
	      actions={
	        <>
	          {role === 'admin' && (
	            <Link href="/admin">
	              <Button className="bg-white/10 text-white border border-white/30 hover:bg-white/20">Open Admin</Button>
	            </Link>
	          )}
	          <Link href="/review-queue">
	            <Button variant="outline" className="bg-white text-slate-900">Go to Review Queue</Button>
	          </Link>
	        </>
	      }
    >
      <div className="space-y-8">
      <Card variant="glass" className="p-6 border-none text-white relative overflow-hidden" style={{ background: config.theme.gradient }} hoverEffect={false}>
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-10">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-80 font-medium">Analytics</p>
            <h1 className="text-3xl font-display font-bold mt-1 mb-2">Team Insights</h1>
            <p className="text-base opacity-90">Performance metrics and usage analytics for {config.name}.</p>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/insights/dashboard">
              <Button 
                variant="ghost"
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Full Dashboard
              </Button>
            </Link>
            {canViewAllScope ? (
              <Select value={scope} onValueChange={(v: 'current' | 'all') => setScope(v)}>
                <SelectTrigger className="w-[200px] bg-white text-slate-900 border-0 shadow-lg">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">{config.name} only</SelectItem>
                  <SelectItem value="all">All domains</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className="bg-white/10 text-white border-white/30 backdrop-blur-md">Scope: {config.name}</Badge>
            )}
            <Button 
              className="bg-white text-slate-900 hover:bg-white/90 shadow-lg border-0 font-semibold"
              onClick={handleExport}
            >
              Export Report
            </Button>
          </div>
        </div>
        <div className="info-rail mt-6 relative z-10">
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            Approved {counts.approved}
          </span>
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
            Processing {counts.processing}
          </span>
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
            High Risk {counts.highRisk}
          </span>
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: '#0ea5e9', boxShadow: '0 0 8px #0ea5e9' }} />
            Compliance {counts.complianceRate}%
          </span>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Notes" 
          value={counts.total.toString()} 
          trend={`${counts.processing} processing`} 
          icon={FileTextIcon} 
          color="blue"
        />
        <MetricCard 
          title="Avg. Duration" 
          value={counts.avgDurationMin !== null ? `${counts.avgDurationMin} mins` : '—'} 
          trend={`${counts.processing} in queue`} 
          icon={Clock} 
          color="green"
        />
        <MetricCard 
          title="Ready for Review" 
          value={counts.ready.toString()} 
          trend={`${counts.approved} approved`} 
          icon={CheckCircle2} 
          color="purple"
        />
        <MetricCard 
          title="High Risk Items" 
          value={counts.highRisk.toString()} 
          trend={`${counts.mediumRisk} medium`} 
          icon={Activity} 
          color="orange"
        />
      </div>

      <Card variant="glass" className="p-4 flex items-center gap-3 bg-white/80" hoverEffect={false}>
        <span className="text-sm font-semibold text-slate-700">Risk distribution</span>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High {counts.highRisk}</Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Med {counts.mediumRisk}</Badge>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Low {counts.lowRisk}</Badge>
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">None {counts.noneRisk}</Badge>
        <div className="ml-auto text-xs text-slate-500">Scope: {scope === 'all' ? 'All domains' : config.name}</div>
      </Card>

      {/* Charts Area */}
      <ChartsArea counts={counts} templateNameMap={templateNameMap} />
    </div>
    </FlagGate>
  );
}

 type MetricColor = 'blue' | 'green' | 'purple' | 'orange';

 interface MetricCardProps {
   title: string;
   value: string;
   trend: string;
   icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
   color: MetricColor;
 }

 function MetricCard({ title, value, trend, icon: Icon, color }: MetricCardProps) {
   const colors = {
     blue: 'bg-blue-50 text-blue-600',
     green: 'bg-green-50 text-green-600',
     purple: 'bg-purple-50 text-purple-600',
     orange: 'bg-orange-50 text-orange-600',
   };

   return (
     <Card variant="glass" className="p-6 hover:shadow-xl transition-all bg-white/80" hoverEffect>
       <div className="flex justify-between items-start mb-4">
         <div className={`p-3 rounded-xl ${colors[color as keyof typeof colors]} shadow-sm`}>
           <Icon className="w-5 h-5" />
         </div>
         <span className={`text-xs font-bold px-2 py-1 rounded-full border ${trend.includes('+') ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
           {trend}
         </span>
       </div>
       <h3 className="text-3xl font-bold text-slate-900 mb-1 font-display">{value}</h3>
       <p className="text-sm text-slate-500 font-medium">{title}</p>
     </Card>
   );
 }

 const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
   return (
     <svg
       {...props}
       xmlns="http://www.w3.org/2000/svg"
       width="24"
       height="24"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth="2"
       strokeLinecap="round"
       strokeLinejoin="round"
     >
       <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
       <polyline points="14 2 14 8 20 8" />
       <line x1="16" x2="8" y1="13" y2="13" />
       <line x1="16" x2="8" y1="17" y2="17" />
       <line x1="10" x2="8" y1="9" y2="9" />
     </svg>
   );
 };
