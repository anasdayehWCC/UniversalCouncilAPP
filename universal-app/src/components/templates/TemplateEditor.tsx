'use client';

import React, { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  Lock,
  Unlock,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplateSectionEditor } from './TemplateSectionEditor';
import { 
  Template, 
  TemplateSection,
  TemplateCategory,
  TemplateMeetingType,
  CATEGORY_META,
  MEETING_TYPE_META,
  CreateTemplateRequest,
  UpdateTemplateRequest
} from '@/lib/templates/types';
import { ServiceDomain } from '@/config/domains';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TemplateEditorProps {
  /** Template to edit (undefined for new template) */
  template?: Template;
  /** Called when template is saved */
  onSave: (data: CreateTemplateRequest | UpdateTemplateRequest) => Promise<void>;
  /** Called when editor is cancelled */
  onCancel: () => void;
  /** Loading state */
  isSaving?: boolean;
  /** Class name */
  className?: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  meetingType?: string;
  domain?: string;
  sections?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TemplateEditor({
  template,
  onSave,
  onCancel,
  isSaving = false,
  className,
}: TemplateEditorProps) {
  const isEditing = !!template;

  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [longDescription, setLongDescription] = useState(template?.longDescription || '');
  const [category, setCategory] = useState<TemplateCategory | ''>(template?.category || '');
  const [meetingType, setMeetingType] = useState<TemplateMeetingType | ''>(template?.meetingType || '');
  const [domain, setDomain] = useState<ServiceDomain | 'all'>(template?.domain || 'children');
  const [icon, setIcon] = useState(template?.icon || 'FileText');
  const [color, setColor] = useState(template?.color || '#64748b');
  const [estimatedDuration, setEstimatedDuration] = useState(template?.estimatedDuration || 60);
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [sections, setSections] = useState<TemplateSection[]>(
    template?.sections || []
  );

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Categories and meeting types for dropdowns
  const categories = Object.values(CATEGORY_META);
  const meetingTypes = Object.values(MEETING_TYPE_META);

  // Available icons
  const availableIcons = [
    'Home', 'Users', 'Shield', 'Heart', 'ClipboardCheck', 'FileText',
    'Target', 'Briefcase', 'GraduationCap', 'Building', 'MessageCircle',
    'Calendar', 'Clock', 'AlertTriangle', 'Check', 'Star'
  ];

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!category) {
      newErrors.category = 'Category is required';
    }
    if (!meetingType) {
      newErrors.meetingType = 'Meeting type is required';
    }
    if (sections.length === 0) {
      newErrors.sections = 'At least one section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, description, category, meetingType, sections]);

  // Handle save
  const handleSave = async () => {
    if (!validate()) return;

    const data = isEditing
      ? {
          name,
          description,
          longDescription: longDescription || undefined,
          category: category as TemplateCategory,
          meetingType: meetingType as TemplateMeetingType,
          domain,
          icon,
          color,
          estimatedDuration,
          tags,
          sections,
        } as UpdateTemplateRequest
      : {
          name,
          description,
          longDescription: longDescription || undefined,
          category: category as TemplateCategory,
          meetingType: meetingType as TemplateMeetingType,
          domain,
          icon,
          color,
          estimatedDuration,
          tags,
          sections: sections.map(({ id, ...rest }) => rest),
        } as CreateTemplateRequest;

    await onSave(data);
  };

  // Add section
  const handleAddSection = () => {
    const newSection: TemplateSection = {
      id: `temp-${Date.now()}`,
      type: 'narrative',
      title: 'New Section',
      prompt: '',
      required: false,
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  // Update section
  const handleUpdateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  // Remove section
  const handleRemoveSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section?.locked) return;

    setSections(
      sections
        .filter(s => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  // Reorder sections
  const handleReorderSections = (reorderedSections: TemplateSection[]) => {
    setSections(
      reorderedSections.map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Get icon component
  const getIcon = (iconName: string) => {
    return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.FileText;
  };

  const SelectedIcon = getIcon(icon);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-slate-500 mt-1">
            {isEditing
              ? 'Update the template configuration and sections'
              : 'Define a new template for meeting minutes'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-slate-900 to-slate-700 text-white"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
              </motion.div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Home Visit Report"
                  className={cn(errors.name && 'border-red-500')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label htmlFor="description">Short Description *</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of when to use this template"
                  className={cn(errors.description && 'border-red-500')}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Long Description */}
              <div className="md:col-span-2">
                <Label htmlFor="longDescription">Detailed Description</Label>
                <textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Provide more context about this template..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className={cn(
                    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10',
                    errors.category && 'border-red-500'
                  )}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Meeting Type */}
              <div>
                <Label htmlFor="meetingType">Meeting Type *</Label>
                <select
                  id="meetingType"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as TemplateMeetingType)}
                  className={cn(
                    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10',
                    errors.meetingType && 'border-red-500'
                  )}
                >
                  <option value="">Select type...</option>
                  {meetingTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.label}
                    </option>
                  ))}
                </select>
                {errors.meetingType && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.meetingType}
                  </p>
                )}
              </div>

              {/* Domain */}
              <div>
                <Label htmlFor="domain">Service Domain</Label>
                <select
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as ServiceDomain | 'all')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="all">All Domains</option>
                  <option value="children">Children&apos;s Services</option>
                  <option value="adults">Adult Social Care</option>
                  <option value="housing">Housing</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Est. Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 60)}
                />
              </div>
            </div>
          </Card>

          {/* Sections */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Sections</h3>
                <p className="text-sm text-slate-500">
                  Define the sections that will make up the meeting minutes
                </p>
              </div>
              <Button onClick={handleAddSection} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Section
              </Button>
            </div>

            {errors.sections && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.sections}
              </div>
            )}

            {sections.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                <Icons.Layers className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">No sections yet</p>
                <Button onClick={handleAddSection} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Section
                </Button>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={sections}
                onReorder={handleReorderSections}
                className="space-y-3"
              >
                {sections.map((section) => (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={cn(
                      'p-4 bg-white border rounded-lg cursor-move transition-all',
                      activeSection === section.id
                        ? 'border-slate-400 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1 text-slate-400 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {activeSection === section.id ? (
                        <TemplateSectionEditor
                          section={section}
                          onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                          onClose={() => setActiveSection(null)}
                          className="flex-1"
                        />
                      ) : (
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setActiveSection(section.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {section.title}
                            </span>
                            {section.required && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">
                                Required
                              </span>
                            )}
                            {section.locked && (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {section.prompt || 'Click to edit...'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateSection(section.id, { locked: !section.locked })}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                          title={section.locked ? 'Unlock section' : 'Lock section'}
                        >
                          {section.locked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleRemoveSection(section.id)}
                          disabled={section.locked}
                          className={cn(
                            'p-2 rounded-lg',
                            section.locked
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          )}
                          title="Remove section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </Card>
        </div>

        {/* Sidebar - Appearance */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Appearance</h3>

            {/* Icon */}
            <div className="mb-4">
              <Label>Icon</Label>
              <div className="relative">
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <SelectedIcon className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-slate-700">{icon}</span>
                </button>

                {showIconPicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-10">
                    <div className="grid grid-cols-4 gap-2">
                      {availableIcons.map((iconName) => {
                        const IconComp = getIcon(iconName);
                        return (
                          <button
                            key={iconName}
                            onClick={() => {
                              setIcon(iconName);
                              setShowIconPicker(false);
                            }}
                            className={cn(
                              'p-3 rounded-lg hover:bg-slate-100 transition-colors',
                              icon === iconName && 'bg-slate-100 ring-2 ring-slate-300'
                            )}
                          >
                            <IconComp className="w-5 h-5 mx-auto text-slate-600" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Color */}
            <div className="mb-4">
              <Label>Color</Label>
              <div className="flex gap-2">
                {['#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#64748b'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-transform hover:scale-110',
                      color === c && 'ring-2 ring-offset-2 ring-slate-400'
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-4 h-4 text-white mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button variant="outline" size="default" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Preview card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Preview</h3>
            <div
              className="p-4 rounded-xl"
              style={{ 
                backgroundColor: `${color}10`,
                borderLeft: `4px solid ${color}`
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <SelectedIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {name || 'Template Name'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {sections.length} sections · {estimatedDuration}m
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {description || 'Template description...'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TemplateEditor;
