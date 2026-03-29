'use client';

import React, { useState, useCallback } from 'react';
import { useDemo } from '@/context/DemoContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, LayoutGrid, Settings } from 'lucide-react';
import { FlagGate } from '@/components/ui/flag-gate';
import { TemplateSelector } from '@/components/templates';
import { TemplatePreview } from '@/components/templates';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/lib/templates/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplatesPage() {
  const router = useRouter();
  const { currentUser, featureFlags, config, role } = useDemo();
  
  // Template hook for default templates
  const { 
    filteredTemplates, 
    getFavorites, 
    getRecentlyUsed,
    isLoading 
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
    <div className="space-y-6">
      {/* Header Card */}
      <Card
        variant="hero"
        hoverEffect={false}
        className="p-6 border-none text-white relative overflow-hidden"
        style={{ background: config.theme.gradient }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Meeting Templates</h1>
            <p className="text-sm opacity-80 mt-1">
              Standardized structures for {currentUser.domain === 'children' ? "children's services" : currentUser.domain} meetings
            </p>
            <div className="info-rail mt-3">
              <span className="info-rail__item">
                <span className="info-rail__dot" style={{ background: 'var(--success)' }} />
                Available: {filteredTemplates.length}
              </span>
              <span className="info-rail__item">
                <span className="info-rail__dot" style={{ background: 'var(--warning)' }} />
                Favorites: {favorites.length}
              </span>
              <span className="info-rail__item">
                <span className="info-rail__dot" style={{ background: 'var(--info)' }} />
                Recent: {recentlyUsed.length}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {currentUser.role === 'admin' && (
              <Link href="/templates/new">
                <Button className="gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20">
                  <Plus className="w-4 h-4" />
                  Create Template
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </Card>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Template selector */}
        <div className="flex-1">
          <TemplateSelector
            onSelect={handleSelectTemplate}
            selectedId={selectedTemplate?.id}
            domain={currentUser.domain}
          />
        </div>

        {/* Preview sidebar (when template selected) */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="hidden lg:block flex-shrink-0"
            >
              <div className="sticky top-4">
                <TemplatePreview
                  template={selectedTemplate}
                  onSelect={handleUseTemplate}
                  onEdit={currentUser.role === 'admin' && !selectedTemplate.isSystem ? 
                    () => router.push(`/templates/${selectedTemplate.id}`) : 
                    undefined
                  }
                  showFullDetails
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile preview modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-h-[80vh] overflow-auto bg-card rounded-t-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              <TemplatePreview
                template={selectedTemplate}
                onSelect={handleUseTemplate}
                onEdit={currentUser.role === 'admin' && !selectedTemplate.isSystem ? 
                  () => router.push(`/templates/${selectedTemplate.id}`) : 
                  undefined
                }
                showFullDetails
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">Open Admin</Button>
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
