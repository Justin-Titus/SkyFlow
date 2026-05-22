import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, rightElement, id, ...props }, ref) => {
    // Generate a stable ID if not provided
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label htmlFor={inputId} className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] ml-1 group-focus-within:text-indigo-400 transition-colors">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border border-white/6 bg-white/3 px-4 py-2 text-sm text-slate-100 shadow-inner transition-all placeholder:text-slate-600",
              "focus-visible:outline-none focus-visible:border-indigo-500/50 focus-visible:bg-indigo-500/5 focus-visible:shadow-[0_0_0_3px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              icon && "pl-10",
              rightElement && "pr-10",
              error && "border-red-500/40 focus-visible:border-red-500/60 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
              className
            )}
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center z-10">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-400 ml-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
