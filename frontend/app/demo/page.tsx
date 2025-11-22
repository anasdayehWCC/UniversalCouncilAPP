"use client"

import { RecordingCard } from "@/components/recording/recording-card"
import { SplitView } from "@/components/layout/split-view"
import { Button } from "@/components/ui/button"
import { Wand2, Sparkles } from "lucide-react"

export default function DemoPage() {
    return (
        <SplitView
            sidebar={
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Magic Suggestions</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Based on the recording, here are some suggestions to improve the minute.
                        </p>
                        <Button size="sm" className="w-full bg-white shadow-sm text-primary hover:bg-white/80">
                            Fix grammar
                        </Button>
                        <Button size="sm" className="w-full bg-white shadow-sm text-primary hover:bg-white/80">
                            Make more formal
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Actions</h4>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Wand2 className="w-4 h-4" />
                            Rewrite Selection
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Recording Studio Demo</h1>
                    <p className="text-muted-foreground">Testing the new premium components.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Recording Card</h2>
                        <RecordingCard />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Typography & Tokens</h2>
                        <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl space-y-4">
                            <h3 className="text-xl font-heading font-bold text-primary">Magic Heading</h3>
                            <p className="text-muted-foreground">
                                This is a sample paragraph using the muted foreground color. It should look clean and legible.
                            </p>
                            <div className="flex gap-2">
                                <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">Primary Action</Button>
                                <Button variant="secondary" className="bg-secondary text-secondary-foreground">Secondary</Button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </SplitView>
    )
}
