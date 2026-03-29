'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useDemo } from '@/context/DemoContext';
import { cn } from '@/lib/utils';
import { Check, Cloud, RefreshCw, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

const MODE_OPTIONS = [
  { value: 'light' as const, label: 'Light', description: 'Always use the bright interface.' },
  { value: 'dark' as const, label: 'Dark', description: 'Always use the low-light interface.' },
  { value: 'system' as const, label: 'System', description: 'Follow the device preference.' },
];

function formatTimestamp(value: string | null): string {
  if (!value) return 'Not saved yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function SettingsPage() {
  const {
    colorMode,
    resolvedColorMode,
    themeScopeKey,
    preferenceSource,
    preferenceSyncState,
    preferenceError,
    preferenceUpdatedAt,
    preferenceSyncedAt,
    isDark,
    isSystemMode,
    setColorMode,
    resetColorMode,
    refreshPreference,
    syncPreference,
  } = useTheme();
  const { currentUser, config } = useDemo();

  const sourceLabel = useMemo(() => {
    switch (preferenceSource) {
      case 'server':
        return 'Synced to account';
      case 'local':
        return 'Saved locally';
      case 'bootstrap':
        return 'Bootstrapped';
      default:
        return 'Using defaults';
    }
  }, [preferenceSource]);

  const syncLabel = useMemo(() => {
    switch (preferenceSyncState) {
      case 'loading':
        return 'Loading';
      case 'pending':
        return 'Waiting to sync';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Needs retry';
      case 'local':
        return 'Local only';
      default:
        return 'Idle';
    }
  }, [preferenceSyncState]);

  return (
    <div className="space-y-6">
      <Card variant="hero" className="overflow-hidden border-border/30">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: config.theme.gradient }}
          aria-hidden="true"
        />
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge className="bg-white/15 text-white border-white/20 w-fit">
                Appearance
              </Badge>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">
                  Theme and account preferences
                </h1>
                <p className="mt-2 max-w-xl text-sm text-white/80">
                  Choose how the app looks on this account. The selection is saved per persona and synced when your connection allows it.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/15 text-white border-white/20">
                {currentUser.name}
              </Badge>
              <Badge className="bg-white/15 text-white border-white/20">
                {currentUser.role.replace('_', ' ')}
              </Badge>
              <Badge className="bg-white/15 text-white border-white/20">
                {currentUser.domain}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 space-y-2">
            <CardTitle className="text-foreground">Appearance</CardTitle>
            <CardDescription>
              Use the quick toggle in the header, or set the account default here.
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-6 space-y-6 p-0">
            <div className="flex flex-wrap items-center gap-3">
              {MODE_OPTIONS.map((option) => {
                const active = colorMode === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    className={cn(
                      'min-w-[7rem] justify-start gap-2',
                      active && 'border-transparent shadow-md'
                    )}
                    onClick={() => setColorMode(option.value)}
                  >
                    {active && <Check className="h-4 w-4" />}
                    {!active && <span className="h-4 w-4 rounded-full border border-current/40" />}
                    <span>{option.label}</span>
                  </Button>
                );
              })}

              <Button type="button" variant="ghost" onClick={resetColorMode} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to system
              </Button>

              <ThemeToggle showLabel size="default" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{colorMode}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{resolvedColorMode}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Scope</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground" title={themeScopeKey}>
                  {themeScopeKey}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">Storage</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{sourceLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {formatTimestamp(preferenceUpdatedAt)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Cloud className={cn('h-4 w-4', preferenceSyncState === 'error' ? 'text-destructive' : 'text-info')} />
                  <span className="text-sm font-medium text-foreground">Sync</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{syncLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last synced {formatTimestamp(preferenceSyncedAt)}
                </p>
              </div>
            </div>

            {preferenceError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {preferenceError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void syncPreference()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync now
              </Button>
              <Button type="button" variant="outline" onClick={() => void refreshPreference()}>
                Reload from account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 space-y-2">
            <CardTitle className="text-foreground">Live preview</CardTitle>
            <CardDescription>
              This card updates as you switch modes so you can see the shell contract in place.
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-6 space-y-4 p-0">
            <div className={cn(
              'overflow-hidden rounded-2xl border border-border shadow-sm',
              isDark ? 'bg-background' : 'bg-muted/30'
            )}>
              <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview shell</p>
                  <p className="text-sm font-semibold text-foreground">Minute Platform</p>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isSystemMode ? 'System' : resolvedColorMode}
                </Badge>
              </div>

              <div className="space-y-4 p-4">
                <div className="rounded-xl bg-background p-4 shadow-sm border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Social worker</p>
                      <h3 className="text-lg font-semibold text-foreground">Sarah Jenkins</h3>
                      <p className="text-sm text-muted-foreground">Children&apos;s Social Care</p>
                    </div>
                    <Badge variant="success" className="shrink-0">Ready</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">Drafts: 1</Badge>
                    <Badge variant="outline">Due today: 0</Badge>
                    <Badge variant="outline">Domain: {currentUser.domain}</Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['Surface', isDark ? 'Dark' : 'Light'],
                    ['Mode', colorMode],
                    ['Source', preferenceSource],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
