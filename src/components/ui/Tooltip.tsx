"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// A simple custom tooltip since we don't have Radix UI installed
// In a real production app, we would use @radix-ui/react-tooltip

interface TooltipContextType {
  open: boolean
  setOpen: (open: boolean) => void
  tooltipId?: string
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined)

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const tooltipId = React.useId()

  return (
    <TooltipContext.Provider value={{ open, setOpen, tooltipId }}>
      <div 
        className="relative inline-flex" 
        onMouseEnter={() => setOpen(true)} 
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  // Simple pass-through for our custom implementation
  return <>{children}</>
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
}

export function TooltipContent({ children, className, side = "top", ...props }: TooltipContentProps) {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error("TooltipContent must be used within Tooltip")

  if (!context.open) return null

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  }

  return (
    <div
      id={context.tooltipId}
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 shadow-md animate-fade-in-up",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
