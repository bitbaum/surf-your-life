import { db } from "@/lib/db"
import { checkIns, users } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { requireStaffAuth } from "@/lib/api"
import { CLIENT_ROLE } from "@/lib/domain/auth"

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return ""
  const s = String(value)
  // Wrap in quotes if value contains comma, newline, or quote
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(csvCell).join(",")
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const client = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.role, CLIENT_ROLE)),
    columns: { id: true, name: true, email: true },
  })
  if (!client) {
    return new Response("Not found", { status: 404 })
  }

  const rows = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.userId, id))
    .orderBy(asc(checkIns.createdAt))

  const header = csvRow([
    "date", "mood", "energy_level", "sleep_hours", "sleep_quality",
    "activity_level", "pem", "pem_severity", "orthostatic_symptoms",
    "fatigue", "brain_fog", "pain", "stress_level",
    "journal", "wins", "challenges", "notes",
    "ai_insight", "practitioner_note",
  ])

  const dataRows = rows.map((ci) =>
    csvRow([
      ci.createdAt.toISOString(),
      ci.mood,
      ci.energyLevel,
      ci.sleepHours,
      ci.sleepQuality,
      ci.activityLevel,
      ci.pemFlag ? "yes" : "no",
      ci.pemSeverity,
      ci.orthostaticSymptoms ? "yes" : "no",
      ci.symptomFatigue,
      ci.symptomBrainFog,
      ci.symptomPain,
      ci.stressLevel,
      ci.journalEntry,
      ci.wins,
      ci.challenges,
      ci.notes,
      ci.aiInsight,
      ci.practitionerNote,
    ])
  )

  const csv = [header, ...dataRows].join("\n")
  const slug = (client.name ?? client.email).replace(/[^a-z0-9]/gi, "-").toLowerCase()
  const filename = `syl-${slug}-check-ins.csv`

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
