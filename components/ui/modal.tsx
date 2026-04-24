"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  title: string
  onClose: () => void
  size?: "md" | "lg"
  scrollable?: boolean
  children: React.ReactNode
  closeLabel?: string
}

export function Modal({
  title,
  onClose,
  size = "md",
  scrollable = false,
  children,
  closeLabel = "Close",
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={cn(
          "bg-white rounded-xl shadow-lg w-full flex flex-col",
          size === "lg" ? "max-w-lg" : "max-w-md",
          scrollable && "max-h-[90vh]"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-none">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={closeLabel}
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className={cn("p-6", scrollable && "overflow-y-auto")}>{children}</div>
      </div>
    </div>
  )
}
