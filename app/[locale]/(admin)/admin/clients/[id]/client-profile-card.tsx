import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const tConcerns = await getTranslations("concerns")

  return (
    <Card>
      <CardHeader><CardTitle>{t("detail.profileCard")}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {profile ? (
          <>
            <Row label={t("detail.mainConcern")} value={profile.mainConcern ? tConcerns(profile.mainConcern as Parameters<typeof tConcerns>[0]) : undefined} />
            <Row label={t("detail.gender")} value={profile.gender} />
            <Row label={t("detail.dateOfBirth")} value={profile.dateOfBirth} />
            <Row label={t("detail.occupation")} value={profile.occupation} />
            <Row label={t("detail.workHoursPerWeek")} value={profile.workHoursPerWeek ? t("detail.hoursPerWeek", { n: profile.workHoursPerWeek }) : undefined} />
            {(profile.heightCm || profile.weightKg) && (
              <Row label={t("detail.height")} value={
                profile.heightCm && profile.weightKg
                  ? t("detail.heightWeight", { h: profile.heightCm, w: profile.weightKg })
                  : profile.heightCm ? `${profile.heightCm} cm` : `${profile.weightKg} kg`
              } />
            )}
            <Row label={t("detail.previousTherapy")} value={profile.previousTherapy ? t("detail.yes") : t("detail.no")} />
            <Row label={t("detail.sleepQuality")} value={profile.sleepQuality ? `${profile.sleepQuality}/10` : undefined} />
            <Row label={t("detail.sleepSchedule")} value={profile.sleepSchedule} />
            <Row label={t("detail.exercise")} value={profile.exerciseFrequency ?? undefined} />
            <Row label={t("detail.stressLevel")} value={profile.stressLevel ? `${profile.stressLevel}/10` : undefined} />
            <Row label={t("detail.socialSupport")} value={profile.socialSupport ? `${profile.socialSupport}/10` : undefined} />
            <Row label={t("detail.alcoholTobacco")} value={profile.alcoholTobacco} />
            <Row label={t("detail.medications")} value={profile.medications} />
            <Row label={t("detail.insuranceProvider")} value={profile.insuranceProvider} />
            {profile.existingDiagnoses && (
              <div>
                <p className="text-slate-400 text-xs mb-1">{t("detail.existingDiagnoses")}</p>
                <p className="text-slate-700 leading-relaxed">{profile.existingDiagnoses}</p>
              </div>
            )}
            {profile.familyHistory && (
              <div>
                <p className="text-slate-400 text-xs mb-1">{t("detail.familyHistory")}</p>
                <p className="text-slate-700 leading-relaxed">{profile.familyHistory}</p>
              </div>
            )}
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
