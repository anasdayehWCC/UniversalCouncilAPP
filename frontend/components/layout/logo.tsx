'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Logo() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Default to WCC in dev-preview mode
    const effectiveTheme = resolvedTheme || 'theme-wcc';

    if (!mounted) {
        return (
            <div className="flex items-center gap-3">
                <div className="h-10 w-48 animate-pulse bg-white/20 rounded" />
            </div>
        );
    }

    if (effectiveTheme === 'theme-wcc' || !resolvedTheme) {
        return (
            <div className="flex items-center gap-3">
                <Image
                    src="/assets/orgs/wcc.svg"
                    alt="Westminster City Council"
                    width={200}
                    height={50}
                    className="h-14 w-auto drop-shadow-2xl"
                    priority
                />
            </div>
        );
    }

    if (effectiveTheme === 'theme-rbkc') {
        return (
            <div className="flex items-center gap-3">
                <Image
                    src="/assets/orgs/rbkc.svg"
                    alt="Royal Borough of Kensington & Chelsea"
                    width={250}
                    height={50}
                    className="h-14 w-auto drop-shadow-2xl"
                    priority
                />
            </div>
        );
    }

    // Fallback with improved branding
    return (
        <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white drop-shadow-lg">CareMinutes</span>
        </div>
    );
}
