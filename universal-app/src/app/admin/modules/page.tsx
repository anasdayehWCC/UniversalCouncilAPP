'use client';

import React from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { ModuleToggle } from '@/components/admin/ModuleToggle';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

export default function AdminModulesPage() {
  const { modules, toggleModule, updateModuleSettings, canManageModules, tenantConfig, stats } = useAdmin();
  const { success, info } = useToast();

  const handleToggle = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      toggleModule(moduleId);
      const action = module.enabled ? 'disabled' : 'enabled';
      success(`${module.name} ${action}`);
    }
  };

  const handleSaveSettings = (moduleId: string, settings: Record<string, unknown>) => {
    updateModuleSettings(moduleId, settings);
    const targetModule = modules.find(m => m.id === moduleId);
    success(`${targetModule?.name ?? 'Module'} settings saved`);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all modules to default configuration?')) {
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
      <div className="space-y-6">
        <ModuleToggle
          modules={modules}
          onToggle={handleToggle}
          onSaveSettings={handleSaveSettings}
          canEdit={canManageModules}
        />
      </div>
    </AdminPageWrapper>
  );
}
