"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, Square, Pause, Play, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecordingCardProps {
    className?: string
}

export function RecordingCard({ className }: RecordingCardProps) {
    const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle")
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (status === "recording") {
            interval = setInterval(() => {
                setDuration((prev) => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [status])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className={cn("relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl p-6 transition-all duration-500", className)}>
            {/* Ambient Background Glow */}
            <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl transition-all duration-1000",
                status === "recording" && "bg-red-500/20 scale-150"
            )} />

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Status Badge */}
                <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300",
                    status === "recording" ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                )}>
                    {status === "idle" ? "Ready to Capture" : status === "recording" ? "Recording..." : "Paused"}
                </div>

                {/* Timer */}
                <div className="text-5xl font-heading font-bold tracking-tight tabular-nums text-foreground/80">
                    {formatTime(duration)}
                </div>

                {/* Waveform Visualization (Simulated) */}
                <div className="h-12 flex items-center gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className={cn(
                                "w-1.5 rounded-full transition-colors duration-300",
                                status === "recording" ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                            animate={status === "recording" ? {
                                height: [10, Math.random() * 40 + 10, 10],
                            } : {
                                height: 8
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                delay: i * 0.05,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 mt-2">
                    {status === "idle" ? (
                        <button
                            onClick={() => setStatus("recording")}
                            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-all duration-300"
                        >
                            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                            <Mic className="w-8 h-8" />
                            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-40" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setStatus("idle")}
                                className="flex items-center justify-center w-14 h-14 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                            >
                                <Square className="w-5 h-5 fill-current" />
                            </button>

                            <button
                                onClick={() => setStatus(status === "recording" ? "paused" : "recording")}
                                className="flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-all"
                            >
                                {status === "recording" ? (
                                    <Pause className="w-8 h-8 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 fill-current ml-1" />
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Upload Option */}
                {status === "idle" && (
                    <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                        <UploadCloud className="w-4 h-4" />
                        Upload Audio File
                    </button>
                )}
            </div>
        </div>
    )
}
