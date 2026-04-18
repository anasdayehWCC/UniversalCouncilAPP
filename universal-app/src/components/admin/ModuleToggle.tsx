'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ToggleRight, 
  ToggleLeft, 
  Settings, 
  AlertTriangle,
  Sparkles,
  Puzzle,
  Plug,
  TestTube,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AdminModule } from '@/types/admin';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ModuleSettingsForm } from '@/components/admin/ModuleSettingsForm';

interface ModuleToggleProps {
  modules: AdminModule[];
  onToggle: (moduleId: string) => void;
  onConfigure?: (moduleId: string) => void;
  onSaveSettings?: (moduleId: string, settings: Record<string, unknown>) => void;
  canEdit: boolean;
}

const CATEGORY_CONFIG: Record<AdminModule['category'], { icon: React.ReactNode; label: string; color: string }> = {
  core: { icon: <Puzzle className="w-4 h-4" />, label: 'Core', color: 'bg-info/10 text-info' },
  ai: { icon: <Sparkles className="w-4 h-4" />, label: 'AI Features', color: 'bg-purple-100 text-purple-700' },
  integration: { icon: <Plug className="w-4 h-4" />, label: 'Integration', color: 'bg-success/10 text-success' },
  pilot: { icon: <TestTube className="w-4 h-4" />, label: 'Pilot', color: 'bg-amber-100 text-amber-700' }
};

export function ModuleToggle({ modules, onToggle, onConfigure, onSaveSettings, canEdit }: ModuleToggleProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, AdminModule[]>);

  const handleToggle = (module: AdminModule) => {
    // Check dependencies
    if (!module.enabled && module.dependencies) {
      const missingDeps = module.dependencies.filter(
        depId => !modules.find(m => m.id === depId)?.enabled
      );
      if (missingDeps.length > 0) {
        const depNames = missingDeps.map(
          depId => modules.find(m => m.id === depId)?.name || depId
        ).join(', ');
        if (!confirm(`This module requires: ${depNames}. Enable dependencies first?`)) {
          return;
        }
        // Enable dependencies
        missingDeps.forEach(depId => onToggle(depId));
      }
    }

    // Confirm destructive action
    if (module.enabled) {
      if (!confirm(`Disable ${module.name}? Users will lose access to this feature.`)) {
        return;
      }
    }

    onToggle(module.id);
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedModules).map(([category, categoryModules]) => {
        const config = CATEGORY_CONFIG[category as AdminModule['category']];
        return (
          <Card key={category} variant="glass" hoverEffect={false} className="bg-card/80 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded', config.color)}>
                  {config.icon}
                </div>
                <h3 className="font-semibold text-foreground">{config.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {categoryModules.filter(m => m.enabled).length}/{categoryModules.length} active
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-border">
              {categoryModules.map((module) => {
                const isExpanded = expandedModule === module.id;
                const hasDependencyIssue = module.dependencies?.some(
                  depId => !modules.find(m => m.id === depId)?.enabled
                );

                return (
                  <div key={module.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{module.name}</h4>
                          {module.enabled && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              Active
                            </Badge>
                          )}
                          {hasDependencyIssue && !module.enabled && (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Requires dependencies
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        
                        {module.dependencies && (
                          <p className="text-xs text-muted-foreground/60 mt-2">
                            Depends on: {module.dependencies.map(
                              depId => modules.find(m => m.id === depId)?.name || depId
                            ).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {module.configurable && module.enabled && onConfigure && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onConfigure(module.id)}
                            className="text-muted-foreground"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <button
                          onClick={() => handleToggle(module)}
                          disabled={!canEdit}
                          className={cn(
                            'transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed',
                            module.enabled ? 'text-primary' : 'text-muted-foreground/30'
                          )}
                          aria-label={`Toggle ${module.name}`}
                        >
                          {module.enabled 
                            ? <ToggleRight className="w-10 h-10" /> 
                            : <ToggleLeft className="w-10 h-10" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Expandable settings */}
                    {module.settings && module.enabled && module.configurable && (
                      <>
                        <button
                          onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'Hide settings' : 'Show settings'}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                {onSaveSettings ? (
                                  <ModuleSettingsForm
                                    moduleId={module.id}
                                    moduleName={module.name}
                                    settings={module.settings as Record<string, unknown>}
                                    onSave={onSaveSettings}
                                    disabled={!canEdit}
                                  />
                                ) : (
                                  <pre className="text-xs text-muted-foreground font-mono">
                                    {JSON.stringify(module.settings, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
