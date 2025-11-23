"use client"

import { PressableSurface } from "@/lib/ui/pressable"
import { TokenText } from "@careminutes/ui"

export default function UIPlaygroundPage() {
  return (
    <main className="p-6 space-y-4">
      <TokenText as="h1" className="text-3xl font-bold">
        UI Playground (dev only)
      </TokenText>
      <TokenText emphasis="muted">Token-driven primitives rendered in isolation.</TokenText>
      <div className="grid gap-4 md:grid-cols-2">
        <PressableSurface className="p-4">
          <TokenText as="h2" className="text-xl font-semibold">
            PressableSurface
          </TokenText>
          <TokenText emphasis="muted">Tokenised border/bg, keyboard accessible, RN-Web friendly.</TokenText>
        </PressableSurface>
        <PressableSurface className="p-4" disabled>
          <TokenText as="h2" className="text-xl font-semibold">
            Disabled state
          </TokenText>
          <TokenText emphasis="muted">Demonstrates disabled visuals and keyboard guard.</TokenText>
        </PressableSurface>
      </div>
    </main>
  )
}
