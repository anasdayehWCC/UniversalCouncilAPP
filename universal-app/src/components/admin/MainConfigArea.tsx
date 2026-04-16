'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database, Activity, ToggleRight, ToggleLeft, Mic, Save, Check
} from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useAdmin } from '@/hooks/useAdmin';
import type { FeatureFlags } from '@/types/flags';

export default function MainConfigArea() {
  const { featureFlags, setFeatureFlags } = useDemo();
  const { settings, updateSettings } = useAdmin();
  const [orgName, setOrgName] = useState(settings.name);
  const [isSaved, setIsSaved] = useState(false);

  const orgNameDirty = orgName !== settings.name;

  const handleSaveOrgName = () => {
    updateSettings({ name: orgName });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleFeature = (key: keyof FeatureFlags) => {
    const action = featureFlags[key] ? 'disable' : 'enable';
    if (confirm(`Are you sure you want to ${action} this feature?`)) {
      const next = { ...featureFlags, [key]: !featureFlags[key] };
      setFeatureFlags(next);
    }
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card variant="glass" hoverEffect={false} className="p-6 bg-card/80">
        <h2 className="text-xl font-bold text-foreground mb-6 font-display">Configuration</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div>
              <h3 className="font-bold text-foreground">Organization Name</h3>
              <p className="text-sm text-muted-foreground">Visible on all reports and exports.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-64">
                <input
                  type="text"
                  className="w-full p-2 border border-input rounded-md text-sm text-foreground bg-background"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setIsSaved(false);
                  }}
                />
              </div>
              <Button
                size="sm"
                disabled={!orgNameDirty}
                onClick={handleSaveOrgName}
                className="gap-1.5"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div>
              <h3 className="font-bold text-foreground">Feature Flags</h3>
              <p className="text-sm text-muted-foreground">Toggle beta capabilities for this demo.</p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-4 border border-border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-md">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">AI Insights (Beta)</h4>
                  <p className="text-xs text-muted-foreground">Advanced analytics for team managers.</p>
                </div>
              </div>
              <div onClick={() => toggleFeature('aiInsights')} className="cursor-pointer">
                 {featureFlags.aiInsights ? <ToggleRight className="w-8 h-8 text-[var(--primary)]" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                  <Database className="w-4 h-4" />
                </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Housing Pilot Module</h4>
                <p className="text-xs text-muted-foreground">Enable housing templates and workflows.</p>
              </div>
              </div>
              <div onClick={() => toggleFeature('housingPilot')} className="cursor-pointer">
                 {featureFlags.housingPilot ? <ToggleRight className="w-8 h-8 text-[var(--primary)]" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
	                <div className="p-2 bg-[var(--primary-soft)] text-[var(--primary)] rounded-md">
	                  <Mic className="w-4 h-4" />
	                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Smart Capture AI</h4>
                  <p className="text-xs text-muted-foreground">Enable real-time transcription.</p>
                </div>
              </div>
              <div onClick={() => toggleFeature('smartCapture')} className="cursor-pointer">
                 {featureFlags.smartCapture ? <ToggleRight className="w-8 h-8 text-[var(--primary)]" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div>
              <h3 className="font-bold text-foreground">Data Residency</h3>
              <p className="text-sm text-muted-foreground">Select storage region and residency guardrails.</p>
            </div>
            <div className="w-64">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Database className="w-4 h-4" />
                UK-West (Azure)
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card variant="glass" hoverEffect={false} className="p-6 bg-card/80">
        <h2 className="text-xl font-bold text-foreground mb-6 font-display">Theme Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border relative overflow-hidden group">
            <div className="absolute inset-0 opacity-90" style={{ background: 'linear-gradient(135deg, #211551 0%, #120C33 100%)' }}></div>
            <div className="relative z-10">
              <div className="text-white font-bold mb-2 flex justify-between items-center">
                Children&apos;s (WCC)
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">Active</Badge>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded bg-[#211551] border border-white/20 shadow-sm" title="Primary"></div>
                <div className="w-8 h-8 rounded bg-[#9D581F] border border-white/20 shadow-sm" title="Accent"></div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border relative overflow-hidden group">
            <div className="absolute inset-0 opacity-90" style={{ background: 'linear-gradient(135deg, #014363 0%, #00263A 100%)' }}></div>
            <div className="relative z-10">
              <div className="text-white font-bold mb-2 flex justify-between items-center">
                Adults (RBKC)
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">Active</Badge>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded bg-[#014363] border border-white/20 shadow-sm" title="Primary"></div>
                <div className="w-8 h-8 rounded bg-[#A2CDE0] border border-white/20 shadow-sm" title="Accent"></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
