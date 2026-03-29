'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  Palette, 
  Shield, 
  Bell, 
  Settings2,
  AlertCircle,
  CheckCircle,
  Upload,
  Loader2
} from 'lucide-react';
import { TenantSettings } from '@/types/admin';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// Zod schema for settings validation
const settingsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
  }),
  compliance: z.object({
    dataRetentionDays: z.number().min(30, 'Minimum 30 days').max(2555, 'Maximum 7 years'),
    auditLogRetentionDays: z.number().min(90, 'Minimum 90 days').max(2555, 'Maximum 7 years')
  }),
  notifications: z.object({
    webhookUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
  })
});

interface SettingsFormProps {
  settings: TenantSettings;
  onSave: (settings: Partial<TenantSettings>) => void;
  canEdit: boolean;
}

export function SettingsForm({ settings, onSave, canEdit }: SettingsFormProps) {
  const [formData, setFormData] = useState(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate
      settingsSchema.parse({
        name: formData.name,
        branding: formData.branding,
        compliance: formData.compliance,
        notifications: formData.notifications
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onSave(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          const path = e.path.join('.');
          newErrors[path] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBranding = (key: keyof TenantSettings['branding'], value: string) => {
    setFormData(prev => ({
      ...prev,
      branding: { ...prev.branding, [key]: value }
    }));
  };

  const updateFeatures = (key: keyof TenantSettings['features'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value }
    }));
  };

  const updateCompliance = (key: keyof TenantSettings['compliance'], value: number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      compliance: { ...prev.compliance, [key]: value }
    }));
  };

  const updateNotifications = (key: keyof TenantSettings['notifications'], value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-card/80 border border-border">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Shield className="w-4 h-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card variant="glass" hoverEffect={false} className="p-6 bg-card/80">
            <h3 className="text-lg font-semibold text-foreground mb-4">General Settings</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name</Label>
                <Input
                  id="tenantName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!canEdit}
                />
                {errors['name'] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors['name']}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Feature Toggles</h4>
                
                {[
                  { key: 'aiEdit' as const, label: 'AI-Assisted Editing', desc: 'Allow AI to suggest edits to minutes' },
                  { key: 'smartCapture' as const, label: 'Smart Capture', desc: 'Real-time transcription with AI' },
                  { key: 'offlineMode' as const, label: 'Offline Mode', desc: 'Enable offline recording and sync' },
                  { key: 'pushNotifications' as const, label: 'Push Notifications', desc: 'Browser and mobile push alerts' }
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => canEdit && updateFeatures(key, !formData.features[key])}
                      disabled={!canEdit}
                      className={cn(
                        'relative w-12 h-7 rounded-full transition-colors',
                        formData.features[key] ? 'bg-[var(--primary)]' : 'bg-muted-foreground/30',
                        !canEdit && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span 
                        className={cn(
                          'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                          formData.features[key] ? 'left-6' : 'left-1'
                        )}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card variant="glass" hoverEffect={false} className="p-6 bg-card/80">
            <h3 className="text-lg font-semibold text-foreground mb-4">Branding</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={formData.branding.primaryColor}
                      onChange={(e) => updateBranding('primaryColor', e.target.value)}
                      disabled={!canEdit}
                      className="h-10 w-14 rounded border border-input cursor-pointer disabled:opacity-50"
                    />
                    <Input
                      value={formData.branding.primaryColor}
                      onChange={(e) => updateBranding('primaryColor', e.target.value)}
                      disabled={!canEdit}
                      className="font-mono uppercase"
                    />
                  </div>
                  {errors['branding.primaryColor'] && (
                    <p className="text-xs text-destructive">{errors['branding.primaryColor']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="accentColor"
                      value={formData.branding.accentColor}
                      onChange={(e) => updateBranding('accentColor', e.target.value)}
                      disabled={!canEdit}
                      className="h-10 w-14 rounded border border-input cursor-pointer disabled:opacity-50"
                    />
                    <Input
                      value={formData.branding.accentColor}
                      onChange={(e) => updateBranding('accentColor', e.target.value)}
                      disabled={!canEdit}
                      className="font-mono uppercase"
                    />
                  </div>
                  {errors['branding.accentColor'] && (
                    <p className="text-xs text-destructive">{errors['branding.accentColor']}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo Upload</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-input transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground">Drag and drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, SVG up to 2MB</p>
                  <Button type="button" variant="outline" size="sm" className="mt-3" disabled={!canEdit}>
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="p-4 rounded-lg text-white"
                  style={{ background: formData.branding.primaryColor }}
                >
                  <p className="font-semibold">{formData.name}</p>
                  <p className="text-sm opacity-80">Sample header preview</p>
                  <button 
                    type="button"
                    className="mt-3 px-3 py-1.5 rounded text-sm font-medium"
                    style={{ backgroundColor: formData.branding.accentColor }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Compliance Settings */}
        <TabsContent value="compliance">
          <Card variant="glass" hoverEffect={false} className="p-6 bg-card/80">
            <h3 className="text-lg font-semibold text-foreground mb-4">Compliance & Security</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={formData.compliance.dataRetentionDays}
                    onChange={(e) => updateCompliance('dataRetentionDays', parseInt(e.target.value) || 0)}
                    disabled={!canEdit}
                    min={30}
                    max={2555}
                  />
                  {errors['compliance.dataRetentionDays'] && (
                    <p className="text-xs text-destructive">{errors['compliance.dataRetentionDays']}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Meeting data and transcripts</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auditRetention">Audit Log Retention (days)</Label>
                  <Input
                    id="auditRetention"
                    type="number"
                    value={formData.compliance.auditLogRetentionDays}
                    onChange={(e) => updateCompliance('auditLogRetentionDays', parseInt(e.target.value) || 0)}
                    disabled={!canEdit}
                    min={90}
                    max={2555}
                  />
                  {errors['compliance.auditLogRetentionDays'] && (
                    <p className="text-xs text-destructive">{errors['compliance.auditLogRetentionDays']}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Admin actions and system events</p>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Require Multi-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Enforce MFA for all users</p>
                </div>
                <button
                  type="button"
                  onClick={() => canEdit && updateCompliance('requireMfa', !formData.compliance.requireMfa)}
                  disabled={!canEdit}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors',
                    formData.compliance.requireMfa ? 'bg-[var(--primary)]' : 'bg-muted-foreground/30',
                    !canEdit && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span 
                    className={cn(
                      'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      formData.compliance.requireMfa ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
              </label>

              <div className="space-y-2">
                <Label>Allowed Email Domains</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.compliance.allowedDomains.map((domain, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                    >
                      @{domain}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => updateCompliance(
                            'allowedDomains',
                            formData.compliance.allowedDomains.filter((_, i) => i !== index)
                          )}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card variant="glass" hoverEffect={false} className="p-6 bg-card/80">
            <h3 className="text-lg font-semibold text-foreground mb-4">Notifications</h3>
            
            <div className="space-y-6">
              {[
                { key: 'emailEnabled' as const, label: 'Email Notifications', desc: 'Send email alerts for approvals and updates' },
                { key: 'slackEnabled' as const, label: 'Slack Integration', desc: 'Post notifications to a Slack channel' }
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => canEdit && updateNotifications(key, !formData.notifications[key])}
                    disabled={!canEdit}
                    className={cn(
                      'relative w-12 h-7 rounded-full transition-colors',
                      formData.notifications[key] ? 'bg-[var(--primary)]' : 'bg-muted-foreground/30',
                      !canEdit && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span 
                      className={cn(
                        'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        formData.notifications[key] ? 'left-6' : 'left-1'
                      )}
                    />
                  </button>
                </label>
              ))}

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.notifications.webhookUrl || ''}
                  onChange={(e) => updateNotifications('webhookUrl', e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://your-webhook-endpoint.com/hooks/..."
                />
                {errors['notifications.webhookUrl'] && (
                  <p className="text-xs text-destructive">{errors['notifications.webhookUrl']}</p>
                )}
                <p className="text-xs text-muted-foreground">Receive POST requests for all admin events</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {canEdit && (
        <div className="flex items-center justify-end gap-4 mt-6">
          {isSaved && (
            <span className="text-sm text-success flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Settings saved
            </span>
          )}
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
