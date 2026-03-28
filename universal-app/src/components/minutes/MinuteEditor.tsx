'use client';

import React, { useState, useCallback } from 'react';
import { 
  Minute, 
  ActionItem,
  MinuteSection as MinuteSectionType, 
  SectionType,
  SECTION_TYPES,
  EvidenceLink
} from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MinuteSection } from './MinuteSection';
import { ActionItemList } from './ActionItemList';
import { MinuteStatusBadge } from './MinuteStatusBadge';
import { MinutePreview } from './MinutePreview';
import { 
  Save, 
  Send, 
  Eye, 
  Edit3, 
  Plus,
  Undo,
  Redo,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  ListChecks,
  CheckSquare,
  Gavel,
  Shield,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

interface MinuteEditorProps {
  minute: Minute;
  isEditing?: boolean;
  isSaving?: boolean;
  isDirty?: boolean;
  lastSaved?: Date | null;
  onUpdate?: (updates: Partial<Minute>) => void;
  onUpdateSection?: (sectionId: string, updates: Partial<MinuteSectionType>) => void;
  onAddSection?: (section: Omit<MinuteSectionType, 'id'>) => void;
  onRemoveSection?: (sectionId: string) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  onAddEvidence?: (sectionId: string, evidence: Omit<EvidenceLink, 'id'>) => void;
  onRemoveEvidence?: (sectionId: string, evidenceId: string) => void;
  onAddActionItem?: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateActionItem?: (itemId: string, updates: Partial<ActionItem>) => void;
  onRemoveActionItem?: (itemId: string) => void;
  onSave?: () => Promise<void>;
  onSubmitForReview?: () => Promise<void>;
  onApprove?: () => Promise<void>;
  onRequestChanges?: (reason: string) => Promise<void>;
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

export function MinuteEditor({
  minute,
  isEditing: isEditingProp = true,
  isSaving = false,
  isDirty = false,
  lastSaved,
  onUpdate,
  onUpdateSection,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  onAddEvidence,
  onRemoveEvidence,
  onAddActionItem,
  onUpdateActionItem,
  onRemoveActionItem,
  onSave,
  onSubmitForReview,
  onApprove,
  onRequestChanges,
  className
}: MinuteEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showAddSection, setShowAddSection] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditingProp);

  const canEdit = minute.status === 'draft';
  const canSubmit = minute.status === 'draft' && minute.sections.length > 0;
  const canApprove = minute.status === 'pending_review';
  const canPublish = minute.status === 'approved';

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.({ title: e.target.value });
  }, [onUpdate]);

  const handleAddSection = useCallback((type: SectionType) => {
    const typeConfig = SECTION_TYPES[type];
    onAddSection?.({
      type,
      title: typeConfig.label,
      content: '',
      order: minute.sections.length,
      evidence: []
    });
    setShowAddSection(false);
  }, [minute.sections.length, onAddSection]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return lastSaved.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className={cn(
        'sticky top-0 z-10 -mx-4 px-4 py-4',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg',
        'border-b border-slate-200 dark:border-slate-700'
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <MinuteStatusBadge status={minute.status} />
            
            {isEditing && canEdit ? (
              <input
                type="text"
                value={minute.title}
                onChange={handleTitleChange}
                className={cn(
                  'flex-1 text-xl font-bold bg-transparent border-none outline-none',
                  'text-slate-900 dark:text-white',
                  'placeholder:text-slate-400',
                  'focus:ring-0'
                )}
                placeholder="Enter minute title..."
              />
            ) : (
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {minute.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save Status */}
            {lastSaved && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Saved {formatLastSaved()}
              </span>
            )}
            {isDirty && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unsaved changes
              </span>
            )}

            {/* Action Buttons */}
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || !isDirty}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>

                <Button
                  size="sm"
                  onClick={onSubmitForReview}
                  disabled={!canSubmit || isSaving}
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
              </>
            )}

            {canApprove && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const reason = prompt('Please provide feedback for changes:');
                    if (reason) onRequestChanges?.(reason);
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  onClick={onApprove}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Changes Requested Banner */}
        {minute.changesRequestedReason && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Changes Requested
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {minute.changesRequestedReason}
                </p>
                {minute.changesRequestedBy && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    By {minute.changesRequestedBy} on {new Date(minute.changesRequestedAt!).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">
            <Edit3 className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          {/* Sections */}
          <div className="space-y-4">
            {minute.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <MinuteSection
                  key={section.id}
                  section={section}
                  isEditing={isEditing && canEdit}
                  onUpdate={(updates) => onUpdateSection?.(section.id, updates)}
                  onRemove={() => onRemoveSection?.(section.id)}
                  onAddEvidence={(evidence) => onAddEvidence?.(section.id, evidence)}
                  onRemoveEvidence={(evidenceId) => onRemoveEvidence?.(section.id, evidenceId)}
                />
              ))}
          </div>

          {/* Add Section */}
          {isEditing && canEdit && (
            <div className="relative">
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowAddSection(!showAddSection)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
                <ChevronDown className={cn('w-4 h-4 ml-2 transition-transform', showAddSection && 'rotate-180')} />
              </Button>

              {showAddSection && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-20 p-2 shadow-lg">
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(SECTION_TYPES) as [SectionType, typeof SECTION_TYPES[SectionType]][]).map(([type, config]) => {
                      const Icon = SECTION_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => handleAddSection(type)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg text-left',
                            'hover:bg-slate-100 dark:hover:bg-slate-800',
                            'transition-colors'
                          )}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[var(--primary)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {config.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {config.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Action Items Section */}
          <Card variant="glass" className="p-6">
            <ActionItemList
              items={minute.actionItems}
              isEditing={isEditing && canEdit}
              onAdd={onAddActionItem}
              onUpdate={onUpdateActionItem}
              onRemove={onRemoveActionItem}
            />
          </Card>

          {/* Metadata Info */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500">
            <div className="flex items-center flex-wrap gap-4">
              <span>Template: {minute.metadata.templateName || 'Custom'}</span>
              <span>•</span>
              <span>{minute.metadata.wordCount} words</span>
              <span>•</span>
              <span>~{minute.metadata.estimatedReadTime} min read</span>
              <span>•</span>
              <span>Generated: {new Date(minute.metadata.generatedAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <MinutePreview minute={minute} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
