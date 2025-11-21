'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Settings,
    Mic,
    Users,
    ClipboardCheck,
    FileClock
} from 'lucide-react';

const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Record', href: '/record', icon: Mic },
    { label: 'Transcriptions', href: '/transcriptions', icon: FileText },
    { label: 'Templates', href: '/templates', icon: ClipboardCheck },
    { label: 'Cases', href: '/cases', icon: Users },
    { label: 'History', href: '/history', icon: FileClock },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="p-6">
                <Logo />
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Storage Used</p>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[65%] bg-primary rounded-full" />
                    </div>
                    <p className="text-xs text-right mt-1 text-muted-foreground">65%</p>
                </div>
            </div>
        </aside>
    );
}
