'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/icon-registry';
import { Skeleton } from '@careminutes/ui';

// Temporary: Use mock data until backend is running and OpenAPI client regenerated
// TODO: Replace with: import { useQuery } from '@tanstack/react-query';
// TODO: Replace with: import { getUserModulesModulesGetOptions } from '@/lib/client/@tanstack/react-query.gen';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    fab?: boolean;
}

// Temporary mock data - will be replaced by API call
const useMockModules = () => {
    return {
        data: {
            nav_items: [
                { label: 'Home', href: '/', icon: 'LayoutDashboard' },
                { label: 'Cases', href: '/cases', icon: 'Users' },
                { label: 'Record', href: '/record', icon: 'Mic', fab: true },
                { label: 'Notes', href: '/transcriptions', icon: 'FileText' },
                { label: 'Menu', href: '/menu', icon: 'Menu' },
            ] as NavItem[]
        },
        isLoading: false,
        error: null
    };
};

export function BottomNav() {
    const pathname = usePathname();

    // Temporary: Use mock data
    // TODO: Replace with real API call once backend running and client regenerated:
    // const { data: moduleData, isLoading } = useQuery({
    //     ...getUserModulesModulesGetOptions(),
    //     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    // });
    const { data: moduleData, isLoading } = useMockModules();

    const navItems = moduleData?.nav_items || [];

    if (isLoading) {
        return (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 pb-safe z-50">
                <div className="flex items-center justify-around px-2 py-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-12 rounded-lg" />
                    ))}
                </div>
            </nav>
        );
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 pb-safe z-50">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const IconComponent = getIcon(item.icon);

                    if (item.fab) {
                        return (
                            <div key={item.href} className="relative -top-6">
                                <Link
                                    href={item.href}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <IconComponent className="w-6 h-6" />
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
                            <IconComponent className={cn("w-5 h-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
