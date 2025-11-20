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

    if (!mounted) {
        return (
            <div className="flex items-center gap-3">
                <span className="font-gds-transport text-3xl text-white">Minute</span>
            </div>
        );
    }

    if (resolvedTheme === 'theme-wcc') {
        return (
            <div className="flex items-center gap-3">
                <Image src="/assets/orgs/wcc.svg" alt="Westminster City Council" width={200} height={50} className="h-10 w-auto" />
            </div>
        );
    }

    if (resolvedTheme === 'theme-rbkc') {
        return (
            <div className="flex items-center gap-3">
                <Image src="/assets/orgs/rbkc.svg" alt="RBKC" width={250} height={50} className="h-10 w-auto" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <span className="font-gds-transport text-3xl text-white">Minute</span>
        </div>
    );
}
