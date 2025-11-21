'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role, Domain, getThemeForRole } from './theme/tokens';

// Mock User Interface matching the backend model roughly
interface MockUser {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    domain: Domain;
}

interface DevPreviewContextType {
    currentUser: MockUser;
    currentRole: Role;
    currentDomain: Domain;
    isOffline: boolean;
    setRole: (role: Role) => void;
    setDomain: (domain: Domain) => void;
    toggleOffline: () => void;
}

const DevPreviewContext = createContext<DevPreviewContextType | undefined>(undefined);

const MOCK_USERS: Record<Role, MockUser> = {
    social_worker: {
        id: 'mock-sw-1',
        email: 'sw@careminutes.local',
        full_name: 'Sarah Social Worker',
        role: 'social_worker',
        domain: 'childrens',
    },
    manager: {
        id: 'mock-mgr-1',
        email: 'manager@careminutes.local',
        full_name: 'Mike Manager',
        role: 'manager',
        domain: 'childrens',
    },
    admin: {
        id: 'mock-admin-1',
        email: 'admin@careminutes.local',
        full_name: 'Alice Admin',
        role: 'admin',
        domain: 'adults',
    },
};

export function DevPreviewProvider({ children }: { children: React.ReactNode }) {
    const [currentRole, setCurrentRole] = useState<Role>('social_worker');
    const [currentDomain, setCurrentDomain] = useState<Domain>('childrens');
    const [isOffline, setIsOffline] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Only run in dev/preview mode
    const isDev = process.env.NEXT_PUBLIC_DEV_PREVIEW === 'true' || process.env.NODE_ENV === 'development';

    useEffect(() => {
        setMounted(true);
        // Apply initial theme
        applyTheme(currentRole);
    }, []);

    useEffect(() => {
        if (mounted) {
            applyTheme(currentRole);
        }
    }, [currentRole, mounted]);

    const applyTheme = (role: Role) => {
        const theme = getThemeForRole(role);
        const root = document.documentElement;

        Object.entries(theme.colors).forEach(([key, value]) => {
            // Convert camelCase to kebab-case for CSS variables
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
        });

        // Also set a data-attribute for scoped styling if needed
        root.setAttribute('data-theme', role);
    };

    const currentUser = {
        ...MOCK_USERS[currentRole],
        domain: currentDomain,
    };

    const value = {
        currentUser,
        currentRole,
        currentDomain,
        isOffline,
        setRole: setCurrentRole,
        setDomain: setCurrentDomain,
        toggleOffline: () => setIsOffline((prev) => !prev),
    };

    return (
        <DevPreviewContext.Provider value={value}>
            {children}
            {mounted && isDev && <DevToolsWidget />}
        </DevPreviewContext.Provider>
    );
}

export const useDevPreview = () => {
    const context = useContext(DevPreviewContext);
    if (context === undefined) {
        throw new Error('useDevPreview must be used within a DevPreviewProvider');
    }
    return context;
};

function DevToolsWidget() {
    const { currentRole, setRole, isOffline, toggleOffline } = useDevPreview();
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 rounded-full bg-black text-white p-3 shadow-lg hover:scale-110 transition-transform"
                title="Open Dev Tools"
            >
                🛠️
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg border border-border bg-background p-4 shadow-xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Dev Preview</h3>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
                    <select
                        value={currentRole}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="social_worker">Social Worker</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Offline Mode</label>
                    <button
                        onClick={toggleOffline}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isOffline ? 'bg-red-500' : 'bg-slate-200'
                            }`}
                    >
                        <span
                            className={`${isOffline ? 'translate-x-4' : 'translate-x-1'
                                } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>

                <div className="pt-2 border-t border-border">
                    <div className="text-[10px] text-muted-foreground">
                        Theme: <span className="font-mono text-foreground">{currentRole}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
