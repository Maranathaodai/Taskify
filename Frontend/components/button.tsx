import type React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const baseStyles =
    "font-medium rounded-[var(--radius)] transition-colors duration-200 inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary: "bg-accent text-accent-foreground hover:opacity-90 dark:bg-dark-accent dark:text-dark-accent-foreground",
    secondary:
      "bg-secondary text-secondary-foreground hover:opacity-90 dark:bg-dark-secondary dark:text-dark-secondary-foreground",
    outline:
      "border border-border text-foreground hover:bg-card dark:border-dark-border dark:text-dark-foreground dark:hover:bg-dark-card",
    ghost: "text-foreground hover:bg-card dark:text-dark-foreground dark:hover:bg-dark-card",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
}
