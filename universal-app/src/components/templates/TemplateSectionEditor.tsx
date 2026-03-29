'use client';

import React from 'react';
import { 
  Check,
  X,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  TemplateSection,
  SectionContentType,
  SECTION_TYPE_META
} from '@/lib/templates/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TemplateSectionEditorProps {
  section: TemplateSection;
  onUpdate: (updates: Partial<TemplateSection>) => void;
  onClose: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TemplateSectionEditor({
  section,
  onUpdate,
  onClose,
  className,
}: TemplateSectionEditorProps) {
  const sectionTypes = Object.entries(SECTION_TYPE_META).map(([id, meta]) => ({
    id: id as SectionContentType,
    ...meta,
  }));

  // Get icon for section type
  const getIcon = (iconName: string) => {
    return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.FileText;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Edit Section</h4>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="h-8"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="w-3 h-3 mr-1" />
            Done
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <Label htmlFor="section-title" className="text-xs">Section Title</Label>
          <Input
            id="section-title"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Section title"
            className="h-9"
          />
        </div>

        {/* Type */}
        <div>
          <Label htmlFor="section-type" className="text-xs">Content Type</Label>
          <select
            id="section-type"
            value={section.type}
            onChange={(e) => onUpdate({ type: e.target.value as SectionContentType })}
            className="w-full h-9 px-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sectionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt */}
      <div>
        <Label htmlFor="section-prompt" className="text-xs">AI Prompt</Label>
        <textarea
          id="section-prompt"
          value={section.prompt}
          onChange={(e) => onUpdate({ prompt: e.target.value })}
          placeholder="Instructions for AI to generate content for this section..."
          rows={3}
          className="w-full px-3 py-2 border border-input rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">
          This prompt will guide the AI when generating content for this section.
        </p>
      </div>

      {/* Help Text */}
      <div>
        <Label htmlFor="section-help" className="text-xs">Help Text (optional)</Label>
        <Input
          id="section-help"
          value={section.helpText || ''}
          onChange={(e) => onUpdate({ helpText: e.target.value || undefined })}
          placeholder="Brief guidance for users editing this section"
          className="h-9"
        />
      </div>

      {/* Options row */}
      <div className="flex flex-wrap gap-4">
        {/* Required */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={section.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
          />
          <span className="text-sm text-foreground">Required section</span>
        </label>

        {/* Locked */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={section.locked || false}
            onChange={(e) => onUpdate({ locked: e.target.checked })}
            className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
          />
          <span className="text-sm text-foreground">Lock section (cannot be removed)</span>
        </label>
      </div>

      {/* Word limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min-words" className="text-xs">Min Words</Label>
          <Input
            id="min-words"
            type="number"
            min={0}
            value={section.minWords || ''}
            onChange={(e) => onUpdate({ minWords: parseInt(e.target.value) || undefined })}
            placeholder="Optional"
            className="h-9"
          />
        </div>
        <div>
          <Label htmlFor="max-words" className="text-xs">Max Words</Label>
          <Input
            id="max-words"
            type="number"
            min={0}
            value={section.maxWords || ''}
            onChange={(e) => onUpdate({ maxWords: parseInt(e.target.value) || undefined })}
            placeholder="Optional"
            className="h-9"
          />
        </div>
      </div>

      {/* Icon selector */}
      <div>
        <Label className="text-xs">Section Icon</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['FileText', 'Users', 'Home', 'MessageCircle', 'Shield', 'AlertTriangle', 'Check', 'List', 'Target', 'Heart', 'Clock', 'Briefcase'].map((iconName) => {
            const IconComp = getIcon(iconName);
            return (
              <button
                key={iconName}
                onClick={() => onUpdate({ icon: iconName })}
                className={cn(
                  'p-2 rounded-lg hover:bg-muted/50 transition-colors',
                  section.icon === iconName && 'bg-muted ring-2 ring-border'
                )}
                title={iconName}
              >
                <IconComp className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 bg-muted rounded-lg border border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
        <div className="flex items-center gap-2">
          {section.icon && React.createElement(getIcon(section.icon), { className: 'w-4 h-4 text-muted-foreground' })}
          <span className="text-sm font-medium text-foreground">{section.title || 'Section Title'}</span>
          {section.required && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">
              Required
            </span>
          )}
        </div>
        {section.helpText && (
          <p className="text-xs text-muted-foreground mt-1 ml-6">{section.helpText}</p>
        )}
      </div>
    </div>
  );
}

export default TemplateSectionEditor;
