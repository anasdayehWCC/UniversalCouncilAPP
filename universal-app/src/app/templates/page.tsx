'use client';

import React, { useState, useCallback } from 'react';
import { useDemo } from '@/context/DemoContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { FlagGate } from '@/components/ui/flag-gate';
import { TemplateSelector } from '@/components/templates';
import { TemplatePreview } from '@/components/templates';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/lib/templates/types';
import {
  EmptyStatePanel,
  InspectorPanel,
  PageHeader,
  ShellPage,
} from '@/components/layout';

export default function TemplatesPage() {
  const router = useRouter();
  const { currentUser, featureFlags, config, role } = useDemo();
  
  // Template hook for default templates
  const { 
    filteredTemplates, 
    getFavorites, 
    getRecentlyUsed,
  } = useTemplates({
    initialFilters: { domain: currentUser.domain as 'children' | 'adults' | 'housing' | 'corporate' },
  });

  // Selected template for preview
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
  }, []);

  // Handle use template
  const handleUseTemplate = useCallback(() => {
    if (selectedTemplate) {
      // Navigate to record page with template pre-selected
      router.push(`/record?templateId=${selectedTemplate.id}`);
    }
  }, [selectedTemplate, router]);

  // Stats
  const favorites = getFavorites();
  const recentlyUsed = getRecentlyUsed(5);

  const content = (
    <ShellPage
      padded={false}
      header={
        <PageHeader
          eyebrow="Template Library"
          title="Meeting Templates"
          description={`Standardized structures for ${currentUser.domain === 'children' ? "children's services" : currentUser.domain} meetings.`}
          gradient={config.theme.gradient}
          inverted
          metrics={[
            { label: 'Available', value: filteredTemplates.length, tone: 'success' },
            { label: 'Favorites', value: favorites.length, tone: 'warning' },
            { label: 'Recent', value: recentlyUsed.length, tone: 'info' },
          ]}
          actions={
            currentUser.role === 'admin' ? (
              <Link href="/templates/new">
                <Button className="gap-2 border border-white/16 bg-white/12 text-white hover:bg-white/20">
                  <Plus className="w-4 h-4" />
                  Create Template
                </Button>
              </Link>
            ) : undefined
          }
        />
      }
      contentClassName="space-y-6"
      inspector={
        selectedTemplate ? (
          <TemplatePreview
            template={selectedTemplate}
            onSelect={handleUseTemplate}
            onEdit={
              currentUser.role === 'admin' && !selectedTemplate.isSystem
                ? () => router.push(`/templates/${selectedTemplate.id}`)
                : undefined
            }
            showFullDetails
          />
        ) : (
          <EmptyStatePanel className="text-left">
            <InspectorPanel
              title="Template preview"
              description="Select a template to review its sections, duration, and governance details before starting a recording."
            >
              <div className="flex items-center gap-3 rounded-[20px] border border-border/70 bg-background/70 px-4 py-4">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Nothing selected yet</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a template from the library to lock the preview and compare options without relying on hover.
                  </p>
                </div>
              </div>
            </InspectorPanel>
          </EmptyStatePanel>
        )
      }
    >
      <TemplateSelector
        onSelect={handleSelectTemplate}
        selectedId={selectedTemplate?.id}
        domain={currentUser.domain}
      />
    </ShellPage>
  );

  if (currentUser.domain === 'housing') {
    return (
      <FlagGate
        flag="housingPilot"
        featureFlags={featureFlags}
        title="Housing pilot is turned off"
        message="Priya has disabled the housing pilot module for this demo. Enable it in Admin to expose Housing templates and workflows."
        tone="warning"
        actions={
          <>
            {role === 'admin' && (
              <Link href="/admin">
                <Button className="bg-warning text-white hover:opacity-90">Open Admin</Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline">Return home</Button>
            </Link>
          </>
        }
      >
        {content}
      </FlagGate>
    );
  }

  return content;
}
