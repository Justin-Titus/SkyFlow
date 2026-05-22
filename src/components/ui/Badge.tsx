import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "first" | "business" | "economy" | "cyan"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-white/5 text-slate-300 border-white/8",
    secondary: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    outline: "text-slate-400 border-white/10 bg-transparent",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    first: "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-300 border-amber-500/25",
    business: "bg-gradient-to-r from-violet-500/15 to-purple-500/10 text-violet-300 border-violet-500/25",
    economy: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
