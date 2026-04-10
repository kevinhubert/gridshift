import * as React from "react"

import { cn } from "@/lib/utils"

/** Text field styled like `SelectTrigger` / `Button` outline inputs in this project. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "flex h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-none transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
