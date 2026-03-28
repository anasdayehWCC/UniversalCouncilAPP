'use client';

import React from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import type { TenantSettings } from '@/types/admin';

export default function SettingsPage() {
  const { settings, updateSettings, canManageSettings, tenantConfig } = useAdmin();
  const { success, error } = useToast();

  const handleSave = (updates: Partial<TenantSettings>) => {
    try {
      updateSettings(updates);
      success('Settings saved successfully');
    } catch (err) {
      error('Failed to save settings');
    }
  };

  return (
    <AdminPageWrapper 
      title="Settings" 
      description={`Configure general settings for ${tenantConfig.name}`}
    >
      <SettingsForm 
        settings={settings}
        onSave={handleSave}
        canEdit={canManageSettings}
      />
    </AdminPageWrapper>
  );
}
