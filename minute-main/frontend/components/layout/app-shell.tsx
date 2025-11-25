'use client';

import { ReactNode, useState, useCallback } from 'react';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { Header } from './header';
import { ResilienceBanner } from '@/components/resilience/resilience-banner';
import { AppErrorBoundary } from '@/components/resilience/app-error-boundary';

export function AppShell({ children }: { children: ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0">
                <ResilienceBanner />
                {/* Header (Transparent Overlay) */}
                <Header onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />

                {/* Main Content */}
                <AppErrorBoundary>
                    <main className="flex-1 relative transition-all duration-200">
                        {children}
                    </main>
                </AppErrorBoundary>

                {/* Mobile Bottom Nav */}
                <BottomNav />
            </div>
        </div>
    );
}
