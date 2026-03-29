'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Clock, 
  ChevronRight,
  Check
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { 
  Template, 
  TemplateWithPreferences,
  CATEGORY_META,
  MEETING_TYPE_META
} from '@/lib/templates/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TemplateCardProps {
  template: Template | TemplateWithPreferences;
  onSelect: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  isSelected?: boolean;
  viewMode?: 'grid' | 'list';
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TemplateCard({
  template,
  onSelect,
  onToggleFavorite,
  isFavorite = false,
  isSelected = false,
  viewMode = 'grid',
  compact = false,
  showActions = true,
  className,
}: TemplateCardProps) {
  // Get icon component
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[template.icon] || Icons.FileText;
  
  // Get category and meeting type info
  const categoryMeta = CATEGORY_META[template.category];
  const meetingTypeMeta = MEETING_TYPE_META[template.meetingType];
  
  // Check if template has preference data
  const hasPreferences = 'isFavorite' in template;
  const lastUsed = hasPreferences ? (template as TemplateWithPreferences).lastUsed : undefined;

  // Format last used date
  const formatLastUsed = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  // List view
  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          'p-4 cursor-pointer transition-all duration-200 group',
          'hover:shadow-md hover:border-border',
          isSelected && 'border-2 border-primary bg-primary/5',
          className
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="p-3 rounded-xl transition-colors"
            style={{ 
              backgroundColor: `${template.color || categoryMeta?.color || '#64748b'}15`,
              color: template.color || categoryMeta?.color || '#64748b'
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
              {template.isSystem && (
                <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  System
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{template.description}</p>
          </div>

          {/* Category badge */}
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ 
              backgroundColor: `${categoryMeta?.color || '#64748b'}15`,
              color: categoryMeta?.color || '#64748b'
            }}
          >
            {meetingTypeMeta?.shortLabel || template.meetingType}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Star
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isFavorite ? 'text-warning fill-warning' : 'text-muted'
                    )}
                  />
                </button>
              )}
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-muted-foreground transition-colors" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card
      className={cn(
        'p-5 cursor-pointer transition-all duration-300 group flex flex-col h-full relative overflow-hidden',
        'hover:shadow-lg hover:-translate-y-0.5',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        compact && 'p-4',
        className
      )}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Favorite button */}
      {showActions && onToggleFavorite && !isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-lg transition-all duration-200',
            isFavorite
              ? 'bg-warning/10 text-warning'
              : 'bg-transparent text-muted opacity-0 group-hover:opacity-100 hover:bg-muted/50 hover:text-muted-foreground'
          )}
        >
          <Star
            className={cn(
              'w-4 h-4',
              isFavorite && 'fill-warning'
            )}
          />
        </button>
      )}

      {/* Icon & Category */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'p-3 rounded-xl transition-all duration-200',
            'group-hover:scale-105'
          )}
          style={{ 
            backgroundColor: `${template.color || categoryMeta?.color || '#64748b'}15`,
            color: template.color || categoryMeta?.color || '#64748b'
          }}
        >
          <IconComponent className={cn('w-6 h-6', compact && 'w-5 h-5')} />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className={cn(
        'font-bold text-foreground mb-2',
        compact ? 'text-base' : 'text-lg'
      )}>
        {template.name}
      </h3>
      <p className={cn(
        'text-muted-foreground flex-1',
        compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3',
        'mb-4'
      )}>
        {template.description}
      </p>

      {/* Sections preview */}
      {!compact && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sections
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.sections.slice(0, 4).map((section, i) => (
              <span
                key={section.id || i}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded border border-border">
              >
                {section.title}
              </span>
            ))}
            {template.sections.length > 4 && (
              <span className="text-xs text-muted-foreground px-1 py-1">
                +{template.sections.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ 
              backgroundColor: `${categoryMeta?.color || '#64748b'}10`,
              color: categoryMeta?.color || '#64748b'
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: categoryMeta?.color || '#64748b' }}
            />
            {categoryMeta?.label || template.category}
          </span>
          
          {template.isSystem && (
            <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-lg">
              System
            </span>
          )}
        </div>

        {/* Last used */}
        {lastUsed && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatLastUsed(lastUsed)}
          </div>
        )}

        {/* Duration */}
        {!lastUsed && template.estimatedDuration && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            ~{template.estimatedDuration}m
          </div>
        )}
      </div>
    </Card>
  );
}

export default TemplateCard;
