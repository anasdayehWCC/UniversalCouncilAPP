import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <div className="border-b">
                <div className="container mx-auto px-4 py-4">
                    <h2 className="text-xl font-semibold">Admin Console</h2>
                </div>
            </div>
            {children}
        </div>
    )
}
