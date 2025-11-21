'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Mic,
    Users,
    Menu
} from 'lucide-react';

const navItems = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Cases', href: '/cases', icon: Users },
    { label: 'Record', href: '/record', icon: Mic, isFab: true },
    { label: 'Notes', href: '/transcriptions', icon: FileText },
    { label: 'Menu', href: '/menu', icon: Menu },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 pb-safe z-50">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.isFab) {
                        return (
                            <div key={item.href} className="relative -top-6">
                                <Link
                                    href={item.href}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <item.icon className="w-6 h-6" />
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-lg transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
