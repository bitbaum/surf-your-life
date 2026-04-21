"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewAssessmentForm } from "./new-assessment-form"

type Props = {
  total: number
}

export function AssessmentsClient({ total }: Props) {
  const t = useTranslations("portal.assessments")
  const [showForm, setShowForm] = useState(total === 0)

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        {t("newAssessment")}
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("newAssessment")}</CardTitle>
      </CardHeader>
      <CardContent>
        <NewAssessmentForm onDone={() => setShowForm(false)} />
      </CardContent>
    </Card>
  )
}
