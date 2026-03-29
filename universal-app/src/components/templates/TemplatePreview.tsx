'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Layers,
  Check,
  Lock,
  ArrowRight,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Template, 
  CATEGORY_META,
  MEETING_TYPE_META,
  SECTION_TYPE_META
} from '@/lib/templates/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TemplatePreviewProps {
  template: Template;
  onSelect?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  showFullDetails?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TemplatePreview({
  template,
  onSelect,
  onEdit,
  compact = false,
  showFullDetails = false,
  className,
}: TemplatePreviewProps) {
  // Get icon component
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[template.icon] || Icons.FileText;
  
  // Get category and meeting type info
  const categoryMeta = CATEGORY_META[template.category];
  const meetingTypeMeta = MEETING_TYPE_META[template.meetingType];

  // Required sections count
  const requiredCount = template.sections.filter(s => s.required).length;
  const lockedCount = template.sections.filter(s => s.locked).length;

  return (
    <Card
      variant="glass"
      className={cn(
        'overflow-hidden',
        compact ? 'p-4' : 'p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="p-4 rounded-xl"
          style={{ 
            backgroundColor: `${template.color || categoryMeta?.color || '#64748b'}15`,
            color: template.color || categoryMeta?.color || '#64748b'
          }}
        >
          <IconComponent className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{template.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ 
                backgroundColor: `${categoryMeta?.color || '#64748b'}15`,
                color: categoryMeta?.color || '#64748b'
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryMeta?.color || '#64748b' }}
              />
              {categoryMeta?.label}
            </span>
            
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-medium">
              {meetingTypeMeta?.shortLabel || template.meetingType}
            </span>

            {template.isSystem && (
              <span className="px-2.5 py-1 bg-info/10 text-info rounded-lg text-xs font-medium">
                System Template
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-foreground">{template.sections.length}</div>
          <div className="text-xs text-muted-foreground">Sections</div>
        </div>
        
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-foreground">{requiredCount}</div>
          <div className="text-xs text-muted-foreground">Required</div>
        </div>
        
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-foreground">{template.estimatedDuration || '–'}</div>
          <div className="text-xs text-muted-foreground">Minutes</div>
        </div>
      </div>

      {/* Long description */}
      {showFullDetails && template.longDescription && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold text-foreground mb-2">About this template</h3>
          <p className="text-sm text-muted-foreground">{template.longDescription}</p>
        </div>
      )}

      {/* Sections list */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          Sections
          {lockedCount > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({lockedCount} locked)
            </span>
          )}
        </h3>
        
        <div className={cn(
          'space-y-2',
          !showFullDetails && !compact && 'max-h-64 overflow-y-auto pr-2'
        )}>
          {template.sections.map((section, index) => {
            const sectionMeta = SECTION_TYPE_META[section.type];
            const SectionIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[section.icon || sectionMeta?.icon || 'FileText'] || Icons.FileText;
            
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  'bg-card border border-border',
                  'hover:border-border hover:shadow-sm transition-all'
                )}
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <SectionIcon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {section.title}
                    </span>
                    {section.required && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">
                        Required
                      </span>
                    )}
                    {section.locked && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  
                  {showFullDetails && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {section.prompt}
                    </p>
                  )}
                  
                  {section.helpText && !showFullDetails && (
                    <p className="text-xs text-muted-foreground mt-0.5">{section.helpText}</p>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground font-mono">
                  #{section.order}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {(onSelect || onEdit) && (
        <div className="flex gap-3 pt-4 border-t border-border">
          {onSelect && (
            <Button
              onClick={onSelect}
              className="flex-1 gap-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600"
            >
              Use Template
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {onEdit && !template.isSystem && (
            <Button
              variant="outline"
              onClick={onEdit}
              className="gap-2"
            >
              <Icons.Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      )}

      {/* Version & metadata */}
      {showFullDetails && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <span>Version {template.version}</span>
          <span>
            Updated{' '}
            {new Date(template.updatedAt).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </Card>
  );
}

export default TemplatePreview;
