'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  MinuteSection as MinuteSectionType, 
  SectionType,
  EvidenceLink,
  SECTION_TYPES 
} from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  GripVertical,
  FileText,
  ListChecks,
  CheckSquare,
  Gavel,
  Users,
  AlertTriangle,
  Shield,
  ArrowRight,
  Quote,
  Trash2,
  Plus
} from 'lucide-react';
import { EvidencePopover } from './EvidencePopover';

interface MinuteSectionProps {
  section: MinuteSectionType;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<MinuteSectionType>) => void;
  onRemove?: () => void;
  onAddEvidence?: (evidence: Omit<EvidenceLink, 'id'>) => void;
  onRemoveEvidence?: (evidenceId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  className?: string;
}

const SECTION_ICONS: Record<SectionType, React.FC<{ className?: string }>> = {
  summary: FileText,
  keyPoints: ListChecks,
  actionItems: CheckSquare,
  decisions: Gavel,
  attendees: Users,
  risks: AlertTriangle,
  safeguarding: Shield,
  nextSteps: ArrowRight
};

export function MinuteSection({
  section,
  isEditing = false,
  onUpdate,
  onRemove,
  onAddEvidence,
  onRemoveEvidence,
  isDragging,
  dragHandleProps,
  className
}: MinuteSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.isCollapsed ?? false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const SectionIcon = SECTION_ICONS[section.type];
  const typeConfig = SECTION_TYPES[section.type];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [section.content, isEditing]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate?.({ content: e.target.value });
  }, [onUpdate]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.({ title: e.target.value });
  }, [onUpdate]);

  // Simple markdown to HTML (bold, italic, lists)
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    
    return lines.map((line, i) => {
      // Handle list items
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-300">
            {renderInlineMarkdown(line.substring(2))}
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <li key={i} className="ml-4 list-decimal text-slate-700 dark:text-slate-300">
            {renderInlineMarkdown(line.replace(/^\d+\. /, ''))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return (
        <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Bold: **text** or __text__
    // Italic: *text* or _text_
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all duration-200',
        'bg-white dark:bg-slate-900',
        isDragging 
          ? 'shadow-lg border-[var(--accent)] ring-2 ring-[var(--accent)]/20' 
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        isEditing && 'ring-1 ring-[var(--primary)]/10',
        className
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        {/* Drag Handle */}
        {isEditing && (
          <div 
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Section Icon */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'bg-[var(--primary-soft)]'
        )}>
          <SectionIcon className="w-4 h-4 text-[var(--primary)]" />
        </div>

        {/* Section Title */}
        {isEditing ? (
          <input
            type="text"
            value={section.title}
            onChange={handleTitleChange}
            className={cn(
              'flex-1 text-base font-semibold bg-transparent border-none outline-none',
              'text-slate-900 dark:text-white',
              'placeholder:text-slate-400'
            )}
            placeholder={typeConfig.label}
          />
        ) : (
          <h3 className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
            {section.title}
          </h3>
        )}

        {/* Evidence Count */}
        {section.evidence.length > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Quote className="w-3 h-3" />
            {section.evidence.length}
          </span>
        )}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>

        {/* Remove Button */}
        {isEditing && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-4">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={section.content}
              onChange={handleContentChange}
              className={cn(
                'w-full min-h-[100px] p-3 rounded-lg border resize-none',
                'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                'text-slate-700 dark:text-slate-300',
                'placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
                'font-mono text-sm leading-relaxed'
              )}
              placeholder="Enter section content... (Markdown supported)"
            />
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {renderContent(section.content)}
            </div>
          )}

          {/* Evidence Citations */}
          {section.evidence.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Supporting Evidence
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {section.evidence.map((ev) => (
                  <EvidencePopover
                    key={ev.id}
                    evidence={ev}
                    onRemove={isEditing ? () => onRemoveEvidence?.(ev.id) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add Evidence Button */}
          {isEditing && onAddEvidence && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => {
                // In a real app, this would open a dialog to select transcript excerpt
                onAddEvidence({
                  text: 'Select text from transcript...',
                  transcriptStart: 0,
                  transcriptEnd: 5,
                  timestamp: '00:00:00'
                });
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Link Evidence
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
