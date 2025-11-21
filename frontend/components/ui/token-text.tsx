"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  as?: React.ElementType
  children: React.ReactNode
  emphasis?: "muted" | "default" | "strong"
  className?: string
}

/**
 * Token-driven text primitive. Keeps typography/styles bound to CSS variables
 * so it can be mirrored in RN using the same token values.
 */
export const TokenText: React.FC<Props> = ({
  as: Component = "p",
  children,
  emphasis = "default",
  className,
}) => {
  const colorClass =
    emphasis === "muted"
      ? "text-[color:var(--muted-foreground)]"
      : emphasis === "strong"
        ? "font-semibold text-[color:var(--foreground)]"
        : "text-[color:var(--foreground)]"

  return <Component className={cn("leading-relaxed", colorClass, className)}>{children}</Component>
}
