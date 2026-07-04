import React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "../../lib/utils"

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group bg-transparent relative w-auto cursor-pointer overflow-hidden rounded-full border border-surface-3 p-1.5 px-4 text-center font-medium text-sm transition-colors hover:border-danger hover:bg-surface-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="bg-danger h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 text-ink">
          {children}
        </span>
      </div>
      <div className="text-white absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-3 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  )
}
