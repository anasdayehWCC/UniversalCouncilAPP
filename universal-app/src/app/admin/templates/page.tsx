'use client';

import React, { useState } from 'react';
import { AdminPageWrapper } from '@/components/admin/AdminHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dates';

const DOMAIN_COLORS: Record<string, string> = {
  children: 'bg-blue-100 text-blue-700 border-blue-200',
  adults: 'bg-teal-100 text-teal-700 border-teal-200',
  housing: 'bg-amber-100 text-amber-700 border-amber-200',
  corporate: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function TemplatesPage() {
  const { templates, deleteTemplate, canManageTemplates, tenantConfig } = useAdmin();
  const { success, info, error } = useToast();
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

  const handleDuplicate = (template: AdminTemplate) => {
    info('Template duplication coming soon');
  };

  const handleEdit = (template: AdminTemplate) => {
    info('Template editor coming soon');
  };

  const handleSetDefault = (template: AdminTemplate) => {
    info('Set as default coming soon');
  };

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
            <h3 className="font-semibold text-slate-900 mb-3 capitalize">
              {domain === 'children' ? "Children's Services" :
               domain === 'adults' ? 'Adult Social Care' :
               domain === 'housing' ? 'Housing Services' :
               domain.charAt(0).toUpperCase() + domain.slice(1)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domainTemplates.map(template => (
                <Card 
                  key={template.id} 
                  variant="glass" 
                  className="p-4 bg-white/80 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{template.name}</h4>
                          {template.isDefault && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                      </div>
                    </div>
                    
                    {canManageTemplates && (
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setActiveMenu(activeMenu === template.id ? null : template.id)}
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                        
                        {activeMenu === template.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button 
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              onClick={() => {
                                handleEdit(template);
                                setActiveMenu(null);
                              }}
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button 
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              onClick={() => {
                                handleDuplicate(template);
                                setActiveMenu(null);
                              }}
                            >
                              <Copy className="w-4 h-4" /> Duplicate
                            </button>
                            {!template.isDefault && (
                              <button 
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                    <p className="text-xs text-slate-500 mb-2">Sections:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.sections.slice(0, 3).map((section, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                          {section}
                        </Badge>
                      ))}
                      {template.sections.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          +{template.sections.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
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
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No templates found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
