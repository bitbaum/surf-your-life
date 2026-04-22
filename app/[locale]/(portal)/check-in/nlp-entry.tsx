"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Loader2 } from "lucide-react"

export type ParsedFill = {
  mood?: string
  energyLevel?: number | null
  sleepHours?: number | null
  activityLevel?: string
  pemFlag?: boolean | null
  orthostaticSymptoms?: boolean | null
  journalEntry?: string
}

interface Props {
  onFill: (data: ParsedFill) => void
}

export function NlpEntry({ onFill }: Props) {
  const t = useTranslations("portal.checkIn")
  const [text, setText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [hint, setHint] = useState("")

  async function handleParse() {
    if (!text.trim()) return
    setParsing(true)
    setHint("")

    const res = await fetch("/api/check-in/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    const data = await res.json()
    setParsing(false)

    if (!data.success) return

    const filled = Object.keys(data.data).filter(
      (k) => k !== "journalEntry" && data.data[k] != null
    ).length
    setHint(filled > 0 ? t("parseFilledHint", { n: filled }) : t("parseNoMatch"))
    onFill(data.data as ParsedFill)
  }

  return (
    <Card className="border-violet-100 bg-violet-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <CardTitle className="text-base text-violet-900">{t("nlpTitle")}</CardTitle>
        </div>
        <CardDescription className="text-violet-600">{t("nlpDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("nlpPlaceholder")}
          rows={2}
          maxLength={1000}
          className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 resize-none"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleParse}
            disabled={!text.trim() || parsing}
            className="flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900 disabled:opacity-40 transition-colors"
          >
            {parsing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {parsing ? t("nlpParsing") : t("nlpFill")}
          </button>
          {hint && <span className="text-xs text-violet-500">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
