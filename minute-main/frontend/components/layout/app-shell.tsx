'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { Header } from './header';

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Transparent Overlay) */}
                <Header />

                {/* Main Content */}
                <main className="flex-1 relative">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <BottomNav />
            </div>
        </div>
    );
}
