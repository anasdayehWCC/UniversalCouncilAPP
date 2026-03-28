'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Minute, 
  MinuteSection, 
  ActionItem, 
  MinuteStatus,
  EvidenceLink,
  MinuteAttendee
} from '@/lib/minutes/types';

interface UseMinutesOptions {
  autoSaveInterval?: number; // ms
  onAutoSave?: (minute: Minute) => void;
  onError?: (error: Error) => void;
}

interface UseMinutesReturn {
  // State
  minute: Minute | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  error: Error | null;

  // CRUD operations
  loadMinute: (id: string) => Promise<void>;
  createMinute: (data: Partial<Minute>) => Promise<Minute>;
  updateMinute: (updates: Partial<Minute>) => void;
  saveMinute: () => Promise<void>;
  deleteMinute: (id: string) => Promise<void>;

  // Section operations
  updateSection: (sectionId: string, updates: Partial<MinuteSection>) => void;
  addSection: (section: Omit<MinuteSection, 'id'>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;

  // Action item operations
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (itemId: string, updates: Partial<ActionItem>) => void;
  removeActionItem: (itemId: string) => void;

  // Evidence operations
  addEvidence: (sectionId: string, evidence: Omit<EvidenceLink, 'id'>) => void;
  removeEvidence: (sectionId: string, evidenceId: string) => void;

  // Attendee operations
  updateAttendee: (attendeeId: string, updates: Partial<MinuteAttendee>) => void;
  addAttendee: (attendee: Omit<MinuteAttendee, 'id'>) => void;
  removeAttendee: (attendeeId: string) => void;

  // Workflow operations
  submitForReview: () => Promise<void>;
  approve: () => Promise<void>;
  requestChanges: (reason: string) => Promise<void>;
  publish: () => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useMinutes(options: UseMinutesOptions = {}): UseMinutesReturn {
  const { autoSaveInterval = 30000, onAutoSave, onError } = options;

  const [minute, setMinute] = useState<Minute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (!minute || !isDirty || !autoSaveInterval) return;

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        // In a real app, this would call the API
        console.log('[useMinutes] Auto-saving minute:', minute.id);
        setLastSaved(new Date());
        setIsDirty(false);
        onAutoSave?.(minute);
      } catch (err) {
        console.error('[useMinutes] Auto-save failed:', err);
        onError?.(err as Error);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [minute, isDirty, autoSaveInterval, onAutoSave, onError]);

  // Load minute
  const loadMinute = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would fetch from API
      // For now, we'll simulate with mock data
      const response = await fetch(`/api/minutes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load minute');
      }
      const data = await response.json();
      setMinute(data);
    } catch (err) {
      // If API fails, use demo data (for development)
      console.warn('[useMinutes] API failed, using demo data');
      setMinute(createDemoMinute(id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create minute
  const createMinute = useCallback(async (data: Partial<Minute>): Promise<Minute> => {
    const newMinute: Minute = {
      id: generateId(),
      title: data.title || 'Untitled Minutes',
      date: data.date || new Date().toISOString(),
      duration: data.duration || '0:00',
      status: 'draft',
      sections: data.sections || [],
      actionItems: data.actionItems || [],
      attendees: data.attendees || [],
      metadata: {
        transcriptionId: data.metadata?.transcriptionId || '',
        domain: data.metadata?.domain || 'social_care',
        generatedAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
        wordCount: 0,
        estimatedReadTime: 0,
        ...data.metadata
      },
      ...data
    };

    setMinute(newMinute);
    setIsDirty(true);
    return newMinute;
  }, []);

  // Update minute
  const updateMinute = useCallback((updates: Partial<Minute>) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        metadata: {
          ...prev.metadata,
          lastEditedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(true);
  }, []);

  // Save minute
  const saveMinute = useCallback(async () => {
    if (!minute) return;
    
    setIsSaving(true);
    setError(null);
    try {
      // In a real app, this would call the API
      console.log('[useMinutes] Saving minute:', minute.id);
      // await fetch(`/api/minutes/${minute.id}`, { method: 'PUT', body: JSON.stringify(minute) });
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      setError(err as Error);
      onError?.(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [minute, onError]);

  // Delete minute
  const deleteMinute = useCallback(async (id: string) => {
    try {
      // In a real app, this would call the API
      console.log('[useMinutes] Deleting minute:', id);
      setMinute(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Section operations
  const updateSection = useCallback((sectionId: string, updates: Partial<MinuteSection>) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        ),
        metadata: {
          ...prev.metadata,
          lastEditedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(true);
  }, []);

  const addSection = useCallback((section: Omit<MinuteSection, 'id'>) => {
    setMinute(prev => {
      if (!prev) return prev;
      const newSection: MinuteSection = {
        ...section,
        id: generateId()
      };
      return {
        ...prev,
        sections: [...prev.sections, newSection],
        metadata: {
          ...prev.metadata,
          lastEditedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(true);
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.filter(section => section.id !== sectionId),
        metadata: {
          ...prev.metadata,
          lastEditedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(true);
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setMinute(prev => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      return {
        ...prev,
        sections: sections.map((s, i) => ({ ...s, order: i })),
        metadata: {
          ...prev.metadata,
          lastEditedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(true);
  }, []);

  // Action item operations
  const addActionItem = useCallback((item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: ActionItem = {
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: [...prev.actionItems, newItem]
      };
    });
    setIsDirty(true);
  }, []);

  const updateActionItem = useCallback((itemId: string, updates: Partial<ActionItem>) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: prev.actionItems.map(item =>
          item.id === itemId 
            ? { ...item, ...updates, updatedAt: new Date().toISOString() } 
            : item
        )
      };
    });
    setIsDirty(true);
  }, []);

  const removeActionItem = useCallback((itemId: string) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: prev.actionItems.filter(item => item.id !== itemId)
      };
    });
    setIsDirty(true);
  }, []);

  // Evidence operations
  const addEvidence = useCallback((sectionId: string, evidence: Omit<EvidenceLink, 'id'>) => {
    const newEvidence: EvidenceLink = {
      ...evidence,
      id: generateId()
    };
    updateSection(sectionId, {
      evidence: [
        ...(minute?.sections.find(s => s.id === sectionId)?.evidence || []),
        newEvidence
      ]
    });
  }, [minute, updateSection]);

  const removeEvidence = useCallback((sectionId: string, evidenceId: string) => {
    const section = minute?.sections.find(s => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      evidence: section.evidence.filter(e => e.id !== evidenceId)
    });
  }, [minute, updateSection]);

  // Attendee operations
  const updateAttendee = useCallback((attendeeId: string, updates: Partial<MinuteAttendee>) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        attendees: prev.attendees.map(attendee =>
          attendee.id === attendeeId ? { ...attendee, ...updates } : attendee
        )
      };
    });
    setIsDirty(true);
  }, []);

  const addAttendee = useCallback((attendee: Omit<MinuteAttendee, 'id'>) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        attendees: [...prev.attendees, { ...attendee, id: generateId() }]
      };
    });
    setIsDirty(true);
  }, []);

  const removeAttendee = useCallback((attendeeId: string) => {
    setMinute(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        attendees: prev.attendees.filter(a => a.id !== attendeeId)
      };
    });
    setIsDirty(true);
  }, []);

  // Workflow operations
  const submitForReview = useCallback(async () => {
    if (!minute) return;
    
    setIsSaving(true);
    try {
      await saveMinute();
      updateMinute({
        status: 'pending_review',
        submittedAt: new Date().toISOString()
      });
      await saveMinute();
    } finally {
      setIsSaving(false);
    }
  }, [minute, saveMinute, updateMinute]);

  const approve = useCallback(async () => {
    if (!minute) return;
    
    setIsSaving(true);
    try {
      updateMinute({
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      await saveMinute();
    } finally {
      setIsSaving(false);
    }
  }, [minute, saveMinute, updateMinute]);

  const requestChanges = useCallback(async (reason: string) => {
    if (!minute) return;
    
    setIsSaving(true);
    try {
      updateMinute({
        status: 'draft',
        changesRequestedAt: new Date().toISOString(),
        changesRequestedReason: reason
      });
      await saveMinute();
    } finally {
      setIsSaving(false);
    }
  }, [minute, saveMinute, updateMinute]);

  const publish = useCallback(async () => {
    if (!minute) return;
    
    setIsSaving(true);
    try {
      updateMinute({
        status: 'published',
        publishedAt: new Date().toISOString()
      });
      await saveMinute();
    } finally {
      setIsSaving(false);
    }
  }, [minute, saveMinute, updateMinute]);

  return {
    minute,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
    error,
    loadMinute,
    createMinute,
    updateMinute,
    saveMinute,
    deleteMinute,
    updateSection,
    addSection,
    removeSection,
    reorderSections,
    addActionItem,
    updateActionItem,
    removeActionItem,
    addEvidence,
    removeEvidence,
    updateAttendee,
    addAttendee,
    removeAttendee,
    submitForReview,
    approve,
    requestChanges,
    publish
  };
}

// Demo data generator
function createDemoMinute(id: string): Minute {
  return {
    id,
    title: 'Home Visit - Smith Family',
    date: new Date().toISOString(),
    duration: '45:23',
    status: 'draft',
    sections: [
      {
        id: 'section-1',
        type: 'summary',
        title: 'Summary',
        content: 'This home visit was conducted to assess the current living situation and wellbeing of the Smith family. The visit focused on reviewing support arrangements and identifying any additional needs.',
        order: 0,
        evidence: [
          {
            id: 'ev-1',
            text: 'The family appears to be settling well in their new accommodation.',
            transcriptStart: 120,
            transcriptEnd: 125,
            timestamp: '00:02:00',
            speaker: 'Social Worker'
          }
        ]
      },
      {
        id: 'section-2',
        type: 'keyPoints',
        title: 'Key Points',
        content: '- Family has adapted well to new housing\n- Children attending school regularly\n- Financial support needs review\n- Mother expressing interest in employment training',
        order: 1,
        evidence: []
      },
      {
        id: 'section-3',
        type: 'risks',
        title: 'Risks & Concerns',
        content: '- No immediate safeguarding concerns identified\n- Family budget remains tight\n- Limited local support network',
        order: 2,
        evidence: []
      }
    ],
    actionItems: [
      {
        id: 'action-1',
        description: 'Review financial support options with benefits team',
        assignee: 'Sarah Chen',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'action-2',
        description: 'Connect family with local community center',
        assignee: 'Sarah Chen',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'low',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    attendees: [
      { id: 'att-1', name: 'Sarah Chen', role: 'Social Worker', present: true },
      { id: 'att-2', name: 'Mrs. Smith', role: 'Parent', present: true },
      { id: 'att-3', name: 'Mr. Smith', role: 'Parent', present: false }
    ],
    metadata: {
      transcriptionId: 'trans-123',
      templateId: 'home-visit',
      templateName: 'Home Visit Notes',
      caseId: 'case-456',
      caseName: 'Smith Family',
      domain: 'children_services',
      aiModel: 'gpt-4',
      generatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: 'Sarah Chen',
      wordCount: 256,
      estimatedReadTime: 2
    }
  };
}
