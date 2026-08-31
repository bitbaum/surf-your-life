"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-100">
      {items.map(({ q, a }, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-start justify-between gap-4 py-5 text-left group"
          >
            <span
              className={`text-base font-medium leading-snug transition-colors ${open === i ? "text-teal-700" : "text-slate-900 group-hover:text-teal-700"}`}
            >
              {q}
            </span>
            <ChevronDown
              className={`w-5 h-5 flex-shrink-0 mt-0.5 text-slate-400 transition-transform duration-200 ${open === i ? "rotate-180 text-teal-600" : ""}`}
            />
          </button>
          {open === i && (
            <div className="pb-5 pr-9">
              <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
