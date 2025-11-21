'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PressableCard } from '@/components/ui/pressable-card'
import { Skeleton } from '@/components/ui/skeleton'

export default function UIDemoPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Pressable Card</h2>
        <PressableCard className="p-3">
          <div className="text-sm text-muted-foreground">RN-Web friendly press target</div>
        </PressableCard>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Skeleton</h2>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </Card>
    </div>
  )
}
