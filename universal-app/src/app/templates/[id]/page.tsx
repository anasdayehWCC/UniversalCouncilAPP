'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { TemplatePreview, TemplateEditor } from '@/components/templates';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, UpdateTemplateRequest, CreateTemplateRequest } from '@/lib/templates/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const { currentUser, config } = useDemo();
  
  const {
    getTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    isLoading,
  } = useTemplates();

  const [template, setTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template
  useEffect(() => {
    const t = getTemplate(templateId);
    if (t) {
      setTemplate(t);
    } else {
      setError('Template not found');
    }
  }, [templateId, getTemplate]);

  // Check permissions
  const canEdit = currentUser.role === 'admin' && template && !template.isSystem;
  const canDelete = currentUser.role === 'admin' && template && !template.isSystem;
  const canDuplicate = currentUser.role === 'admin';

  // Handle save
  const handleSave = useCallback(async (data: CreateTemplateRequest | UpdateTemplateRequest) => {
    if (!template) return;
    
    setIsSaving(true);
    try {
      // When editing existing template, data will be UpdateTemplateRequest at runtime
      const updated = await updateTemplate(template.id, data as UpdateTemplateRequest);
      setTemplate(updated);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  }, [template, updateTemplate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!template) return;
    
    try {
      await deleteTemplate(template.id);
      router.push('/templates');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template');
    }
  }, [template, deleteTemplate, router]);

  // Handle duplicate
  const handleDuplicate = useCallback(async () => {
    if (!template) return;
    
    try {
      const duplicated = await duplicateTemplate(template.id);
      router.push(`/templates/${duplicated.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to duplicate template');
    }
  }, [template, duplicateTemplate, router]);

  // Handle use template
  const handleUseTemplate = useCallback(() => {
    if (template) {
      router.push(`/record?templateId=${template.id}`);
    }
  }, [template, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {error || 'Template not found'}
          </h2>
          <p className="text-slate-500 mb-6">
            The template you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Link href="/templates">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <TemplateEditor
        template={template}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Templates
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{template.name}</h1>
            <p className="text-slate-500">{template.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {canDuplicate && (
            <Button variant="outline" onClick={handleDuplicate} className="gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsEditing(true)} className="gap-2 bg-slate-900 text-white">
              <Edit className="w-4 h-4" />
              Edit Template
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Template preview */}
      <div className="max-w-3xl">
        <TemplatePreview
          template={template}
          onSelect={handleUseTemplate}
          showFullDetails
        />
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Template</h3>
                  <p className="text-slate-500 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <strong>{template.name}</strong>? 
                Any meetings using this template will not be affected, but you won&apos;t be 
                able to create new meetings with it.
              </p>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete Template
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
