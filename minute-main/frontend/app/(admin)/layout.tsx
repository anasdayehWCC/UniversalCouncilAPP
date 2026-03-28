'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings2, Grid, ScrollText, Shield, TrendingUp } from 'lucide-react'

const adminNavItems = [
    { href: '/admin/configs', label: 'Configurations', icon: Settings2 },
    { href: '/admin/modules', label: 'Modules', icon: Grid },
    { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { href: '/admin/adoption', label: 'Adoption', icon: TrendingUp },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    
    return (
        <div className="min-h-screen bg-background">
            <div className="border-b">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <Shield className="h-6 w-6 text-primary" />
                            <h2 className="text-xl font-semibold">Admin Console</h2>
                        </div>
                        <Link
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            ← Back to app
                        </Link>
                    </div>
                    <nav className="flex gap-6 pb-2">
                        {adminNavItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 text-sm pb-2 border-b-2 transition-colors ${
                                        isActive
                                            ? 'border-primary text-foreground font-medium'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>
            {children}
        </div>
    )
}
