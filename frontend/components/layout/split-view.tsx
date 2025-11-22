"use client"

import { ReactNode, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface SplitViewProps {
    children: ReactNode
    sidebar: ReactNode
    sidebarOpen?: boolean
    onSidebarToggle?: (open: boolean) => void
    className?: string
}

export function SplitView({
    children,
    sidebar,
    sidebarOpen = true,
    onSidebarToggle,
    className
}: SplitViewProps) {
    const [isInternalOpen, setIsInternalOpen] = useState(sidebarOpen)

    const isOpen = onSidebarToggle ? sidebarOpen : isInternalOpen
    const toggle = () => {
        const newState = !isOpen
        if (onSidebarToggle) {
            onSidebarToggle(newState)
        } else {
            setIsInternalOpen(newState)
        }
    }

    return (
        <div className={cn("flex h-[calc(100vh-4rem)] overflow-hidden", className)}>
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 overflow-y-auto relative">
                <div className="max-w-5xl mx-auto p-6 md:p-8">
                    {children}
                </div>

                {/* Floating Toggle Button (Visible when sidebar is closed) */}
                <AnimatePresence>
                    {!isOpen && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={toggle}
                            className="absolute right-6 top-6 z-20 p-2 rounded-full bg-white/80 backdrop-blur shadow-lg border border-white/20 text-muted-foreground hover:text-primary transition-colors"
                            title="Open Sidebar"
                        >
                            <PanelRightOpen className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Sidebar */}
            <motion.div
                initial={false}
                animate={{
                    width: isOpen ? 380 : 0,
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-l border-white/20 bg-white/50 backdrop-blur-xl relative flex-shrink-0"
            >
                <div className="w-[380px] h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
                        <span className="text-sm font-medium text-muted-foreground">AI Assistant</span>
                        <button
                            onClick={toggle}
                            className="p-1.5 rounded-md hover:bg-black/5 text-muted-foreground transition-colors"
                        >
                            <PanelRightClose className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {sidebar}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
