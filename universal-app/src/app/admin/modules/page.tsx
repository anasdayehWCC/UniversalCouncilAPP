'use client';

import React, { useState } from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { ModuleToggle } from '@/components/admin/ModuleToggle';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialogRenderer } from '@/components/ui/ConfirmDialogRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

export default function AdminModulesPage() {
  const { modules, toggleModule, canManageModules, tenantConfig, stats } = useAdmin();
  const { success, info } = useToast();
  const { confirm, confirmDialogState, handleConfirm, handleCancel } = useConfirmDialog();

  const handleToggle = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      toggleModule(moduleId);
      const action = module.enabled ? 'disabled' : 'enabled';
      success(`${module.name} ${action}`);
    }
  };

  const handleConfigure = (moduleId: string) => {
    info('Module configuration coming soon');
  };

  const handleResetDefaults = async () => {
    const ok = await confirm({
      title: 'Reset all modules to defaults?',
      description: 'This will restore all modules to their default configuration. Active module sessions may be interrupted.',
      confirmLabel: 'Reset',
      variant: 'destructive',
    });
    if (ok) {
      info('Modules reset to defaults');
    }
  };

  return (
    <AdminPageWrapper 
      title="Module Configuration" 
      description={`Enable, disable, and configure modules for ${tenantConfig.name}`}
      action={
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {stats.activeModules} of {stats.totalModules} active
          </Badge>
          <Button variant="outline" className="gap-2" onClick={handleResetDefaults}>
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </Button>
        </div>
      }
    >
      <ConfirmDialogRenderer
        {...confirmDialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <div className="space-y-6">
        <ModuleToggle 
          modules={modules}
          onToggle={handleToggle}
          onConfigure={handleConfigure}
          canEdit={canManageModules}
        />
      </div>
    </AdminPageWrapper>
  );
}
