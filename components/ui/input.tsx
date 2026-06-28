import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-c-line bg-white/[0.04] px-3 py-2 text-sm text-c-ink file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-c-ink3 focus-visible:outline-none focus-visible:border-c-accent focus-visible:ring-2 focus-visible:ring-c-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
