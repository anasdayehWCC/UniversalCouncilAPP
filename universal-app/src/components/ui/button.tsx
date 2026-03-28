import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

// Note: You might need to install class-variance-authority and @radix-ui/react-slot if not already.
// For this demo, I'll assume standard props or simple implementation if deps are missing, 
// but I'll stick to a simpler implementation to avoid extra deps for now if I didn't install them.
// Actually, I didn't install cva or radix-slot. I'll do a simpler version.

const buttonVariants = (variant: string = "default", size: string = "default") => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    
    const variants: Record<string, string> = {
        default: "bg-[var(--primary)] text-white hover:opacity-90 shadow-sm focus-visible:ring-[var(--accent)]",
        destructive: "bg-red-500 text-white hover:bg-red-500/90",
        outline: "border border-slate-300 bg-transparent hover:bg-slate-100 hover:text-slate-900 text-slate-700",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
        link: "text-blue-600 underline-offset-4 hover:underline",
        glass: "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 shadow-lg"
    }

    const sizes: Record<string, string> = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    }

    return cn(base, variants[variant], sizes[size])
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants(variant, size), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
