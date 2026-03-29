'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { AuditLog } from '@/components/admin/AuditLog';
import { useAdmin } from '@/hooks/useAdmin';
import { 
  Users, 
  Clock, 
  Puzzle, 
  HardDrive,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/dates';

export default function AdminDashboard() {
  const { stats, auditLog, modules, users, tenantConfig, canViewAudit } = useAdmin();

  const quickActions = [
    { label: 'Add User', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Configure Modules', href: '/admin/modules', icon: <Puzzle className="w-4 h-4" /> },
    { label: 'Export Report', action: () => alert('Export coming soon'), icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <AdminPageWrapper 
      title="Admin Dashboard" 
      description={`Configuration and analytics for ${tenantConfig.name}`}
      action={
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass" className="p-4 bg-card/80 dark:bg-card/60">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-info/10 rounded-lg">
                <Users className="w-5 h-5 text-info" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-3">{stats.totalUsers}</h3>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <div className="mt-2 pt-2 border-t border-border">
              <Link href="/admin/users" className="text-sm text-primary hover:underline flex items-center gap-1">
                Manage users <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          <Card variant="glass" className="p-4 bg-card/80 dark:bg-card/60">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-success/10 rounded-lg">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <Badge variant="secondary" className="text-xs">
                +{stats.meetingsThisMonth} this month
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-3">{stats.totalMeetings}</h3>
            <p className="text-sm text-muted-foreground">Total Meetings</p>
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" /> 12% increase
              </span>
            </div>
          </Card>

          <Card variant="glass" className="p-4 bg-card/80 dark:bg-card/60">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">
                AI Processed
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-3">
              {Math.floor(stats.transcriptionMinutes / 60)}h {stats.transcriptionMinutes % 60}m
            </h3>
            <p className="text-sm text-muted-foreground">Transcription Time</p>
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Est. cost: £{(stats.transcriptionMinutes * 0.006).toFixed(2)}
              </span>
            </div>
          </Card>

          <Card variant="glass" className="p-4 bg-card/80 dark:bg-card/60">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-warning/10 rounded-lg">
                <HardDrive className="w-5 h-5 text-warning" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {stats.activeModules}/{stats.totalModules} modules
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-3">
              {(stats.storageUsedMb / 1024).toFixed(1)} GB
            </h3>
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <div className="mt-2 pt-2 border-t border-border">
              <Link href="/admin/modules" className="text-sm text-primary hover:underline flex items-center gap-1">
                Configure modules <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Actions & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-card/80 dark:bg-card/60">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                action.href ? (
                  <Link key={i} href={action.href}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      {action.icon}
                      {action.label}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={action.action}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                )
              ))}
            </div>
          </Card>

          {/* System Health */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-card/80 dark:bg-card/60 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">System Health</h3>
              <Badge className="bg-success/10 text-success border-success/20">
                <Activity className="w-3 h-3 mr-1" />
                All systems operational
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">API Response Time</span>
                  <span className="font-medium text-foreground">124ms avg</span>
                </div>
                <ProgressBar value={88} variant="success" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">AI Processing Queue</span>
                  <span className="font-medium text-foreground">3 pending</span>
                </div>
                <ProgressBar value={15} variant="info" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Storage Capacity</span>
                  <span className="font-medium text-foreground">23.4% used</span>
                </div>
                <ProgressBar value={23.4} variant="default" />
              </div>
            </div>
          </Card>
        </div>

        {/* Module Status & Adoption */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Modules */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-card/80 dark:bg-card/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Active Modules</h3>
              <Link href="/admin/modules">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {modules.filter(m => m.enabled).slice(0, 4).map(module => (
                <div key={module.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{module.name}</p>
                      <p className="text-xs text-muted-foreground">{module.category}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
              ))}
              
              {modules.some(m => !m.enabled) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  {modules.filter(m => !m.enabled).length} modules disabled
                </div>
              )}
            </div>
          </Card>

          {/* User Adoption */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-card/80 dark:bg-card/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Team Adoption</h3>
              <Badge variant="secondary">{stats.activeUsers} active</Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Children&apos;s Services</span>
                  <span className="font-medium text-foreground">92%</span>
                </div>
                <ProgressBar value={92} variant="info" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Adult Social Care</span>
                  <span className="font-medium text-foreground">78%</span>
                </div>
                <ProgressBar value={78} variant="info" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Housing Services</span>
                  <span className="font-medium text-warning">45%</span>
                </div>
                <ProgressBar value={45} variant="warning" />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Based on users who logged in within the last 7 days
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        {canViewAudit && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Admin Activity</h3>
              <Link href="/admin/audit">
                <Button variant="ghost" size="sm">View full log</Button>
              </Link>
            </div>
            <AuditLog entries={auditLog.slice(0, 5)} pageSize={5} />
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
