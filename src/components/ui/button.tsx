import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-pixelGreen bg-pixelGreen text-pixelBlack hover:border-pixelYellow hover:bg-pixelYellow",
        outline:
          "border border-pixelGray bg-pixelWhite text-pixelBlack hover:border-pixelGreen hover:bg-pixelGray hover:text-pixelBlack",
        secondary:
          "border border-pixelBlue bg-pixelBlue text-pixelBlack hover:border-pixelGreen hover:bg-pixelGreen",
        destructive:
          "border border-red-300 bg-red-100 text-red-800 hover:border-red-400 hover:bg-red-200",
        ghost:
          "border border-transparent bg-transparent text-pixelGreen hover:border-pixelGreen hover:bg-pixelGray hover:text-pixelBlack",
        link:
          "border-none bg-transparent text-pixelBlue underline-offset-4 hover:text-pixelGreen hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
