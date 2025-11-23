/**
 * Icon Registry
 * 
 * Maps icon names (strings from API) to Lucide React components.
 * Used by dynamic navigation to render icons from /api/modules endpoint.
 */

import {
    LayoutDashboard,
    Users,
    Mic,
    FileText,
    Home,
    ClipboardCheck,
    Menu,
    Settings,
    type LucideIcon,
} from 'lucide-react';

export const iconRegistry = {
    LayoutDashboard,
    Users,
    Mic,
    FileText,
    Home,
    ClipboardCheck,
    Menu,
    Settings,
} as const;

export type IconName = keyof typeof iconRegistry;

/**
 * Get icon component by name with fallback
 */
export function getIcon(name: string): LucideIcon {
    return iconRegistry[name as IconName] || iconRegistry.LayoutDashboard;
}
