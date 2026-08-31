"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  onClose: () => void;
  size?: "md" | "lg";
  scrollable?: boolean;
  children: React.ReactNode;
  closeLabel?: string;
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
          "bg-surface rounded-card shadow-overlay w-full flex flex-col",
          size === "lg" ? "max-w-lg" : "max-w-md",
          scrollable && "max-h-[90vh]",
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border flex-none">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-element hover:bg-surface-muted transition-colors"
            aria-label={closeLabel}
          >
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </div>
        <div className={cn("p-6", scrollable && "overflow-y-auto")}>{children}</div>
      </div>
    </div>
  );
}
