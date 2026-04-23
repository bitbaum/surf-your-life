/**
 * Rule-based clinical alert generation.
 * Deterministic safety signals — runs synchronously after each check-in save.
 * Never throws; failures are logged but don't block the check-in response.
 */
import { db } from "@/lib/db"
import { checkIns, clientAlerts, users, type AlertType } from "@/lib/db/schema"
import { eq, desc, gte, and, inArray } from "drizzle-orm"
import { STAFF_ROLES, CLIENT_ROLE } from "@/lib/domain/auth"
import {
  ALERT_CHECKIN_WINDOW,
  ALERT_ENERGY_DECLINE_THRESHOLD,
  ALERT_MOOD_DECLINE_WINDOW,
  ALERT_MOOD_DECLINE_THRESHOLD,
  ALERT_FATIGUE_SPIKE_THRESHOLD,
  ALERT_STRESS_SPIKE_THRESHOLD,
  ALERT_PEM_CLUSTER_COUNT,
  ALERT_ORTHOSTATIC_CLUSTER_COUNT,
  ALERT_MISSED_CHECKINS_DAYS,
  SEVEN_DAYS_MS,
  MOOD_SCORE,
  SITE_URL,
  DAY_MS,
} from "@/lib/constants"
import { sendEmail } from "@/lib/email"
import { practitionerAlertEmail } from "@/lib/email/templates"
import { formatEnumValue } from "@/lib/utils"

type AlertInsert = typeof clientAlerts.$inferInsert

// ─── Pure rule evaluation ─────────────────────────────────────────────────────

/** Minimal check-in shape required for alert rule evaluation. */
export type CheckInDataForAlerts = {
  energyLevel: number
  symptomFatigue: number | null
  stressLevel: number | null
  pemFlag: boolean | null
  createdAt: Date
  mood: string
  orthostaticSymptoms: boolean | null
  activityLevel: string | null
}

/** Alert specification produced by a firing rule — no DB IDs, no client context. */
export type AlertSpec = {
  type: AlertType
  severity: "high" | "medium" | "low"
  title: string
  message: string
}

/**
 * Evaluate all 7 clinical alert rules against a set of recent check-ins.
 * Pure function — no DB access, no side effects, deterministic output.
 *
 * @param recent  Up to ALERT_CHECKIN_WINDOW check-ins, newest first
 * @param now     Reference timestamp for 7-day window calculations
 */
export function evaluateAlertRules(
  recent: CheckInDataForAlerts[],
  now: Date = new Date()
): AlertSpec[] {
  if (recent.length === 0) return []

  const alerts: AlertSpec[] = []
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS)
  const [latest] = recent

  // ─── Rule 1: Energy decline ────────────────────────────────────────────────
  if (recent.length >= 3) {
    const [, , prev2] = recent
    const drop = prev2.energyLevel - latest.energyLevel
    if (drop >= ALERT_ENERGY_DECLINE_THRESHOLD) {
      alerts.push({
        type: "energy_decline",
        severity: drop >= 5 ? "high" : "medium",
        title: "Energy decline detected",
        message: `Energy dropped from ${prev2.energyLevel} to ${latest.energyLevel} over the last 3 check-ins (−${drop} points).`,
      })
    }
  }

  // ─── Rule 2: Fatigue spike ─────────────────────────────────────────────────
  if (latest.symptomFatigue != null && latest.symptomFatigue >= ALERT_FATIGUE_SPIKE_THRESHOLD) {
    alerts.push({
      type: "fatigue_spike",
      severity: latest.symptomFatigue >= 9 ? "high" : "medium",
      title: "High fatigue reported",
      message: `Client reported fatigue ${latest.symptomFatigue}/10 today.`,
    })
  }

  // ─── Rule 3: Stress spike ──────────────────────────────────────────────────
  if (latest.stressLevel != null && latest.stressLevel >= ALERT_STRESS_SPIKE_THRESHOLD) {
    alerts.push({
      type: "stress_spike",
      severity: latest.stressLevel >= 9 ? "high" : "medium",
      title: "High stress reported",
      message: `Client reported stress ${latest.stressLevel}/10 today.`,
    })
  }

  // ─── Rule 4: PEM cluster ───────────────────────────────────────────────────
  const recentPemCount = recent.filter((ci) => ci.pemFlag && ci.createdAt >= sevenDaysAgo).length
  if (recentPemCount >= ALERT_PEM_CLUSTER_COUNT) {
    alerts.push({
      type: "pem_cluster",
      severity: "high",
      title: "PEM cluster in last 7 days",
      message: `Client reported ${recentPemCount} PEM/crash episodes in the last 7 days. Consider reviewing activity pacing.`,
    })
  }

  // ─── Rule 5: Mood decline ──────────────────────────────────────────────────
  // recent is newest-first; moodValues[0] = newest, moodValues[2] = oldest.
  // moodDrop = newest_score - oldest_score → negative means mood has fallen.
  if (recent.length >= ALERT_MOOD_DECLINE_WINDOW) {
    const moodValues = recent.slice(0, ALERT_MOOD_DECLINE_WINDOW).map((ci) => MOOD_SCORE[ci.mood] ?? 3)
    const moodDrop = moodValues[0] - moodValues[ALERT_MOOD_DECLINE_WINDOW - 1]
    if (moodDrop <= ALERT_MOOD_DECLINE_THRESHOLD) {
      alerts.push({
        type: "mood_decline",
        severity: moodDrop <= -3 ? "high" : "medium",
        title: "Mood decline detected",
        message: `Mood has dropped from "${formatEnumValue(recent[ALERT_MOOD_DECLINE_WINDOW - 1].mood)}" to "${formatEnumValue(recent[0].mood)}" over the last 3 check-ins.`,
      })
    }
  }

  // ─── Rule 6: Orthostatic symptom cluster ──────────────────────────────────
  const orthostaticCount = recent.filter(
    (ci) => ci.orthostaticSymptoms && ci.createdAt >= sevenDaysAgo
  ).length
  if (orthostaticCount >= ALERT_ORTHOSTATIC_CLUSTER_COUNT) {
    alerts.push({
      type: "orthostatic_intolerance",
      severity: "medium",
      title: "Orthostatic symptoms recurring",
      message: `Client reported dizziness on standing ${orthostaticCount} times in the last 7 days. Consider screening for POTS/orthostatic intolerance.`,
    })
  }

  // ─── Rule 7: PEM lag pattern ───────────────────────────────────────────────
  if (latest.pemFlag && recent.length >= 2) {
    const prevCheckIns = recent.slice(1, 3)
    const triggerDay = prevCheckIns.find(
      (ci) => ci.activityLevel === "moderate" || ci.activityLevel === "active"
    )
    if (triggerDay) {
      const dayDiff = Math.round(
        (latest.createdAt.getTime() - triggerDay.createdAt.getTime()) / DAY_MS
      ) || 1
      alerts.push({
        type: "pem_cluster",
        severity: "high",
        title: "PEM lag detected",
        message: `PEM reported today following ${triggerDay.activityLevel} activity ${dayDiff} day${dayDiff !== 1 ? "s" : ""} ago. This delayed crash pattern is a key Long COVID pacing signal — consider reviewing the client's activity envelope.`,
      })
    }
  }

  return alerts
}

// ─── DB orchestration ─────────────────────────────────────────────────────────

/**
 * Generate rule-based alerts for a client after a new check-in.
 * Returns immediately — all DB work is fire-and-forget from the caller's POV.
 */
export async function generateAlerts(clientId: string, newCheckInId: string): Promise<void> {
  try {
    // Fetch recent check-ins for alert evaluation
    const recent = await db.query.checkIns.findMany({
      where: eq(checkIns.userId, clientId),
      orderBy: [desc(checkIns.createdAt)],
      limit: ALERT_CHECKIN_WINDOW,
    })

    if (recent.length === 0) return

    const now = new Date()
    const candidates = evaluateAlertRules(recent, now)

    // Deduplicate: skip any alert type that already has an open alert in the last 7 days
    const newAlerts: AlertInsert[] = []
    for (const candidate of candidates) {
      const alreadyExists = await db.query.clientAlerts.findFirst({
        where: and(
          eq(clientAlerts.clientId, clientId),
          eq(clientAlerts.type, candidate.type),
          eq(clientAlerts.isResolved, false),
          gte(clientAlerts.createdAt, new Date(now.getTime() - SEVEN_DAYS_MS))
        ),
      })
      if (!alreadyExists) {
        newAlerts.push({
          clientId,
          type: candidate.type,
          severity: candidate.severity,
          title: candidate.title,
          message: candidate.message,
          checkInId: newCheckInId,
          createdAt: now,
        })
      }
    }

    const alerts = newAlerts
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
          .where(inArray(users.role, STAFF_ROLES)),
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

/**
 * Daily cron rule: create a missed_checkins alert for every client who hasn't
 * checked in for ALERT_MISSED_CHECKINS_DAYS days and has no open alert already.
 * Called from the reminders cron so it runs once per day.
 * Returns the number of new alerts created.
 */
export async function generateMissedCheckInAlerts(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - ALERT_MISSED_CHECKINS_DAYS * DAY_MS)

    const clients = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.role, CLIENT_ROLE))

    if (clients.length === 0) return 0

    const newAlerts: AlertInsert[] = []

    for (const client of clients) {
      const lastCheckIn = await db.query.checkIns.findFirst({
        where: eq(checkIns.userId, client.id),
        orderBy: [desc(checkIns.createdAt)],
        columns: { createdAt: true },
      })

      // Checked in recently — nothing to flag
      if (lastCheckIn && lastCheckIn.createdAt >= cutoff) continue

      // Already has an open missed_checkins alert — don't duplicate
      const existing = await db.query.clientAlerts.findFirst({
        where: and(
          eq(clientAlerts.clientId, client.id),
          eq(clientAlerts.type, "missed_checkins"),
          eq(clientAlerts.isResolved, false)
        ),
        columns: { id: true },
      })
      if (existing) continue

      const daysMissed = lastCheckIn
        ? Math.floor((Date.now() - lastCheckIn.createdAt.getTime()) / DAY_MS)
        : null

      newAlerts.push({
        clientId: client.id,
        type: "missed_checkins",
        severity: "medium",
        title: "No check-ins for 5+ days",
        message: daysMissed != null
          ? `Client has not checked in for ${daysMissed} day${daysMissed !== 1 ? "s" : ""}.`
          : "Client has never submitted a check-in.",
        createdAt: new Date(),
      })
    }

    if (newAlerts.length === 0) return 0

    await db.insert(clientAlerts).values(newAlerts)

    // Notify practitioners once for all new missed check-in alerts
    const practitioners = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.role, STAFF_ROLES))

    if (practitioners.length > 0) {
      for (const alert of newAlerts) {
        const client = clients.find((c) => c.id === alert.clientId)!
        const html = practitionerAlertEmail({
          clientName: client.name ?? client.email,
          clientEmail: client.email,
          alertTitle: alert.title,
          alertMessage: alert.message!,
          severity: "medium",
          adminUrl: `${SITE_URL}/admin/clients/${client.id}`,
        })
        await Promise.all(
          practitioners.map((p) =>
            sendEmail({
              to: p.email,
              subject: `[Alert] ${alert.title} — ${client.name ?? client.email}`,
              html,
            }).catch(() => {})
          )
        )
      }
    }

    return newAlerts.length
  } catch (err) {
    console.error("[alerts] Failed to generate missed check-in alerts", err)
    return 0
  }
}
