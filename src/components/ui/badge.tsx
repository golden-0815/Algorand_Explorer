import * as React from "react"

const badgeVariants = {
  default: "bg-algo-accent text-algo-dark hover:bg-algo-accent/90",
  secondary: "bg-algo-gray-light text-algo-text hover:bg-algo-gray-light/80",
  destructive: "bg-red-500 text-white hover:bg-red-500/90",
  outline: "border border-algo-gray-light text-algo-text",
}

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: keyof typeof badgeVariants
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-algo-accent focus:ring-offset-2 ${badgeVariants[variant]} ${className || ''}`}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants } 