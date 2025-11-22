import * as React from "react"
import { Card } from "./card"
import { cn } from "@/lib/utils"

interface PressableCardProps extends React.ComponentProps<typeof Card> {
    onClick?: () => void
}

const PressableCard = React.forwardRef<HTMLDivElement, PressableCardProps>(
    ({ className, onClick, ...props }, ref) => {
        return (
            <Card
                ref={ref}
                className={cn(
                    "cursor-pointer transition-all hover:bg-accent/50 active:scale-[0.98]",
                    className
                )}
                onClick={onClick}
                {...props}
            />
        )
    }
)
PressableCard.displayName = "PressableCard"

export { PressableCard }
