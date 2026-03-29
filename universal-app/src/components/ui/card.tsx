import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    variant?: "default" | "glass" | "elevated" | "gradient" | "hero"
    hoverEffect?: boolean
  }
>(({ className, variant = "default", hoverEffect = true, ...props }, ref) => {
  const variants = {
    default: "bg-card text-card-foreground shadow-sm border border-border",
    glass: "relative overflow-hidden backdrop-blur-xl bg-card/60 dark:bg-card/40 border-border/40 text-foreground shadow-lg",
    elevated: "bg-card text-card-foreground shadow-md border-0",
    gradient: "bg-gradient-to-br from-card to-muted border border-border/50 shadow-sm",
    hero: "relative overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-card/20 via-card/10 to-card/5 border border-border/30 shadow-2xl ring-1 ring-border/20 after:absolute after:inset-0 after:bg-gradient-to-br after:from-card/15 after:via-card/5 after:to-transparent after:opacity-80 after:pointer-events-none after:content-['']"
  }

  const hoverClasses = hoverEffect
    ? variant === "hero"
      ? "hover:-translate-y-1 hover:shadow-[0_25px_80px_-30px_rgba(15,23,42,0.55)] dark:hover:shadow-[0_25px_80px_-30px_rgba(0,0,0,0.75)] hover:border-border/40"
      : variant === "glass"
      ? "hover:bg-card/70 dark:hover:bg-card/50 hover:-translate-y-1"
      : "hover:shadow-md"
    : ""

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl transition-all duration-300",
        variants[variant],
        hoverClasses,
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight font-display",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
