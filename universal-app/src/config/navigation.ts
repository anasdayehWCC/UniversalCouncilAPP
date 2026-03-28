import {
  Home,
  FileText,
  Mic,
  Upload,
  Clipboard,
  CheckSquare,
  BarChart,
  Users,
  Settings,
  Building,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FeatureFlags } from '@/types/flags';
import { ServiceDomain, UserRole } from '@/config/domains';

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  flag?: keyof FeatureFlags;
}

const createNav = (links: NavLink[]) => links;

const SOCIAL_WORKER_NAV: Record<ServiceDomain, NavLink[]> = {
  children: createNav([
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Notes', href: '/my-notes', icon: FileText },
    { label: 'Smart Capture', href: '/record', icon: Mic, flag: 'smartCapture', description: 'Smart Capture audio recording' },
    { label: 'Upload', href: '/upload', icon: Upload },
    { label: 'Templates', href: '/templates', icon: Clipboard },
  ]),
  adults: createNav([
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Notes', href: '/my-notes', icon: FileText },
    { label: 'Smart Capture', href: '/record', icon: Mic, flag: 'smartCapture' },
    { label: 'Upload', href: '/upload', icon: Upload },
    { label: 'Templates', href: '/templates', icon: Clipboard },
  ]),
  housing: createNav([
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Notes', href: '/my-notes', icon: FileText },
    { label: 'Smart Capture', href: '/record', icon: Mic, flag: 'smartCapture' },
    { label: 'Upload', href: '/upload', icon: Upload },
    { label: 'Templates', href: '/templates', icon: Clipboard, flag: 'housingPilot' },
  ]),
  corporate: [],
};

const MANAGER_NAV: Record<ServiceDomain, NavLink[]> = {
  children: createNav([
    { label: 'Home', href: '/', icon: Home },
    { label: 'Team Notes', href: '/my-notes', icon: FileText },
    { label: 'Review Queue', href: '/review-queue', icon: CheckSquare },
    { label: 'Team Insights', href: '/insights', icon: BarChart, flag: 'aiInsights' },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
  adults: createNav([
    { label: 'Home', href: '/', icon: Home },
    { label: 'Team Notes', href: '/my-notes', icon: FileText },
    { label: 'Review Queue', href: '/review-queue', icon: CheckSquare },
    { label: 'Team Insights', href: '/insights', icon: BarChart, flag: 'aiInsights' },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
  housing: createNav([
    { label: 'Home', href: '/', icon: Home },
    { label: 'Review Queue', href: '/review-queue', icon: CheckSquare },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
  corporate: [],
};

const ADMIN_NAV: Record<ServiceDomain, NavLink[]> = {
  children: createNav([
    { label: 'Configuration', href: '/admin', icon: Settings },
    { label: 'Modules', href: '/admin/modules', icon: Building },
    { label: 'Analytics', href: '/insights', icon: BarChart, flag: 'aiInsights' },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
  adults: createNav([
    { label: 'Configuration', href: '/admin', icon: Settings },
    { label: 'Modules', href: '/admin/modules', icon: Building },
    { label: 'Analytics', href: '/insights', icon: BarChart, flag: 'aiInsights' },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
  housing: createNav([
    { label: 'Configuration', href: '/admin', icon: Settings },
    { label: 'Modules', href: '/admin/modules', icon: Building },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
  corporate: createNav([
    { label: 'Configuration', href: '/admin', icon: Settings },
    { label: 'Modules', href: '/admin/modules', icon: Building },
    { label: 'Analytics', href: '/insights', icon: BarChart },
    { label: 'Users & Teams', href: '/admin/users', icon: Users },
  ]),
};

export const NAV_CONFIG: Record<ServiceDomain, Record<UserRole, NavLink[]>> = {
  children: {
    social_worker: SOCIAL_WORKER_NAV.children,
    manager: MANAGER_NAV.children,
    admin: ADMIN_NAV.children,
    housing_officer: [],
  },
  adults: {
    social_worker: SOCIAL_WORKER_NAV.adults,
    manager: MANAGER_NAV.adults,
    admin: ADMIN_NAV.adults,
    housing_officer: [],
  },
  housing: {
    social_worker: SOCIAL_WORKER_NAV.housing,
    manager: MANAGER_NAV.housing,
    admin: ADMIN_NAV.housing,
    housing_officer: SOCIAL_WORKER_NAV.housing,
  },
  corporate: {
    social_worker: [],
    manager: [],
    admin: ADMIN_NAV.corporate,
    housing_officer: [],
  },
};

export function getNavForRole(domain: ServiceDomain, role: UserRole, featureFlags: FeatureFlags): NavLink[] {
  const entries = NAV_CONFIG[domain]?.[role] ?? [];
  return entries.filter(entry => (entry.flag ? featureFlags[entry.flag] : true));
}
