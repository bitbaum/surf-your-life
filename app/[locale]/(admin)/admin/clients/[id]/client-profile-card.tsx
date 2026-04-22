import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatEnumValue } from "@/lib/utils"
import type { Profile } from "@/lib/db/schema"
import { getTranslations } from "next-intl/server"

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-slate-700 capitalize text-right">{value}</span>
    </div>
  )
}

interface ClientProfileCardProps {
  profile: Profile | null
}

export async function ClientProfileCard({ profile }: ClientProfileCardProps) {
  const t = await getTranslations("admin.clients")

  return (
    <Card>
      <CardHeader><CardTitle>{t("detail.profileCard")}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {profile ? (
          <>
            <Row label={t("detail.mainConcern")} value={profile.mainConcern ? formatEnumValue(profile.mainConcern) : undefined} />
            <Row label={t("detail.occupation")} value={profile.occupation} />
            <Row label={t("detail.dateOfBirth")} value={profile.dateOfBirth} />
            <Row label={t("detail.exercise")} value={profile.exerciseFrequency ? formatEnumValue(profile.exerciseFrequency) : undefined} />
            <Row label={t("detail.previousTherapy")} value={profile.previousTherapy ? t("detail.yes") : t("detail.no")} />
            <Row label={t("detail.sleepQuality")} value={profile.sleepQuality ? `${profile.sleepQuality}/10` : undefined} />
            <Row label={t("detail.stressLevel")} value={profile.stressLevel ? `${profile.stressLevel}/10` : undefined} />
            <Row label={t("detail.medications")} value={profile.medications} />
            {profile.currentSituation && (
              <div>
                <p className="text-slate-400 text-xs mb-1">{t("detail.currentSituation")}</p>
                <p className="text-slate-700 leading-relaxed">{profile.currentSituation}</p>
              </div>
            )}
            {profile.goals && (
              <div>
                <p className="text-slate-400 text-xs mb-1">{t("detail.goals")}</p>
                <p className="text-slate-700 leading-relaxed">{profile.goals}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-400">{t("detail.noProfile")}</p>
        )}
      </CardContent>
    </Card>
  )
}
