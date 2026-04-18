'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDemo } from '@/context/DemoContext';
import {
  AdminUser,
  AdminModule,
  AdminTemplate,
  TenantSettings,
  AuditLogEntry,
  AdminStats,
  AdminAction,
  ADMIN_PERMISSIONS
} from '@/types/admin';

// localStorage keys
const LS_KEYS = {
  modules: 'admin_modules',
  templates: 'admin_templates',
  settings: 'admin_settings',
  auditLog: 'admin_audit_log',
  users: 'admin_users',
} as const;

/** Safely read and parse JSON from localStorage. Returns null on any failure. */
function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Safely write JSON to localStorage. */
function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — silently degrade
  }
}

/** Generate a proper UUID (falls back to crypto.randomUUID or polyfill). */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Mock data for demo
const MOCK_USERS: AdminUser[] = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@wcc.gov.uk',
    role: 'social_worker',
    domain: 'children',
    team: 'Family Intervention',
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-15T09:00:00Z',
    avatar: '/avatars/sarah.jpg'
  },
  {
    id: 'james',
    name: 'James Okonkwo',
    email: 'james.okonkwo@rbkc.gov.uk',
    role: 'manager',
    domain: 'adults',
    team: 'Adult Services Management',
    status: 'active',
    lastLogin: '2024-03-27T14:30:00Z',
    createdAt: '2023-11-20T10:00:00Z'
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    email: 'priya.sharma@wcc.gov.uk',
    role: 'admin',
    domain: 'children',
    team: 'Digital Transformation',
    status: 'active',
    lastLogin: '2024-03-28T08:00:00Z',
    createdAt: '2023-06-01T09:00:00Z'
  },
  {
    id: 'marcus',
    name: 'Marcus Williams',
    email: 'marcus.williams@rbkc.gov.uk',
    role: 'housing_officer',
    domain: 'housing',
    team: 'Housing Support',
    status: 'active',
    lastLogin: '2024-03-26T16:45:00Z',
    createdAt: '2024-02-01T09:00:00Z'
  },
  {
    id: 'emily',
    name: 'Emily Roberts',
    email: 'emily.roberts@wcc.gov.uk',
    role: 'social_worker',
    domain: 'children',
    team: 'Child Protection',
    status: 'pending',
    createdAt: '2024-03-25T11:00:00Z'
  }
];

const MOCK_MODULES: AdminModule[] = [
  {
    id: 'smart-capture',
    name: 'Smart Capture',
    description: 'Real-time transcription and AI-powered draft generation',
    category: 'ai',
    enabled: true,
    configurable: true,
    settings: { quality: 'high', language: 'en-GB' }
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'Manager dashboards with trend analysis and risk indicators',
    category: 'ai',
    enabled: true,
    configurable: true
  },
  {
    id: 'housing-pilot',
    name: 'Housing Pilot',
    description: 'Templates and workflows for housing services',
    category: 'pilot',
    enabled: false,
    configurable: true,
    dependencies: ['smart-capture']
  },
  {
    id: 'offline-mode',
    name: 'Offline Mode',
    description: 'Record and sync meetings without internet',
    category: 'core',
    enabled: true,
    configurable: false
  },
  {
    id: 'push-notifications',
    name: 'Push Notifications',
    description: 'Real-time alerts for approvals and updates',
    category: 'core',
    enabled: true,
    configurable: true,
    settings: { channels: ['browser', 'email'] }
  },
  {
    id: 'mosaic-integration',
    name: 'Mosaic Integration',
    description: 'Sync minutes with Mosaic case management system',
    category: 'integration',
    enabled: false,
    configurable: true
  }
];

const MOCK_TEMPLATES: AdminTemplate[] = [
  {
    id: 'home-visit',
    name: 'Home Visit',
    description: 'Standard template for child welfare home visits',
    domain: 'children',
    sections: ['Participants', 'Home Environment', 'Child Welfare', 'Actions', 'Next Steps'],
    isDefault: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-03-15T10:30:00Z',
    createdBy: 'priya'
  },
  {
    id: 'case-review',
    name: 'Case Review',
    description: 'Multi-agency case review meeting template',
    domain: 'children',
    sections: ['Attendance', 'Case Summary', 'Risk Assessment', 'Decisions', 'Action Plan'],
    isDefault: false,
    createdAt: '2024-02-05T14:00:00Z',
    updatedAt: '2024-02-05T14:00:00Z',
    createdBy: 'james'
  },
  {
    id: 'adult-assessment',
    name: 'Adult Social Care Assessment',
    description: 'Comprehensive needs assessment for adult services',
    domain: 'adults',
    sections: ['Personal Details', 'Health Needs', 'Support Network', 'Care Plan', 'Review Date'],
    isDefault: true,
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-03-20T09:15:00Z',
    createdBy: 'priya'
  },
  {
    id: 'housing-inspection',
    name: 'Housing Inspection',
    description: 'Property inspection and condition report',
    domain: 'housing',
    sections: ['Property Details', 'Condition Assessment', 'Safety Checks', 'Repairs Needed', 'Tenant Concerns'],
    isDefault: true,
    createdAt: '2024-02-28T10:00:00Z',
    updatedAt: '2024-02-28T10:00:00Z',
    createdBy: 'marcus'
  }
];

const MOCK_SETTINGS: TenantSettings = {
  id: 'wcc-children',
  name: 'Westminster Children\'s Services',
  domain: 'children',
  branding: {
    primaryColor: '#211551',
    accentColor: '#9D581F',
    logoUrl: '/logos/wcc.png'
  },
  features: {
    aiEdit: true,
    smartCapture: true,
    offlineMode: true,
    pushNotifications: true
  },
  compliance: {
    dataRetentionDays: 365,
    auditLogRetentionDays: 730,
    requireMfa: false,
    allowedDomains: ['wcc.gov.uk', 'rbkc.gov.uk']
  },
  notifications: {
    emailEnabled: true,
    slackEnabled: false
  }
};

const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    userId: 'priya',
    userName: 'Priya Sharma',
    action: 'update',
    resource: 'settings',
    resourceId: 'wcc-children',
    resourceName: 'Tenant Settings',
    details: { field: 'dataRetentionDays', oldValue: 180, newValue: 365 }
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userId: 'priya',
    userName: 'Priya Sharma',
    action: 'enable',
    resource: 'module',
    resourceId: 'ai-insights',
    resourceName: 'AI Insights'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    userId: 'james',
    userName: 'James Okonkwo',
    action: 'create',
    resource: 'template',
    resourceId: 'case-review',
    resourceName: 'Case Review Template'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    userId: 'priya',
    userName: 'Priya Sharma',
    action: 'create',
    resource: 'user',
    resourceId: 'emily',
    resourceName: 'Emily Roberts'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    userId: 'james',
    userName: 'James Okonkwo',
    action: 'update',
    resource: 'user',
    resourceId: 'marcus',
    resourceName: 'Marcus Williams',
    details: { field: 'role', oldValue: 'social_worker', newValue: 'housing_officer' }
  }
];

export function useAdmin() {
  const { role, currentUser, config } = useDemo();

  // State for admin data — lazy initializers read from localStorage on the
  // client, falling back to MOCK_* defaults when storage is empty or during SSR.
  const [users, setUsers] = useState<AdminUser[]>(
    () => readStorage<AdminUser[]>(LS_KEYS.users) ?? MOCK_USERS
  );
  const [modules, setModules] = useState<AdminModule[]>(
    () => readStorage<AdminModule[]>(LS_KEYS.modules) ?? MOCK_MODULES
  );
  const [templates, setTemplates] = useState<AdminTemplate[]>(
    () => readStorage<AdminTemplate[]>(LS_KEYS.templates) ?? MOCK_TEMPLATES
  );
  const [settings, setSettingsState] = useState<TenantSettings>(
    () => readStorage<TenantSettings>(LS_KEYS.settings) ?? MOCK_SETTINGS
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(
    () => readStorage<AuditLogEntry[]>(LS_KEYS.auditLog) ?? MOCK_AUDIT_LOG
  );
  const [isLoading] = useState(false);

  // Track whether initial render has completed so persistence effects only
  // write after the first real state change, not on mount.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // --- Persist to localStorage whenever state changes (skip initial mount) ---
  useEffect(() => {
    if (!mountedRef.current) return;
    writeStorage(LS_KEYS.users, users);
  }, [users]);

  useEffect(() => {
    if (!mountedRef.current) return;
    writeStorage(LS_KEYS.modules, modules);
  }, [modules]);

  useEffect(() => {
    if (!mountedRef.current) return;
    writeStorage(LS_KEYS.templates, templates);
  }, [templates]);

  useEffect(() => {
    if (!mountedRef.current) return;
    writeStorage(LS_KEYS.settings, settings);
  }, [settings]);

  useEffect(() => {
    if (!mountedRef.current) return;
    writeStorage(LS_KEYS.auditLog, auditLog);
  }, [auditLog]);

  // Permission checks
  const permissions = useMemo(() => ADMIN_PERMISSIONS[role] || [], [role]);
  
  const hasPermission = useCallback((action: AdminAction): boolean => {
    return permissions.includes(action);
  }, [permissions]);

  const canManageUsers = useMemo(() => hasPermission('users:write'), [hasPermission]);
  const canManageModules = useMemo(() => hasPermission('modules:write'), [hasPermission]);
  const canManageTemplates = useMemo(() => hasPermission('templates:write'), [hasPermission]);
  const canManageSettings = useMemo(() => hasPermission('settings:write'), [hasPermission]);
  const canViewAudit = useMemo(() => hasPermission('audit:read'), [hasPermission]);

  // Stats calculation
  const stats: AdminStats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalMeetings: 156,
    meetingsThisMonth: 42,
    transcriptionMinutes: 1847,
    storageUsedMb: 2340,
    activeModules: modules.filter(m => m.enabled).length,
    totalModules: modules.length
  }), [users, modules]);

  // Reset all admin data to factory defaults (clears localStorage)
  const resetToDefaults = useCallback(() => {
    setUsers(MOCK_USERS);
    setModules(MOCK_MODULES);
    setTemplates(MOCK_TEMPLATES);
    setSettingsState(MOCK_SETTINGS);
    setAuditLog(MOCK_AUDIT_LOG);
    Object.values(LS_KEYS).forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* noop */ }
    });
  }, []);

  // Audit log helper
  const logAction = useCallback((
    action: AuditLogEntry['action'],
    resource: AuditLogEntry['resource'],
    resourceId: string,
    resourceName: string,
    details?: Record<string, unknown>
  ) => {
    const entry: AuditLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      resource,
      resourceId,
      resourceName,
      details
    };
    setAuditLog(prev => [entry, ...prev]);
  }, [currentUser]);

  // User management
  const addUser = useCallback((user: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const newUser: AdminUser = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    logAction('create', 'user', newUser.id, newUser.name);
    return newUser;
  }, [logAction]);

  const updateUser = useCallback((id: string, updates: Partial<AdminUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    const user = users.find(u => u.id === id);
    if (user) {
      logAction('update', 'user', id, user.name, updates);
    }
  }, [users, logAction]);

  const deleteUser = useCallback((id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (user) {
      logAction('delete', 'user', id, user.name);
    }
  }, [users, logAction]);

  // Module management
  const toggleModule = useCallback((id: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        const newState = !m.enabled;
        logAction(newState ? 'enable' : 'disable', 'module', id, m.name);
        return { ...m, enabled: newState };
      }
      return m;
    }));
  }, [logAction]);

  const updateModuleSettings = useCallback((id: string, newSettings: Record<string, unknown>) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, settings: newSettings } : m));
    const targetModule = modules.find(m => m.id === id);
    if (targetModule) {
      logAction('update', 'module', id, targetModule.name, { settings: newSettings });
    }
  }, [modules, logAction]);

  // Template management
  const addTemplate = useCallback((template: Omit<AdminTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newTemplate: AdminTemplate = {
      ...template,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    setTemplates(prev => [...prev, newTemplate]);
    logAction('create', 'template', newTemplate.id, newTemplate.name);
    return newTemplate;
  }, [currentUser.id, logAction]);

  const updateTemplate = useCallback((id: string, updates: Partial<AdminTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    const template = templates.find(t => t.id === id);
    if (template) {
      logAction('update', 'template', id, template.name, updates);
    }
  }, [templates, logAction]);

  const deleteTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (template) {
      logAction('delete', 'template', id, template.name);
    }
  }, [templates, logAction]);

  // Settings management
  const updateSettings = useCallback((updates: Partial<TenantSettings>) => {
    setSettingsState(prev => ({ ...prev, ...updates }));
    logAction('update', 'settings', settings.id, settings.name, updates);
  }, [settings, logAction]);

  return {
    // Data
    users,
    modules,
    templates,
    settings,
    auditLog,
    stats,
    isLoading,
    
    // Permissions
    hasPermission,
    canManageUsers,
    canManageModules,
    canManageTemplates,
    canManageSettings,
    canViewAudit,
    
    // User actions
    addUser,
    updateUser,
    deleteUser,
    
    // Module actions
    toggleModule,
    updateModuleSettings,
    
    // Template actions
    addTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Settings actions
    updateSettings,

    // Admin data management
    resetToDefaults,

    // Context
    currentUser,
    tenantConfig: config
  };
}

export function useToast() {
  // Re-export from Toast component for convenience
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([]);

  const success = useCallback((message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type: 'success', message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const error = useCallback((message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type: 'error', message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const info = useCallback((message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type: 'info', message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  return { toasts, success, error, info };
}
