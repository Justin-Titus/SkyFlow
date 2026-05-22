import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "glow"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] overflow-hidden"
    
    const variants = {
      default: "bg-indigo-600 text-white rounded-xl border border-indigo-500/50 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_28px_rgba(99,102,241,0.45)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-100",
      secondary: "bg-white/5 text-slate-200 rounded-xl border border-white/8 hover:bg-white/10 hover:border-white/15",
      outline: "border border-indigo-500/30 bg-transparent hover:bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 rounded-xl hover:border-indigo-500/50",
      ghost: "hover:bg-white/6 hover:text-white text-slate-400 rounded-lg",
      danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 rounded-xl",
      glow: "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl border border-cyan-400/20 shadow-[0_0_30px_rgba(0,210,255,0.3)] hover:shadow-[0_0_45px_rgba(0,210,255,0.5)] hover:from-cyan-400 hover:to-indigo-500 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent",
    }
    
    const sizes = {
      default: "h-10 px-5 py-2 text-sm",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
