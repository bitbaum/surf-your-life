"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface Props {
  clientId: string
}

export function SessionPrep({ clientId }: Props) {
  const t = useTranslations("admin.clients.sessionPrep")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/session-prep`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSummary(json.data.summary)
      setAiGenerated(json.data.aiGenerated)
    } catch {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {t("title")}
          </CardTitle>
          {!summary && (
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
              {loading ? t("generating") : t("generate")}
            </Button>
          )}
          {summary && (
            <button
              onClick={() => { setSummary(null); setError("") }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {t("refresh")}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!summary && !error && (
          <p className="text-sm text-slate-400">{t("description")}</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {summary && (
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            {!aiGenerated && (
              <p className="text-xs text-slate-400 mt-2 italic">{t("ruleBasedNote")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
