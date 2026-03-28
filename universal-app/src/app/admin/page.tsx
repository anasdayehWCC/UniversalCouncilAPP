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
          <Card variant="glass" className="p-4 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-3">{stats.totalUsers}</h3>
            <p className="text-sm text-slate-500">Total Users</p>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Manage users <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          <Card variant="glass" className="p-4 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <Badge variant="secondary" className="text-xs">
                +{stats.meetingsThisMonth} this month
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-3">{stats.totalMeetings}</h3>
            <p className="text-sm text-slate-500">Total Meetings</p>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" /> 12% increase
              </span>
            </div>
          </Card>

          <Card variant="glass" className="p-4 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="secondary" className="text-xs">
                AI Processed
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-3">
              {Math.floor(stats.transcriptionMinutes / 60)}h {stats.transcriptionMinutes % 60}m
            </h3>
            <p className="text-sm text-slate-500">Transcription Time</p>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                Est. cost: £{(stats.transcriptionMinutes * 0.006).toFixed(2)}
              </span>
            </div>
          </Card>

          <Card variant="glass" className="p-4 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-amber-600" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {stats.activeModules}/{stats.totalModules} modules
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-3">
              {(stats.storageUsedMb / 1024).toFixed(1)} GB
            </h3>
            <p className="text-sm text-slate-500">Storage Used</p>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <Link href="/admin/modules" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Configure modules <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Actions & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-white/80">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
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
          <Card variant="glass" hoverEffect={false} className="p-5 bg-white/80 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">System Health</h3>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                All systems operational
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">API Response Time</span>
                  <span className="font-medium text-slate-900">124ms avg</span>
                </div>
                <ProgressBar value={88} color="#22c55e" backgroundColor="#dcfce7" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">AI Processing Queue</span>
                  <span className="font-medium text-slate-900">3 pending</span>
                </div>
                <ProgressBar value={15} color="#3b82f6" backgroundColor="#dbeafe" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Storage Capacity</span>
                  <span className="font-medium text-slate-900">23.4% used</span>
                </div>
                <ProgressBar value={23.4} color="#8b5cf6" backgroundColor="#ede9fe" />
              </div>
            </div>
          </Card>
        </div>

        {/* Module Status & Adoption */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Modules */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-white/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Active Modules</h3>
              <Link href="/admin/modules">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {modules.filter(m => m.enabled).slice(0, 4).map(module => (
                <div key={module.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{module.name}</p>
                      <p className="text-xs text-slate-500">{module.category}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
              ))}
              
              {modules.some(m => !m.enabled) && (
                <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {modules.filter(m => !m.enabled).length} modules disabled
                </div>
              )}
            </div>
          </Card>

          {/* User Adoption */}
          <Card variant="glass" hoverEffect={false} className="p-5 bg-white/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Team Adoption</h3>
              <Badge variant="secondary">{stats.activeUsers} active</Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Children&apos;s Services</span>
                  <span className="font-medium text-slate-900">92%</span>
                </div>
                <ProgressBar value={92} color="#3b82f6" backgroundColor="#dbeafe" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Adult Social Care</span>
                  <span className="font-medium text-slate-900">78%</span>
                </div>
                <ProgressBar value={78} color="#06b6d4" backgroundColor="#cffafe" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Housing Services</span>
                  <span className="font-medium text-amber-600">45%</span>
                </div>
                <ProgressBar value={45} color="#f59e0b" backgroundColor="#fef3c7" />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Based on users who logged in within the last 7 days
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        {canViewAudit && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Admin Activity</h3>
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
