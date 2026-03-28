'use client';

import React from 'react';
import { useDemo } from '@/context/DemoContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, Upload, FileText, CheckSquare,
  Clock, ArrowRight, Shield, Activity, Settings, Users
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTenantMetrics } from '@/lib/useTenantMetrics';
import { getApprovalsMetrics, getSyncStatus } from '@/lib/selectors';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';
import Image from 'next/image';
import { personaCopy } from '@/copy/strings';
import { formatDate, getSLAStatus } from '@/lib/dates';

export default function Dashboard() {
  const { role, currentUser, meetings, config, personas, updateMeetingStatus } = useDemo();
  const personaStrings = personaCopy[role];
  const { domainMeetings, drafts, dueToday } = useTenantMetrics(meetings, currentUser.domain);
  const isPractitioner = role === 'social_worker' || role === 'housing_officer';

  // --- Social Worker View ---
  if (isPractitioner) {
    const recentNotes = domainMeetings.slice(0, 3);
    
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Hero */}
        <Card variant="glass" className="p-6 border-none text-white relative overflow-hidden" style={{ background: config.theme.gradient }} hoverEffect={false}>
          <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-10">
            <div>
              <p className="text-sm uppercase tracking-wide opacity-80 font-medium">{personaStrings.heroRole}</p>
              <h1 className="text-4xl font-display font-bold mt-1 mb-2">Hi {currentUser.name.split(' ')[0]}</h1>
              <p className="text-base opacity-90">{personaStrings.heroGreeting}</p>
              <p className="text-xs uppercase tracking-wide text-white/60 mt-4 font-semibold">{personaStrings.heroSubtext}</p>
            </div>
            <div className="flex flex-col gap-4 items-end">
              <div className="info-rail justify-end">
                <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
                  <span className="info-rail__dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                  Drafts: {drafts}
                </span>
                <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
                  <span className="info-rail__dot" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                  Due today: {dueToday}
                </span>
                <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
                  <span className="info-rail__dot" style={{ background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                  Domain: {config.name}
                </span>
              </div>
              <div className="mt-2">
                <Link href="/record">
                  <Button className="bg-white text-slate-900 hover:bg-white/90 shadow-lg border-0 font-semibold">{personaStrings.heroCtaLabel}</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/record" className="group block h-full">
            <Card variant="glass" className="h-full p-6 hover:shadow-xl transition-all border-white/40 bg-white/60">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">New Recording</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Capture a visit or meeting. AI will draft your note instantly.</p>
            </Card>
          </Link>

          <Link href="/upload" className="group block h-full">
            <Card variant="glass" className="h-full p-6 hover:shadow-xl transition-all border-white/40 bg-white/60">
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Upload Audio</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Import existing recordings from your phone or dictaphone.</p>
            </Card>
          </Link>

          <Link href="/my-notes" className="group block h-full">
            <Card variant="glass" className="h-full p-6 hover:shadow-xl transition-all border-white/40 bg-white/60">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">My Notes</h3>
              <p className="text-sm text-slate-500 leading-relaxed">View and edit your recent case notes and minutes.</p>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <Link href="/my-notes" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-4">
            {recentNotes.length > 0 ? (
              recentNotes.map((note, index) => (
                <Link key={note.id} href={`/my-notes/${note.id}`} className="block animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                  <Card className="p-4 hover:bg-slate-50 transition-all duration-300 border-slate-200 flex items-center gap-4 group hover:shadow-md hover:border-blue-200">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-600 transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{note.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(note.date)}
                        </span>
                        <span>•</span>
                        <span>{note.duration}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "capitalize transition-colors",
                      note.status === 'draft' ? "bg-yellow-50 text-yellow-700 border-yellow-200 group-hover:bg-yellow-100" :
                      note.status === 'ready' ? "bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100" :
                      "bg-slate-50 text-slate-700 border-slate-200 group-hover:bg-slate-100"
                    )}>
                      {note.status.replace('_', ' ')}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed border-slate-300 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">No recent activity</h3>
                <p className="text-sm text-slate-500 mb-4">You haven&apos;t created any notes yet.</p>
                <Link href="/record">
                  <Button variant="outline" size="sm">Start a Recording</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

    // --- Manager View ---
  if (role === 'manager') {
    const reviewItems = meetings.filter(m => PENDING_REVIEW_STATUSES.includes(m.status) && m.domain === currentUser.domain);
    const contributors = new Set(reviewItems.map(m => m.submittedBy).filter(Boolean));
    const approvalsMetrics = getApprovalsMetrics(meetings, currentUser.domain);
    const syncStatus = getSyncStatus(meetings);
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
              {personaStrings.heroRole === 'Manager' ? 'Team Lead' : personaStrings.heroRole}
            </h1>
            <p className="text-slate-500">
              {currentUser.team} • <span className="font-bold text-slate-900">{approvalsMetrics.pending} items</span> require your attention in {config.name}.
            </p>
            <p className="text-sm text-slate-500 italic">{personaStrings.heroGreeting}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className={`px-2 py-1 rounded-full ${syncStatus.healthy ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-600'}`}>
              {syncStatus.label}
            </span>
            <span>Last sync: {syncStatus.lastSync}</span>
          </div>
        </div>

        {/* Manager Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/review-queue">
            <Card variant="glass" className="p-6 border-l-4 border-l-red-500 hover:shadow-xl transition-all cursor-pointer bg-white/80" hoverEffect>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-600 shadow-sm">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 shadow-sm">{approvalsMetrics.slaLabel}</Badge>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">Approvals Pending</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">{approvalsMetrics.pending} sign-offs queued.</p>
            </Card>
          </Link>

          <Link href="/insights">
            <Card variant="glass" className="p-6 border-l-4 border-l-blue-500 hover:shadow-xl transition-all cursor-pointer bg-white/80" hoverEffect>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">+12% vs last week</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">Team Activity</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">{domainMeetings.length} minutes generated</p>
            </Card>
          </Link>

          <Card variant="glass" className="p-6 border-l-4 border-l-slate-500 bg-white/80" hoverEffect={false}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-700 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-700 bg-white">Team Overview</Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-display">Team Overview</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">{contributors.size || 1} active submitters this week</p>
          </Card>
        </div>

        {/* Priority Review List */}
        <div>
	          <div className="flex items-center justify-between mb-6">
	            <h2 className="text-xl font-bold text-slate-900">Priority Reviews</h2>
	            <Link href="/review-queue">
	              <Button variant="outline" size="sm" className="gap-2 text-slate-600">
	                <CheckSquare className="w-4 h-4" />
	                Bulk Approve Low Risk
	              </Button>
	            </Link>
	          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

	            {reviewItems.slice(0, 5).map((meeting) => {
	              const submitter =
	                (meeting.submittedById && personas[meeting.submittedById]) ||
	                Object.values(personas).find(u => u.name === meeting.submittedBy);
	              const submitterName = submitter?.name || meeting.submittedBy || 'Unattributed';
	              return (
	                <div key={meeting.id} className="p-4 border-b border-slate-100 last:border-0 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                  {submitter ? (
                    <Image 
                      src={submitter.avatar} 
                      alt={submitter.name} 
                      width={40} 
                      height={40} 
                      className="rounded-full border border-slate-200 object-cover"
                      sizes="40px"
                    />
                  ) : (
	                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200">
	                      {submitterName.split(' ').map(n => n[0]).join('') || '??'}
	                    </div>
	                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{meeting.title}</h4>
                      {meeting.riskScore && (
                        <Badge variant="outline" className={cn(
                          "text-[10px] h-5 px-1.5",
                          meeting.riskScore === 'high' ? "bg-red-100 text-red-700 border-red-200" :
                          meeting.riskScore === 'medium' ? "bg-amber-100 text-amber-700 border-amber-200" :
                          "bg-emerald-100 text-emerald-700 border-emerald-200"
                        )}>
                          {meeting.riskScore === 'high' ? 'High Risk' : meeting.riskScore === 'medium' ? 'Medium Risk' : 'Low Risk'}
                        </Badge>
                      )}
                    </div>
	                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
	                      <span>{submitterName}</span>
	                      <span>•</span>
                      {(() => {
                        const sla = getSLAStatus(meeting.submittedAt);
                        return (
                          <span className={cn("font-medium flex items-center gap-1 px-1.5 py-0.5 rounded text-xs", sla.bg, sla.color)}>
                            <Clock className="w-3 h-3" /> {sla.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
	                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
	                    <Button
	                      size="sm"
	                      variant="ghost"
	                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
	                      onClick={(e) => {
	                        e.stopPropagation();
	                        updateMeetingStatus(meeting.id, 'approved', { action: 'approved', by: currentUser.name });
	                      }}
	                    >
	                      Approve
	                    </Button>
	                    <Link href={`/my-notes/${meeting.id}`}><Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">Review</Button></Link>
	                  </div>
                </div>
              );
            })}
            {reviewItems.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>All caught up! No pending reviews.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
// --- Admin View ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {(() => {
            const activeUsers = Object.keys(personas).length;
        const minutesGenerated = meetings.length;
        const avgDuration = (() => {
          if (!minutesGenerated) return null;
          const sum = meetings.reduce((acc, m) => {
            const num = Number(m.duration.replace(/[^0-9]/g, ''));
            return acc + (Number.isFinite(num) ? num : 0);
          }, 0);
          return Math.round(sum / minutesGenerated) || null;
        })();
        return (
          <>
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                  System Overview
                </h1>
                <p className="text-slate-500">
                  {config.authorityLabel} • <span className="text-green-600 font-medium">{config.name}</span>
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Global Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-sm text-slate-500 mb-1">Active Users</div>
                <div className="text-3xl font-bold text-slate-900">{activeUsers}</div>
                <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> demo data
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-slate-500 mb-1">Minutes Generated</div>
                <div className="text-3xl font-bold text-slate-900">{minutesGenerated}</div>
                <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> derived from mock notes
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-slate-500 mb-1">Avg. Duration</div>
                <div className="text-3xl font-bold text-slate-900">{avgDuration ?? '—'}m</div>
                <div className="text-xs text-slate-400 mt-2">per meeting</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-slate-500 mb-1">System Status</div>
                <div className="text-3xl font-bold text-green-600">Demo stable</div>
                <div className="text-xs text-slate-400 mt-2">Mock uptime</div>
              </Card>
            </div>
          </>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Service Domains</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-slate-700">Children&apos;s Social Care</span>
              </div>
              <Badge variant="outline" className="bg-white">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-slate-700">Adult Social Care</span>
              </div>
              <Badge variant="outline" className="bg-white">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="font-medium text-slate-700">Housing Directorate</span>
              </div>
              <Badge variant="outline" className="bg-white">Pilot</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Recent Audit Logs</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="mt-1">
                  <Shield className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-900 font-medium">Config updated for &quot;Children&apos;s&quot;</p>
                  <p className="text-slate-500 text-xs">by Priya Patel • 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
