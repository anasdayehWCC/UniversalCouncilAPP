'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/icon-registry';
import { Skeleton } from '@careminutes/ui';
import { useQuery } from '@tanstack/react-query';
import { getUserModulesModulesGetOptions } from '@/lib/client/@tanstack/react-query.gen';
import { Button } from '@careminutes/ui';
import { RefreshCw } from 'lucide-react';
import { useResilience } from '@/providers/ResilienceProvider';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    fab?: boolean;
}

const FALLBACK_NAV: NavItem[] = [
    { label: 'Home', href: '/', icon: 'LayoutDashboard' },
    { label: 'Cases', href: '/cases', icon: 'Users' },
    { label: 'Record', href: '/record', icon: 'Mic', fab: true },
    { label: 'Notes', href: '/transcriptions', icon: 'FileText' },
    { label: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
    { label: 'Insights', href: '/insights', icon: 'BarChart3' },
];

export function BottomNav() {
    const pathname = usePathname();
    const { isDegraded } = useResilience();

    const { data: moduleData, isLoading, isError, refetch } = useQuery({
        ...getUserModulesModulesGetOptions(),
        staleTime: 5 * 60 * 1000,
    });

    const navItems = ((moduleData as unknown as { navigation?: NavItem[] })?.navigation?.length
        ? (moduleData as unknown as { navigation?: NavItem[] }).navigation
        : FALLBACK_NAV) as NavItem[];

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
            {(isError || isDegraded) && (
                <div className="absolute -top-10 left-4 right-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1 text-[11px] text-amber-700">
                    <span>Navigation fallback (offline or API unreachable)</span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Retry
                    </Button>
                </div>
            )}
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
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                    (isError || isDegraded) && "opacity-60",
                                )}
                                aria-disabled={isError || isDegraded}
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
