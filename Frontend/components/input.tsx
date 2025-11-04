import React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "w-full px-4 py-2 rounded-[var(--radius)] border border-input-border bg-input text-foreground placeholder:text-muted transition-colors duration-200",
      "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
      "dark:border-dark-input-border dark:bg-dark-input dark:text-dark-foreground dark:placeholder:text-dark-muted dark:focus:ring-dark-accent dark:focus:ring-offset-dark-background",
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"
