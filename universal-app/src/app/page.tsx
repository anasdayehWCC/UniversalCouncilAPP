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
import { TeamComplianceWidget } from '@/components/dashboards/TeamComplianceWidget';
import {
  EmptyStatePanel,
  ListRow,
  PageHeader,
  PageSection,
  PrimaryPanel,
  SecondaryPanel,
  ShellPage,
} from '@/components/layout';

export default function Dashboard() {
  const { role, currentUser, meetings, config, personas, updateMeetingStatus } = useDemo();
  const personaStrings = personaCopy[role];
  const { domainMeetings, drafts, dueToday } = useTenantMetrics(meetings, currentUser.domain);
  const isPractitioner = role === 'social_worker' || role === 'housing_officer';

  // --- Social Worker View ---
  if (isPractitioner) {
    const recentNotes = domainMeetings.slice(0, 3);
    
    return (
      <ShellPage
        padded={false}
        header={
          <PageHeader
            eyebrow={personaStrings.heroRole}
            title={`Hi ${currentUser.name.split(' ')[0]}`}
            description={
              <>
                <p>{personaStrings.heroGreeting}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">
                  {personaStrings.heroSubtext}
                </p>
              </>
            }
            gradient={config.theme.gradient}
            inverted
            metrics={[
              { label: 'Drafts', value: drafts, tone: 'warning' },
              { label: 'Due today', value: dueToday, tone: 'success' },
              { label: 'Domain', value: config.name, tone: 'info' },
            ]}
            actions={
              <Link href="/record">
                <Button className="border-0 bg-white text-foreground shadow-lg hover:bg-white/90">
                  {personaStrings.heroCtaLabel}
                </Button>
              </Link>
            }
          />
        }
        contentClassName="space-y-8"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          <Link href="/record" className="block h-full">
            <PrimaryPanel className="h-full border-primary/20 transition-all hover:border-primary/40 hover:shadow-md">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">New Recording</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Capture a visit or meeting with a single primary action and let AI draft the note for you.
              </p>
            </PrimaryPanel>
          </Link>

          <Link href="/upload" className="block h-full">
            <SecondaryPanel className="h-full">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Upload Audio</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Import a dictaphone or phone recording and continue the workflow without re-capturing.
              </p>
            </SecondaryPanel>
          </Link>

          <Link href="/my-notes" className="block h-full md:col-span-2 xl:col-span-1">
            <SecondaryPanel className="h-full">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">My Notes</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Review recent case notes, edit summaries, and move work forward without searching across screens.
              </p>
            </SecondaryPanel>
          </Link>
        </div>

        <PageSection
          title="Recent Activity"
          actions={
            <Link href="/my-notes" className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="grid gap-4">
            {recentNotes.length > 0 ? (
              recentNotes.map((note, index) => (
                <Link
                  key={note.id}
                  href={`/my-notes/${note.id}`}
                  className="block animate-in slide-in-from-bottom-4 fade-in duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ListRow className="group flex items-center gap-4 transition-all duration-300 hover:border-primary/24 hover:bg-muted/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-all group-hover:bg-background group-hover:text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                        {note.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(note.date)}
                        </span>
                        <span>•</span>
                        <span>{note.duration}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      'capitalize transition-colors',
                      note.status === 'draft'
                        ? 'border-warning/20 bg-warning/10 text-warning'
                        : note.status === 'ready'
                        ? 'border-success/20 bg-success/10 text-success'
                        : 'border-border bg-muted text-muted-foreground'
                    )}>
                      {note.status.replace('_', ' ')}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                  </ListRow>
                </Link>
              ))
            ) : (
              <EmptyStatePanel>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="mb-1 font-medium text-foreground">No recent activity</h3>
                <p className="mb-4 text-sm text-muted-foreground">You haven&apos;t created any notes yet.</p>
                <Link href="/record">
                  <Button variant="outline" size="sm">Start a Recording</Button>
                </Link>
              </EmptyStatePanel>
            )}
          </div>
        </PageSection>
      </ShellPage>
    );
  }

    // --- Manager View ---
  if (role === 'manager') {
    const reviewItems = meetings.filter(m => PENDING_REVIEW_STATUSES.includes(m.status) && m.domain === currentUser.domain);
    const contributors = new Set(reviewItems.map(m => m.submittedBy).filter(Boolean));
    const approvalsMetrics = getApprovalsMetrics(meetings, currentUser.domain);
    const syncStatus = getSyncStatus(meetings);
    return (
      <ShellPage
        padded={false}
        header={
          <PageHeader
            eyebrow="Manager"
            title={personaStrings.heroRole === 'Manager' ? 'Team Lead' : personaStrings.heroRole}
            description={
              <>
                <p>
                  {currentUser.team} • <span className="font-semibold text-foreground">{approvalsMetrics.pending} items</span> require your attention in {config.name}.
                </p>
                <p className="text-sm italic text-muted-foreground">{personaStrings.heroGreeting}</p>
              </>
            }
            metrics={[
              { label: 'Queue', value: approvalsMetrics.pending, tone: 'brand' },
              { label: 'SLA', value: approvalsMetrics.slaLabel, tone: 'destructive' },
              { label: 'Sync', value: syncStatus.label, tone: syncStatus.healthy ? 'success' : 'warning' },
            ]}
            actions={
              <span className="text-xs text-muted-foreground">
                Last sync: {syncStatus.lastSync}
              </span>
            }
          />
        }
        contentClassName="space-y-8"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link href="/review-queue">
            <PrimaryPanel className="h-full border-l-4 border-l-destructive transition-all hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <Badge className="border-0 bg-destructive/10 text-destructive">{approvalsMetrics.slaLabel}</Badge>
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground">Approvals Pending</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{approvalsMetrics.pending} sign-offs queued.</p>
            </PrimaryPanel>
          </Link>

          <Link href="/insights">
            <PrimaryPanel className="h-full border-l-4 border-l-info transition-all hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-2xl bg-info/10 p-3 text-info">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="rounded-full border border-success/20 bg-success/10 px-2 py-1 text-xs font-bold text-success">
                  +12% vs last week
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground">Team Activity</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{domainMeetings.length} minutes generated</p>
            </PrimaryPanel>
          </Link>

          <SecondaryPanel className="h-full">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="border-border bg-card text-muted-foreground">Team Overview</Badge>
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground">Team Overview</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{contributors.size || 1} active submitters this week</p>
          </SecondaryPanel>
        </div>

        {/* Team Compliance */}
        <TeamComplianceWidget
          meetings={meetings}
          personas={personas}
          domain={currentUser.domain}
        />

        <PageSection
          title="Priority Reviews"
          actions={
            <Link href="/review-queue">
              <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <CheckSquare className="w-4 h-4" />
                Bulk Approve Low Risk
              </Button>
            </Link>
          }
        >
          <div className="grid gap-4">
            {reviewItems.slice(0, 5).map((meeting) => {
              const submitter =
                (meeting.submittedById && personas[meeting.submittedById]) ||
                Object.values(personas).find((user) => user.name === meeting.submittedBy);
              const submitterName = submitter?.name || meeting.submittedBy || 'Unattributed';

              return (
                <ListRow key={meeting.id} className="group flex items-center gap-4 hover:bg-muted/40">
                  {submitter ? (
                    <Image
                      src={submitter.avatar}
                      alt={submitter.name}
                      width={40}
                      height={40}
                      className="rounded-full border border-border object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
                      {submitterName.split(' ').map((name) => name[0]).join('') || '??'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-foreground transition-colors group-hover:text-primary">{meeting.title}</h4>
                      {meeting.riskScore && (
                        <Badge variant="outline" className={cn(
                          'h-5 px-1.5 text-[10px]',
                          meeting.riskScore === 'high'
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : meeting.riskScore === 'medium'
                            ? 'border-warning/30 bg-warning/10 text-warning'
                            : 'border-success/30 bg-success/10 text-success'
                        )}>
                          {meeting.riskScore === 'high' ? 'High Risk' : meeting.riskScore === 'medium' ? 'Medium Risk' : 'Low Risk'}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{submitterName}</span>
                      <span>•</span>
                      {(() => {
                        const sla = getSLAStatus(meeting.submittedAt);
                        return (
                          <span className={cn('flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium', sla.bg, sla.color)}>
                            <Clock className="w-3 h-3" />
                            {sla.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-success hover:bg-success/10 hover:text-success"
                      onClick={(event) => {
                        event.stopPropagation();
                        updateMeetingStatus(meeting.id, 'approved', { action: 'approved', by: currentUser.name });
                      }}
                    >
                      Approve
                    </Button>
                    <Link href={`/my-notes/${meeting.id}`}>
                      <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                        Review
                      </Button>
                    </Link>
                  </div>
                </ListRow>
              );
            })}

            {reviewItems.length === 0 && (
              <EmptyStatePanel>
                <CheckSquare className="mx-auto mb-3 w-12 h-12 opacity-20" />
                <p>All caught up! No pending reviews.</p>
              </EmptyStatePanel>
            )}
          </div>
        </PageSection>
      </ShellPage>
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
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  System Overview
                </h1>
                <p className="text-muted-foreground">
                  {config.authorityLabel} • <span className="text-success font-medium">{config.name}</span>
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Global Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Active Users</div>
                <div className="text-3xl font-bold text-foreground">{activeUsers}</div>
                <div className="text-xs text-success mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> demo data
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Minutes Generated</div>
                <div className="text-3xl font-bold text-foreground">{minutesGenerated}</div>
                <div className="text-xs text-success mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> derived from mock notes
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Avg. Duration</div>
                <div className="text-3xl font-bold text-foreground">{avgDuration ?? '—'}m</div>
                <div className="text-xs text-muted-foreground mt-2">per meeting</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">System Status</div>
                <div className="text-3xl font-bold text-success">Demo stable</div>
                <div className="text-xs text-muted-foreground mt-2">Mock uptime</div>
              </Card>
            </div>
          </>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="font-bold text-lg text-foreground mb-4">Service Domains</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="font-medium text-foreground">Children&apos;s Social Care</span>
              </div>
              <Badge variant="outline" className="bg-card">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="font-medium text-foreground">Adult Social Care</span>
              </div>
              <Badge variant="outline" className="bg-card">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <span className="font-medium text-foreground">Housing Directorate</span>
              </div>
              <Badge variant="outline" className="bg-card">Pilot</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg text-foreground mb-4">Recent Audit Logs</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="mt-1">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Config updated for &quot;Children&apos;s&quot;</p>
                  <p className="text-muted-foreground text-xs">by Priya Patel • 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
