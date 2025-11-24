'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/icon-registry';
import { Skeleton } from '@careminutes/ui';
import { useQuery } from '@tanstack/react-query';
import { getUserModulesModulesGetOptions } from '@/lib/client/@tanstack/react-query.gen';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    fab?: boolean;
}

const FALLBACK_NAV: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { label: 'Record', href: '/record', icon: 'Mic' },
    { label: 'Transcriptions', href: '/transcriptions', icon: 'FileText' },
    { label: 'Templates', href: '/templates', icon: 'ClipboardCheck' },
    { label: 'Cases', href: '/cases', icon: 'Users' },
    { label: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
];

export function Sidebar() {
    const pathname = usePathname();

    const { data: moduleData, isLoading, isError } = useQuery({
        ...getUserModulesModulesGetOptions(),
        staleTime: 5 * 60 * 1000,
    });

    const navItems = (moduleData?.nav_items?.length ? moduleData.nav_items : FALLBACK_NAV) as NavItem[];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="p-6">
                <Logo />
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {isError && (
                    <p className="px-3 py-2 text-xs text-amber-500 bg-amber-50/50 rounded-xl border border-amber-200">
                        Navigation failed to load — showing default links.
                    </p>
                )}
                {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))
                ) : (
                    navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const IconComponent = getIcon(item.icon);

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
                                <IconComponent className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })
                )}
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
