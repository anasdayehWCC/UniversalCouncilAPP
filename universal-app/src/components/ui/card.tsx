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
    default: "bg-card text-card-foreground shadow-sm border",
    glass: "relative overflow-hidden backdrop-blur-xl bg-white/60 border-white/40 text-foreground shadow-lg",
    elevated: "bg-card text-card-foreground shadow-md border-0",
    gradient: "bg-gradient-to-br from-white to-slate-50 border border-white/50 shadow-sm",
    hero: "relative overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-white/20 via-white/10 to-white/5 border border-white/30 shadow-2xl ring-1 ring-white/20 after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/15 after:via-white/5 after:to-transparent after:opacity-80 after:pointer-events-none after:content-['']"
  }

  const hoverClasses = hoverEffect
    ? variant === "hero"
      ? "hover:-translate-y-1 hover:shadow-[0_25px_80px_-30px_rgba(15,23,42,0.55)] hover:border-white/40"
      : variant === "glass"
      ? "hover:bg-white/70 hover:-translate-y-1"
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
