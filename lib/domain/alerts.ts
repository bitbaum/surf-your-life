/**
 * Rule-based clinical alert generation.
 * Deterministic safety signals — runs synchronously after each check-in save.
 * Never throws; failures are logged but don't block the check-in response.
 */
import { db } from "@/lib/db"
import { checkIns, clientAlerts, users } from "@/lib/db/schema"
import { eq, desc, gte, and, inArray } from "drizzle-orm"
import {
  ALERT_ENERGY_DECLINE_THRESHOLD,
  ALERT_FATIGUE_SPIKE_THRESHOLD,
  ALERT_STRESS_SPIKE_THRESHOLD,
  ALERT_PEM_CLUSTER_COUNT,
  SEVEN_DAYS_MS,
} from "@/lib/constants"
import { sendEmail } from "@/lib/email"
import { practitionerAlertEmail } from "@/lib/email/templates"
import { SITE_URL } from "@/lib/constants"

const ALERT_ORTHOSTATIC_CLUSTER_COUNT = 2 // ≥2 episodes in 7 days triggers alert

type AlertInsert = typeof clientAlerts.$inferInsert

/**
 * Generate rule-based alerts for a client after a new check-in.
 * Returns immediately — all DB work is fire-and-forget from the caller's POV.
 */
export async function generateAlerts(clientId: string, newCheckInId: string): Promise<void> {
  try {
    // Fetch the last 7 check-ins for context
    const recent = await db.query.checkIns.findMany({
      where: eq(checkIns.userId, clientId),
      orderBy: [desc(checkIns.createdAt)],
      limit: 7,
    })

    if (recent.length === 0) return

    const alerts: AlertInsert[] = []
    const now = new Date()

    // ─── Rule 1: Energy decline ────────────────────────────────────────────────
    // If the last 3 check-ins show a total energy drop of ≥ threshold, flag it.
    if (recent.length >= 3) {
      const [latest, prev1, prev2] = recent
      const drop = prev2.energyLevel - latest.energyLevel
      if (drop >= ALERT_ENERGY_DECLINE_THRESHOLD) {
        const alreadyExists = await db.query.clientAlerts.findFirst({
          where: and(
            eq(clientAlerts.clientId, clientId),
            eq(clientAlerts.type, "energy_decline"),
            eq(clientAlerts.isResolved, false),
            gte(clientAlerts.createdAt, new Date(Date.now() - SEVEN_DAYS_MS))
          ),
        })
        if (!alreadyExists) {
          alerts.push({
            clientId,
            type: "energy_decline",
            severity: drop >= 5 ? "high" : "medium",
            title: "Energy decline detected",
            message: `Energy dropped from ${prev2.energyLevel} to ${latest.energyLevel} over the last 3 check-ins (−${drop} points).`,
            checkInId: newCheckInId,
            createdAt: now,
          })
        }
      }
    }

    // ─── Rule 2: Fatigue spike ─────────────────────────────────────────────────
    const [latestCheckIn] = recent
    if (latestCheckIn.symptomFatigue != null && latestCheckIn.symptomFatigue >= ALERT_FATIGUE_SPIKE_THRESHOLD) {
      const alreadyExists = await db.query.clientAlerts.findFirst({
        where: and(
          eq(clientAlerts.clientId, clientId),
          eq(clientAlerts.type, "fatigue_spike"),
          eq(clientAlerts.isResolved, false),
          gte(clientAlerts.createdAt, new Date(Date.now() - SEVEN_DAYS_MS))
        ),
      })
      if (!alreadyExists) {
        alerts.push({
          clientId,
          type: "fatigue_spike",
          severity: latestCheckIn.symptomFatigue >= 9 ? "high" : "medium",
          title: "High fatigue reported",
          message: `Client reported fatigue ${latestCheckIn.symptomFatigue}/10 today.`,
          checkInId: newCheckInId,
          createdAt: now,
        })
      }
    }

    // ─── Rule 3: Stress spike ──────────────────────────────────────────────────
    if (latestCheckIn.stressLevel != null && latestCheckIn.stressLevel >= ALERT_STRESS_SPIKE_THRESHOLD) {
      const alreadyExists = await db.query.clientAlerts.findFirst({
        where: and(
          eq(clientAlerts.clientId, clientId),
          eq(clientAlerts.type, "stress_spike"),
          eq(clientAlerts.isResolved, false),
          gte(clientAlerts.createdAt, new Date(Date.now() - SEVEN_DAYS_MS))
        ),
      })
      if (!alreadyExists) {
        alerts.push({
          clientId,
          type: "stress_spike",
          severity: latestCheckIn.stressLevel >= 9 ? "high" : "medium",
          title: "High stress reported",
          message: `Client reported stress ${latestCheckIn.stressLevel}/10 today.`,
          checkInId: newCheckInId,
          createdAt: now,
        })
      }
    }

    // ─── Rule 4: PEM cluster ───────────────────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const recentPemCount = recent.filter(
      (ci) => ci.pemFlag && ci.createdAt >= sevenDaysAgo
    ).length

    if (recentPemCount >= ALERT_PEM_CLUSTER_COUNT) {
      const alreadyExists = await db.query.clientAlerts.findFirst({
        where: and(
          eq(clientAlerts.clientId, clientId),
          eq(clientAlerts.type, "pem_cluster"),
          eq(clientAlerts.isResolved, false),
          gte(clientAlerts.createdAt, sevenDaysAgo)
        ),
      })
      if (!alreadyExists) {
        alerts.push({
          clientId,
          type: "pem_cluster",
          severity: "high",
          title: "PEM cluster in last 7 days",
          message: `Client reported ${recentPemCount} PEM/crash episodes in the last 7 days. Consider reviewing activity pacing.`,
          checkInId: newCheckInId,
          createdAt: now,
        })
      }
    }

    // ─── Rule 5: Mood decline ──────────────────────────────────────────────────
    const MOOD_NUM: Record<string, number> = {
      very_low: 0, low: 1, neutral: 2, good: 3, excellent: 4,
    }
    if (recent.length >= 3) {
      const moodValues = recent.slice(0, 3).map((ci) => MOOD_NUM[ci.mood] ?? 2)
      const moodDrop = moodValues[2] - moodValues[0]
      if (moodDrop <= -2) {
        const alreadyExists = await db.query.clientAlerts.findFirst({
          where: and(
            eq(clientAlerts.clientId, clientId),
            eq(clientAlerts.type, "mood_decline"),
            eq(clientAlerts.isResolved, false),
            gte(clientAlerts.createdAt, new Date(Date.now() - SEVEN_DAYS_MS))
          ),
        })
        if (!alreadyExists) {
          alerts.push({
            clientId,
            type: "mood_decline",
            severity: moodDrop <= -3 ? "high" : "medium",
            title: "Mood decline detected",
            message: `Mood has dropped from "${recent[2].mood.replace("_", " ")}" to "${recent[0].mood.replace("_", " ")}" over the last 3 check-ins.`,
            checkInId: newCheckInId,
            createdAt: now,
          })
        }
      }
    }

    // ─── Rule 6: Orthostatic symptom cluster ──────────────────────────────────
    // ≥2 episodes of dizziness on standing in 7 days — possible POTS indicator
    const orthostaticCount = recent.filter(
      (ci) => ci.orthostaticSymptoms && ci.createdAt >= sevenDaysAgo
    ).length

    if (orthostaticCount >= ALERT_ORTHOSTATIC_CLUSTER_COUNT) {
      const alreadyExists = await db.query.clientAlerts.findFirst({
        where: and(
          eq(clientAlerts.clientId, clientId),
          eq(clientAlerts.type, "orthostatic_intolerance"),
          eq(clientAlerts.isResolved, false),
          gte(clientAlerts.createdAt, sevenDaysAgo)
        ),
      })
      if (!alreadyExists) {
        alerts.push({
          clientId,
          type: "orthostatic_intolerance",
          severity: "medium",
          title: "Orthostatic symptoms recurring",
          message: `Client reported dizziness on standing ${orthostaticCount} times in the last 7 days. Consider screening for POTS/orthostatic intolerance.`,
          checkInId: newCheckInId,
          createdAt: now,
        })
      }
    }

    // ─── Rule 7: PEM lag pattern ───────────────────────────────────────────────
    // If today has PEM flagged AND 1-2 days ago was moderate/active activity,
    // this suggests a delayed PEM response — a key Long COVID pacing signal.
    if (latestCheckIn.pemFlag && recent.length >= 2) {
      const prevCheckIns = recent.slice(1, 3) // 1-2 days prior
      const triggerDay = prevCheckIns.find(
        (ci) => ci.activityLevel === "moderate" || ci.activityLevel === "active"
      )
      if (triggerDay) {
        const alreadyExists = await db.query.clientAlerts.findFirst({
          where: and(
            eq(clientAlerts.clientId, clientId),
            eq(clientAlerts.type, "pem_cluster"),
            eq(clientAlerts.isResolved, false),
            gte(clientAlerts.createdAt, new Date(Date.now() - SEVEN_DAYS_MS))
          ),
        })
        if (!alreadyExists) {
          const dayDiff = Math.round(
            (latestCheckIn.createdAt.getTime() - triggerDay.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ) || 1
          alerts.push({
            clientId,
            type: "pem_cluster",
            severity: "high",
            title: "PEM lag detected",
            message: `PEM reported today following ${triggerDay.activityLevel} activity ${dayDiff} day${dayDiff !== 1 ? "s" : ""} ago. This delayed crash pattern is a key Long COVID pacing signal — consider reviewing the client's activity envelope.`,
            checkInId: newCheckInId,
            createdAt: now,
          })
        }
      }
    }

    if (alerts.length > 0) {
      await db.insert(clientAlerts).values(alerts)
    }

    // Send email to all practitioners/admins for high or medium severity alerts
    const highOrMedium = alerts.filter((a) => a.severity === "high" || a.severity === "medium")
    if (highOrMedium.length > 0) {
      const [client, practitioners] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, clientId),
          columns: { name: true, email: true },
        }),
        db.select({ email: users.email }).from(users)
          .where(inArray(users.role, ["admin", "practitioner"])),
      ])

      if (client && practitioners.length > 0) {
        const adminUrl = `${SITE_URL}/admin/clients/${clientId}`
        // Send one email per alert (use only the highest-severity one to avoid spam)
        const topAlert = highOrMedium.sort((a, b) =>
          (a.severity === "high" ? 0 : 1) - (b.severity === "high" ? 0 : 1)
        )[0]

        const html = practitionerAlertEmail({
          clientName: client.name ?? client.email,
          clientEmail: client.email,
          alertTitle: topAlert.title,
          alertMessage: topAlert.message,
          severity: topAlert.severity as "low" | "medium" | "high",
          adminUrl,
        })

        await Promise.all(
          practitioners.map((p) =>
            sendEmail({
              to: p.email,
              subject: `[${topAlert.severity === "high" ? "HIGH" : "Alert"}] ${topAlert.title} — ${client.name ?? client.email}`,
              html,
            }).catch(() => {})
          )
        )
      }
    }
  } catch (err) {
    // Never let alert generation block the check-in response
    console.error("[alerts] Failed to generate alerts for client", clientId, err)
  }
}
