'use client';

import React, { useState, useCallback } from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import { AdminTemplate } from '@/types/admin';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Star,
  FileText,
  MoreVertical,
  X,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dates';

const DOMAIN_COLORS: Record<string, string> = {
  children: 'bg-primary/10 text-primary border-primary/30',
  adults: 'bg-info/10 text-info border-info/30',
  housing: 'bg-amber-100 text-amber-700 border-amber-200',
  corporate: 'bg-muted text-muted-foreground border-border'
};

const DOMAIN_LABELS: Record<string, string> = {
  children: "Children's Services",
  adults: 'Adult Social Care',
  housing: 'Housing Services',
  corporate: 'Corporate',
};

// ---- Template Edit Dialog ----

interface TemplateEditDialogProps {
  template: AdminTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<AdminTemplate>) => void;
}

function TemplateEditDialog({ template, open, onOpenChange, onSave }: TemplateEditDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState('');

  // Sync local state when template changes
  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setSections([...template.sections]);
      setNewSection('');
    }
  }, [template]);

  const handleAddSection = () => {
    const trimmed = newSection.trim();
    if (trimmed && !sections.includes(trimmed)) {
      setSections(prev => [...prev, trimmed]);
      setNewSection('');
    }
  };

  const handleRemoveSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    setSections(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    if (!template || !name.trim()) return;
    onSave(template.id, {
      name: name.trim(),
      description: description.trim(),
      sections,
    });
    onOpenChange(false);
  };

  if (!template) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Template</AlertDialogTitle>
          <AlertDialogDescription>
            Update the template details and sections.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Sections</Label>
            <div className="space-y-1.5">
              {sections.map((section, index) => (
                <div
                  key={`${section}-${index}`}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1">{section}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      aria-label={`Move ${section} up`}
                    >
                      <span className="text-xs">&uarr;</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      aria-label={`Move ${section} down`}
                    >
                      <span className="text-xs">&darr;</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveSection(index)}
                      aria-label={`Remove ${section}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Add a section..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection(); } }}
                aria-label="New section name"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSection}
                disabled={!newSection.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---- Main Page ----

export default function TemplatesPage() {
  const {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    canManageTemplates,
    tenantConfig,
  } = useAdmin();
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredTemplates = templates.filter(t =>
    search === '' ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  // Group by domain
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.domain]) acc[template.domain] = [];
    acc[template.domain].push(template);
    return acc;
  }, {} as Record<string, AdminTemplate[]>);

  const handleDelete = (template: AdminTemplate) => {
    if (template.isDefault) {
      error('Cannot delete the default template');
      return;
    }
    if (confirm(`Delete template "${template.name}"?`)) {
      deleteTemplate(template.id);
      success('Template deleted');
    }
  };

  const handleDuplicate = useCallback((template: AdminTemplate) => {
    addTemplate({
      name: `Copy of ${template.name}`,
      description: template.description,
      domain: template.domain,
      sections: [...template.sections],
      isDefault: false,
    });
    success(`Duplicated "${template.name}"`);
  }, [addTemplate, success]);

  const handleEdit = useCallback((template: AdminTemplate) => {
    setEditingTemplate(template);
    setIsEditOpen(true);
  }, []);

  const handleEditSave = useCallback((id: string, updates: Partial<AdminTemplate>) => {
    updateTemplate(id, updates);
    success('Template updated');
  }, [updateTemplate, success]);

  const handleSetDefault = useCallback((template: AdminTemplate) => {
    // Unset previous default in the same domain, then set this one
    templates
      .filter(t => t.domain === template.domain && t.isDefault && t.id !== template.id)
      .forEach(t => updateTemplate(t.id, { isDefault: false }));
    updateTemplate(template.id, { isDefault: true });
    success(`"${template.name}" is now the default for ${DOMAIN_LABELS[template.domain] || template.domain}`);
  }, [templates, updateTemplate, success]);

  return (
    <AdminPageWrapper
      title="Templates"
      description={`Manage minute templates for ${tenantConfig.name}`}
      action={
        canManageTemplates && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Templates by Domain */}
        {Object.entries(groupedTemplates).map(([domain, domainTemplates]) => (
          <div key={domain}>
            <h3 className="font-semibold text-foreground mb-3 capitalize">
              {DOMAIN_LABELS[domain] || domain.charAt(0).toUpperCase() + domain.slice(1)}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domainTemplates.map(template => (
                <Card
                  key={template.id}
                  variant="glass"
                  className="p-4 bg-card/80 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{template.name}</h4>
                          {template.isDefault && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                      </div>
                    </div>

                    {canManageTemplates && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setActiveMenu(activeMenu === template.id ? null : template.id)}
                          aria-label={`Template options for ${template.name}`}
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>

                        {activeMenu === template.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                              onClick={() => {
                                handleEdit(template);
                                setActiveMenu(null);
                              }}
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                              onClick={() => {
                                handleDuplicate(template);
                                setActiveMenu(null);
                              }}
                            >
                              <Copy className="w-4 h-4" /> Duplicate
                            </button>
                            {!template.isDefault && (
                              <button
                                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                                onClick={() => {
                                  handleSetDefault(template);
                                  setActiveMenu(null);
                                }}
                              >
                                <Star className="w-4 h-4" /> Set as default
                              </button>
                            )}
                            {!template.isDefault && (
                              <button
                                className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                onClick={() => {
                                  handleDelete(template);
                                  setActiveMenu(null);
                                }}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sections */}
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Sections:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.sections.slice(0, 3).map((section, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-muted">
                          {section}
                        </Badge>
                      ))}
                      {template.sections.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          +{template.sections.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated {formatDistanceToNow(new Date(template.updatedAt))}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', DOMAIN_COLORS[template.domain])}
                    >
                      {template.domain}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No templates found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Template Edit Dialog */}
      <TemplateEditDialog
        template={editingTemplate}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleEditSave}
      />
    </AdminPageWrapper>
  );
}
