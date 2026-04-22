"use client"

import { ProgressBar } from "@/components/ui/progress-bar"
import { Check, CheckCircle } from "lucide-react"
import { PROFILE_WIZARD_STEPS } from "@/lib/constants"

interface Props {
  step: number
  totalSteps: number
  pct: number
  saved: boolean
  stepTitles: string[]
  stepsCompleted: boolean[]
}

export function WizardProgress({ step, totalSteps, pct, saved, stepTitles, stepsCompleted }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {step + 1} / {totalSteps}
        </span>
        <div className="flex items-center gap-1.5">
          {saved && <CheckCircle className="w-3.5 h-3.5 text-teal-500" />}
          <span className="text-sm font-bold text-teal-700">{pct}%</span>
        </div>
      </div>
      <ProgressBar value={pct} />
      <div className="flex items-center gap-1 pt-1">
        {PROFILE_WIZARD_STEPS.map((_, i) => {
          const done = stepsCompleted[i]
          const active = i === step
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-teal-500 text-white"
                    : active
                    ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`text-xs hidden sm:block truncate max-w-[60px] text-center ${
                  active ? "text-teal-700 font-medium" : "text-slate-400"
                }`}
              >
                {stepTitles[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
