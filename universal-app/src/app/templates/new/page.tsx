'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { TemplateEditor } from '@/components/templates';
import { useTemplates } from '@/hooks/useTemplates';
import { CreateTemplateRequest, UpdateTemplateRequest } from '@/lib/templates/types';

export default function NewTemplatePage() {
  const router = useRouter();
  const { currentUser } = useDemo();
  const { createTemplate } = useTemplates();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  if (currentUser.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-6">
            Only administrators can create new templates.
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

  // Handle save
  const handleSave = useCallback(async (data: CreateTemplateRequest | UpdateTemplateRequest) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // When creating new template, data will be CreateTemplateRequest at runtime
      const created = await createTemplate(data as CreateTemplateRequest);
      router.push(`/templates/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template');
      setIsSaving(false);
    }
  }, [createTemplate, router]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push('/templates');
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {/* Editor */}
      <TemplateEditor
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </div>
  );
}
