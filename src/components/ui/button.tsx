import * as React from "react"

import { cn } from "../../lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-algo-accent text-algo-dark hover:bg-algo-accent/90",
    destructive: "bg-red-500 text-white hover:bg-red-500/90",
    outline: "border border-algo-gray-light bg-algo-dark hover:bg-algo-gray-light/10 hover:text-algo-text",
    secondary: "bg-algo-gray-light text-algo-text hover:bg-algo-gray-light/80",
    ghost: "hover:bg-algo-gray-light/10 hover:text-algo-text",
    link: "text-algo-accent underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-algo-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 