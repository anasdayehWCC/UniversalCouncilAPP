import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./utils"

const tokenTextVariants = cva(
  "font-mono text-sm font-semibold",
  {
    variants: {
      emphasis: {
        default: "bg-muted px-[0.3rem] py-[0.2rem] rounded",
        muted: "text-muted-foreground",
        none: "",
        strong: "font-bold", // Added strong to match previous usage in package if needed, or stick to local definition?
      },
    },
    defaultVariants: {
      emphasis: "default",
    },
  }
)

export interface TokenTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof tokenTextVariants> {
  asChild?: boolean
  as?: React.ElementType
}

const TokenText = React.forwardRef<HTMLSpanElement, TokenTextProps>(
  ({ className, emphasis, asChild = false, as: Component = "span", ...props }, ref) => {
    const Comp = asChild ? Slot : Component
    return (
      <Comp
        ref={ref}
        className={cn(tokenTextVariants({ emphasis, className }))}
        {...props}
      />
    )
  }
)
TokenText.displayName = "TokenText"

export { TokenText, tokenTextVariants }
