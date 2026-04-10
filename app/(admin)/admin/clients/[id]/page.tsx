import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatEnumValue } from "@/lib/utils"
import Link from "next/link"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [client, clientCheckIns] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, id),
      with: { profile: true },
    }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, id),
      orderBy: [desc(checkIns.createdAt)],
      limit: 20,
    }),
  ])

  if (!client || client.role === "admin") notFound()

  const profile = client.profile

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/clients" className="text-sm text-slate-400 hover:text-slate-600">
          ← Clients
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{client.name ?? "Unnamed"}</h1>
        <p className="text-slate-500">{client.email} · Joined {formatDate(client.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {profile ? (
              <>
                <Row label="Main concern" value={profile.mainConcern ? formatEnumValue(profile.mainConcern) : undefined} />
                <Row label="Occupation" value={profile.occupation} />
                <Row label="Date of birth" value={profile.dateOfBirth} />
                <Row label="Exercise" value={profile.exerciseFrequency} />
                <Row label="Previous therapy" value={profile.previousTherapy ? "Yes" : "No"} />
                <Row label="Sleep quality" value={profile.sleepQuality ? `${profile.sleepQuality}/10` : undefined} />
                <Row label="Stress level" value={profile.stressLevel ? `${profile.stressLevel}/10` : undefined} />
                {profile.currentSituation && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Current situation</p>
                    <p className="text-slate-700">{profile.currentSituation}</p>
                  </div>
                )}
                {profile.goals && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Goals</p>
                    <p className="text-slate-700">{profile.goals}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">No profile filled in yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-ins ({clientCheckIns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientCheckIns.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {clientCheckIns.map((ci) => (
                  <div key={ci.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {formatEnumValue(ci.mood)}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(ci.createdAt)}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>Energy: <strong>{ci.energyLevel}/10</strong></span>
                      {ci.sleepHours && <span>Sleep: <strong>{ci.sleepHours}h</strong></span>}
                    </div>
                    {ci.notes && <p className="text-xs text-slate-500 mt-1 italic">{ci.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No check-ins yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 capitalize text-right">{value}</span>
    </div>
  )
}
