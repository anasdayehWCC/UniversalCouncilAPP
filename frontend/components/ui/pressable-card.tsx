"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  className?: string
  role?: string
  "aria-label"?: string
}

/**
 * Minimal pressable surface that keeps styling token-based and RN-Web friendly.
 * No DOM-specific APIs beyond onClick to ease future RN extraction.
 */
export const PressableCard: React.FC<Props> = ({
  children,
  onPress,
  disabled = false,
  className,
  role = "button",
  ...rest
}) => {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }
      onPress?.()
    },
    [disabled, onPress],
  )

  return (
    <div
      role={role}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onPress?.()
        }
      }}
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
