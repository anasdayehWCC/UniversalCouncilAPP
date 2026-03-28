import { ServiceDomain, UserRole } from '@/config/domains';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  domain: ServiceDomain;
  team: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

export interface AdminModule {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'ai' | 'integration' | 'pilot';
  enabled: boolean;
  configurable: boolean;
  dependencies?: string[];
  settings?: Record<string, unknown>;
}

export interface AdminTemplate {
  id: string;
  name: string;
  description: string;
  domain: ServiceDomain;
  sections: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TenantSettings {
  id: string;
  name: string;
  domain: ServiceDomain;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  features: {
    aiEdit: boolean;
    smartCapture: boolean;
    offlineMode: boolean;
    pushNotifications: boolean;
  };
  compliance: {
    dataRetentionDays: number;
    auditLogRetentionDays: number;
    requireMfa: boolean;
    allowedDomains: string[];
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhookUrl?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable' | 'login' | 'logout';
  resource: 'user' | 'module' | 'template' | 'settings' | 'meeting';
  resourceId: string;
  resourceName: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMeetings: number;
  meetingsThisMonth: number;
  transcriptionMinutes: number;
  storageUsedMb: number;
  activeModules: number;
  totalModules: number;
}

export type AdminAction = 
  | 'users:read' 
  | 'users:write' 
  | 'modules:read' 
  | 'modules:write'
  | 'templates:read'
  | 'templates:write'
  | 'settings:read'
  | 'settings:write'
  | 'audit:read';

export const ADMIN_PERMISSIONS: Record<UserRole, AdminAction[]> = {
  admin: [
    'users:read', 'users:write',
    'modules:read', 'modules:write',
    'templates:read', 'templates:write',
    'settings:read', 'settings:write',
    'audit:read'
  ],
  manager: [
    'users:read',
    'modules:read',
    'templates:read', 'templates:write',
    'audit:read'
  ],
  social_worker: [],
  housing_officer: []
};
