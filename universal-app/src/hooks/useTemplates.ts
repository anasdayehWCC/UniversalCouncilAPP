/**
 * Template Management Hook
 * 
 * Provides template loading, CRUD operations, and favorites management
 * for the template system.
 * 
 * @module hooks/useTemplates
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDemo } from '@/context/DemoContext';
import { ServiceDomain } from '@/config/domains';
import {
  Template,
  TemplateSection,
  TemplateFilters,
  TemplatePreference,
  TemplateWithPreferences,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateCategory,
  TemplateMeetingType,
} from '@/lib/templates/types';
import { DEFAULT_TEMPLATES, getTemplatesByDomain } from '@/lib/templates/default-templates';

// Storage key for user preferences
const PREFERENCES_KEY = 'template-preferences';
const CUSTOM_TEMPLATES_KEY = 'custom-templates';

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateSectionId(templateId: string, index: number): string {
  return `${templateId}-section-${index + 1}`;
}

function getStoredPreferences(): TemplatePreference[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePreferences(prefs: TemplatePreference[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

function getStoredCustomTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: Template[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

// ============================================================================
// Hook Options & Return Types
// ============================================================================

interface UseTemplatesOptions {
  /** Initial filters to apply */
  initialFilters?: TemplateFilters;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

interface UseTemplatesReturn {
  // State
  templates: TemplateWithPreferences[];
  filteredTemplates: TemplateWithPreferences[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: Error | null;
  filters: TemplateFilters;

  // Filter operations
  setFilters: (filters: TemplateFilters) => void;
  setDomainFilter: (domain: ServiceDomain | 'all' | undefined) => void;
  setCategoryFilter: (category: TemplateCategory | undefined) => void;
  setMeetingTypeFilter: (meetingType: TemplateMeetingType | undefined) => void;
  setSearchQuery: (query: string) => void;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  clearFilters: () => void;

  // Template selection
  selectTemplate: (id: string) => void;
  clearSelection: () => void;

  // CRUD operations
  getTemplate: (id: string) => Template | undefined;
  createTemplate: (data: CreateTemplateRequest) => Promise<Template>;
  updateTemplate: (id: string, data: UpdateTemplateRequest) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, newName?: string) => Promise<Template>;

  // Section operations
  addSection: (templateId: string, section: Omit<TemplateSection, 'id'>) => void;
  updateSection: (templateId: string, sectionId: string, updates: Partial<TemplateSection>) => void;
  removeSection: (templateId: string, sectionId: string) => void;
  reorderSections: (templateId: string, fromIndex: number, toIndex: number) => void;

  // Favorites management
  toggleFavorite: (templateId: string) => void;
  isFavorite: (templateId: string) => boolean;
  getFavorites: () => TemplateWithPreferences[];
  getRecentlyUsed: (limit?: number) => TemplateWithPreferences[];

  // Usage tracking
  recordUsage: (templateId: string) => void;

  // Refresh
  refresh: () => void;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useTemplates(options: UseTemplatesOptions = {}): UseTemplatesReturn {
  const { initialFilters = {}, autoLoad = true } = options;
  const { currentUser, domain } = useDemo();

  // State
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [preferences, setPreferences] = useState<TemplatePreference[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFiltersState] = useState<TemplateFilters>({
    domain: domain,
    ...initialFilters,
  });

  // Load templates and preferences on mount
  useEffect(() => {
    if (!autoLoad) return;
    
    const loadData = () => {
      try {
        setIsLoading(true);
        
        // Load system templates + custom templates
        const customTemplates = getStoredCustomTemplates();
        setAllTemplates([...DEFAULT_TEMPLATES, ...customTemplates]);
        
        // Load preferences
        const storedPrefs = getStoredPreferences();
        setPreferences(storedPrefs);
        
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load templates'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [autoLoad]);

  // Update domain filter when context domain changes
  useEffect(() => {
    if (domain && !filters.domain) {
      setFiltersState(prev => ({ ...prev, domain }));
    }
  }, [domain, filters.domain]);

  // Merge templates with user preferences
  const templatesWithPreferences = useMemo((): TemplateWithPreferences[] => {
    return allTemplates.map(template => {
      const pref = preferences.find(
        p => p.templateId === template.id && p.userId === currentUser?.id
      );
      return {
        ...template,
        isFavorite: pref?.isFavorite ?? false,
        lastUsed: pref?.lastUsed,
        userUsageCount: pref?.usageCount ?? 0,
      };
    });
  }, [allTemplates, preferences, currentUser?.id]);

  // Apply filters to templates
  const filteredTemplates = useMemo((): TemplateWithPreferences[] => {
    let result = templatesWithPreferences;

    // Domain filter
    if (filters.domain && filters.domain !== 'all') {
      result = result.filter(t => t.domain === filters.domain || t.domain === 'all');
    }

    // Category filter
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }

    // Meeting type filter
    if (filters.meetingType) {
      result = result.filter(t => t.meetingType === filters.meetingType);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(t =>
        t.tags?.some(tag => filters.tags?.includes(tag))
      );
    }

    // Favorites only
    if (filters.favoritesOnly) {
      result = result.filter(t => t.isFavorite);
    }

    // System templates filter
    if (filters.includeSystem === false) {
      result = result.filter(t => !t.isSystem);
    }

    return result;
  }, [templatesWithPreferences, filters]);

  // ========== Filter Operations ==========

  const setFilters = useCallback((newFilters: TemplateFilters) => {
    setFiltersState(newFilters);
  }, []);

  const setDomainFilter = useCallback((domain: ServiceDomain | 'all' | undefined) => {
    setFiltersState(prev => ({ ...prev, domain }));
  }, []);

  const setCategoryFilter = useCallback((category: TemplateCategory | undefined) => {
    setFiltersState(prev => ({ ...prev, category }));
  }, []);

  const setMeetingTypeFilter = useCallback((meetingType: TemplateMeetingType | undefined) => {
    setFiltersState(prev => ({ ...prev, meetingType }));
  }, []);

  const setSearchQuery = useCallback((search: string) => {
    setFiltersState(prev => ({ ...prev, search: search || undefined }));
  }, []);

  const setFavoritesOnly = useCallback((favoritesOnly: boolean) => {
    setFiltersState(prev => ({ ...prev, favoritesOnly }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ domain: domain });
  }, [domain]);

  // ========== Selection Operations ==========

  const selectTemplate = useCallback((id: string) => {
    const template = allTemplates.find(t => t.id === id);
    setSelectedTemplate(template ?? null);
  }, [allTemplates]);

  const clearSelection = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  // ========== CRUD Operations ==========

  const getTemplate = useCallback((id: string): Template | undefined => {
    return allTemplates.find(t => t.id === id);
  }, [allTemplates]);

  const createTemplate = useCallback(async (data: CreateTemplateRequest): Promise<Template> => {
    const id = generateId();
    const now = new Date().toISOString();
    
    const newTemplate: Template = {
      id,
      name: data.name,
      description: data.description,
      longDescription: data.longDescription,
      category: data.category,
      meetingType: data.meetingType,
      domain: data.domain,
      sections: data.sections.map((s, i) => ({
        ...s,
        id: generateSectionId(id, i),
      })),
      icon: data.icon || 'FileText',
      version: '1.0.0',
      isDefault: false,
      isSystem: false,
      tags: data.tags || [],
      color: data.color,
      estimatedDuration: data.estimatedDuration,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.id,
    };

    const customTemplates = getStoredCustomTemplates();
    const updatedCustom = [...customTemplates, newTemplate];
    saveCustomTemplates(updatedCustom);

    setAllTemplates(prev => [...prev, newTemplate]);
    
    return newTemplate;
  }, [currentUser?.id]);

  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateRequest): Promise<Template> => {
    const existingTemplate = allTemplates.find(t => t.id === id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    if (existingTemplate.isSystem) {
      throw new Error('System templates cannot be modified');
    }

    const updatedTemplate: Template = {
      ...existingTemplate,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.id,
    };

    // Update in custom templates storage
    const customTemplates = getStoredCustomTemplates();
    const updatedCustom = customTemplates.map(t => 
      t.id === id ? updatedTemplate : t
    );
    saveCustomTemplates(updatedCustom);

    // Update local state
    setAllTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
    
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(updatedTemplate);
    }

    return updatedTemplate;
  }, [allTemplates, currentUser?.id, selectedTemplate]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    const template = allTemplates.find(t => t.id === id);
    if (!template) return;

    if (template.isSystem) {
      throw new Error('System templates cannot be deleted');
    }

    // Remove from custom templates storage
    const customTemplates = getStoredCustomTemplates();
    const updatedCustom = customTemplates.filter(t => t.id !== id);
    saveCustomTemplates(updatedCustom);

    // Remove from local state
    setAllTemplates(prev => prev.filter(t => t.id !== id));
    
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }

    // Remove preferences for this template
    const updatedPrefs = preferences.filter(p => p.templateId !== id);
    setPreferences(updatedPrefs);
    savePreferences(updatedPrefs);
  }, [allTemplates, preferences, selectedTemplate]);

  const duplicateTemplate = useCallback(async (id: string, newName?: string): Promise<Template> => {
    const original = allTemplates.find(t => t.id === id);
    if (!original) {
      throw new Error('Template not found');
    }

    const duplicatedData: CreateTemplateRequest = {
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      longDescription: original.longDescription,
      category: original.category,
      meetingType: original.meetingType,
      domain: original.domain,
      sections: original.sections.map(s => ({
        type: s.type,
        title: s.title,
        prompt: s.prompt,
        placeholder: s.placeholder,
        required: s.required,
        order: s.order,
        icon: s.icon,
        maxWords: s.maxWords,
        minWords: s.minWords,
        helpText: s.helpText,
        defaultContent: s.defaultContent,
        locked: false, // Unlock sections in duplicated templates
      })),
      icon: original.icon,
      tags: original.tags,
      color: original.color,
      estimatedDuration: original.estimatedDuration,
    };

    return createTemplate(duplicatedData);
  }, [allTemplates, createTemplate]);

  // ========== Section Operations ==========

  const addSection = useCallback((templateId: string, section: Omit<TemplateSection, 'id'>) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template || template.isSystem) return;

    const newSection: TemplateSection = {
      ...section,
      id: generateSectionId(templateId, template.sections.length),
    };

    const updatedSections = [...template.sections, newSection];
    updateTemplate(templateId, { sections: updatedSections });
  }, [allTemplates, updateTemplate]);

  const updateSection = useCallback((
    templateId: string, 
    sectionId: string, 
    updates: Partial<TemplateSection>
  ) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template || template.isSystem) return;

    const updatedSections = template.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    updateTemplate(templateId, { sections: updatedSections });
  }, [allTemplates, updateTemplate]);

  const removeSection = useCallback((templateId: string, sectionId: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template || template.isSystem) return;

    const section = template.sections.find(s => s.id === sectionId);
    if (section?.locked) return;

    const updatedSections = template.sections
      .filter(s => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    
    updateTemplate(templateId, { sections: updatedSections });
  }, [allTemplates, updateTemplate]);

  const reorderSections = useCallback((templateId: string, fromIndex: number, toIndex: number) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template || template.isSystem) return;

    const sections = [...template.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);

    const updatedSections = sections.map((s, i) => ({ ...s, order: i + 1 }));
    updateTemplate(templateId, { sections: updatedSections });
  }, [allTemplates, updateTemplate]);

  // ========== Favorites Management ==========

  const updatePreference = useCallback((
    templateId: string, 
    updates: Partial<TemplatePreference>
  ) => {
    if (!currentUser?.id) return;

    const existingIndex = preferences.findIndex(
      p => p.templateId === templateId && p.userId === currentUser.id
    );

    let updatedPrefs: TemplatePreference[];

    if (existingIndex >= 0) {
      updatedPrefs = preferences.map((p, i) => 
        i === existingIndex ? { ...p, ...updates } : p
      );
    } else {
      const newPref: TemplatePreference = {
        userId: currentUser.id,
        templateId,
        isFavorite: false,
        usageCount: 0,
        ...updates,
      };
      updatedPrefs = [...preferences, newPref];
    }

    setPreferences(updatedPrefs);
    savePreferences(updatedPrefs);
  }, [currentUser?.id, preferences]);

  const toggleFavorite = useCallback((templateId: string) => {
    const currentPref = preferences.find(
      p => p.templateId === templateId && p.userId === currentUser?.id
    );
    updatePreference(templateId, { isFavorite: !currentPref?.isFavorite });
  }, [currentUser?.id, preferences, updatePreference]);

  const isFavorite = useCallback((templateId: string): boolean => {
    return preferences.some(
      p => p.templateId === templateId && p.userId === currentUser?.id && p.isFavorite
    );
  }, [currentUser?.id, preferences]);

  const getFavorites = useCallback((): TemplateWithPreferences[] => {
    return templatesWithPreferences.filter(t => t.isFavorite);
  }, [templatesWithPreferences]);

  const getRecentlyUsed = useCallback((limit = 5): TemplateWithPreferences[] => {
    return templatesWithPreferences
      .filter(t => t.lastUsed)
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0;
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      })
      .slice(0, limit);
  }, [templatesWithPreferences]);

  const recordUsage = useCallback((templateId: string) => {
    const currentPref = preferences.find(
      p => p.templateId === templateId && p.userId === currentUser?.id
    );
    updatePreference(templateId, {
      lastUsed: new Date().toISOString(),
      usageCount: (currentPref?.usageCount ?? 0) + 1,
    });
  }, [currentUser?.id, preferences, updatePreference]);

  // ========== Refresh ==========

  const refresh = useCallback(() => {
    const customTemplates = getStoredCustomTemplates();
    setAllTemplates([...DEFAULT_TEMPLATES, ...customTemplates]);
    setPreferences(getStoredPreferences());
  }, []);

  return {
    // State
    templates: templatesWithPreferences,
    filteredTemplates,
    selectedTemplate,
    isLoading,
    error,
    filters,

    // Filter operations
    setFilters,
    setDomainFilter,
    setCategoryFilter,
    setMeetingTypeFilter,
    setSearchQuery,
    setFavoritesOnly,
    clearFilters,

    // Selection
    selectTemplate,
    clearSelection,

    // CRUD
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,

    // Section operations
    addSection,
    updateSection,
    removeSection,
    reorderSections,

    // Favorites
    toggleFavorite,
    isFavorite,
    getFavorites,
    getRecentlyUsed,

    // Usage
    recordUsage,

    // Refresh
    refresh,
  };
}

export default useTemplates;
