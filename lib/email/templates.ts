import type { Service } from "@/lib/db/schema"

// ─── Verification email ───────────────────────────────────────────────────────

type VerificationEmailData = { email: string; verifyUrl: string }

export function verificationEmail(data: VerificationEmailData): string {
  const { verifyUrl } = data
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">Verify your email address</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life</p>
  </div>
  <p>Hello,</p>
  <p>Thank you for registering. Please verify your email address by clicking the button below. This link expires in 24 hours.</p>
  <a href="${verifyUrl}" class="cta">Verify my email</a>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">If you did not create an account, you can safely ignore this email.</p>
  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Password reset ───────────────────────────────────────────────────────────

type PasswordResetEmailData = { resetUrl: string }

export function passwordResetEmail(data: PasswordResetEmailData): string {
  const { resetUrl } = data
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">Reset your password</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life</p>
  </div>
  <p>Hello,</p>
  <p>We received a request to reset your password. Click the button below — the link expires in 1 hour.</p>
  <a href="${resetUrl}" class="cta">Reset my password</a>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Booking request confirmation (to client) ─────────────────────────────────

export type BookingRequestData = {
  clientName: string | null
  serviceName: string
  preferredDate: string | null
  preferredTime: string | null
}

export function bookingRequestEmail(data: BookingRequestData): string {
  const { clientName, serviceName, preferredDate, preferredTime } = data
  const greeting = clientName ? `Hi ${clientName},` : "Hello,"
  const timeLabel = preferredTime ? ` (${preferredTime})` : ""
  const dateBlock = preferredDate
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Preferred date &amp; time</div>
        <div style="font-size:15px;font-weight:600;color:#0f172a;margin-top:2px;">${preferredDate}${timeLabel}</div>
       </div>`
    : ""
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:18px;">Booking request received</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life Portal</p>
  </div>
  <p>${greeting}</p>
  <p>We received your booking request for <strong>${serviceName}</strong>. We'll confirm within 24 hours.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Service</div>
    <div style="font-size:15px;font-weight:600;color:#0f172a;margin-top:2px;">${serviceName}</div>
  </div>
  ${dateBlock}
  <p style="font-size:13px;color:#64748b;margin-top:16px;">If you have any questions, simply reply to this email.</p>
  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Welcome email ────────────────────────────────────────────────────────────

type WelcomeEmailData = { name: string | null; email: string }

export function welcomeEmail(data: WelcomeEmailData): string {
  const { name, email } = data
  const displayName = name ?? email
  const dashboardUrl = `${process.env.AUTH_URL ?? "https://surf-your-life.ch"}/dashboard`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">Welcome to Surf Your Life</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Your program starts here</p>
  </div>

  <p>Hello ${displayName},</p>

  <p>Thank you for registering. You have taken the first step toward reclaiming your health and energy.</p>

  <p><strong>About Surf Your Life</strong></p>
  <p>We are a psychiatry-led clinic in Zürich specialising in burnout recovery, Long COVID reintegration, and midlife reinvention. Our approach is different: we start with the biology — sleep, nervous system regulation, and physical recovery — before moving to psychological and reintegration work. No coaching before the body is ready.</p>

  <p>Your next step is to complete your profile so we can begin tailoring your programme. It takes about 5 minutes and helps us understand your situation before your initial assessment.</p>

  <a href="${dashboardUrl}" class="cta">Go to your dashboard</a>

  <p style="margin-top:24px;font-size:13px;color:#64748b;">If you have any questions, simply reply to this email. We respond within 24 hours.</p>

  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Admin new-user alert ─────────────────────────────────────────────────────

type NewUserAlertData = { name: string | null; email: string; createdAt: Date }

export function newUserAlertEmail(data: NewUserAlertData): string {
  const { name, email, createdAt } = data
  const displayName = name ?? "(no name)"
  const adminUrl = `${process.env.AUTH_URL ?? "https://surf-your-life.ch"}/admin/clients`
  const joinedAt = createdAt.toISOString().replace("T", " ").slice(0, 16) + " UTC"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #1e293b; color: white; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:16px;">New client registered</h1>
  </div>

  <div class="card">
    <div class="label">Name</div>
    <div class="value">${displayName}</div>
  </div>

  <div class="card">
    <div class="label">Email</div>
    <div class="value">${email}</div>
  </div>

  <div class="card">
    <div class="label">Registered at</div>
    <div class="value">${joinedAt}</div>
  </div>

  <a href="${adminUrl}" class="cta">View in admin panel</a>
</body>
</html>
  `.trim()
}

// ─── Booking status ───────────────────────────────────────────────────────────

type BookingStatusData = {
  clientName: string | null
  serviceName: string
  status: "confirmed" | "cancelled"
  preferredDate: string | null
  preferredTime: string | null
}

export function bookingStatusEmail(data: BookingStatusData): string {
  const { clientName, serviceName, status, preferredDate, preferredTime } = data
  const isConfirmed = status === "confirmed"
  const headerBg = isConfirmed ? "#0d9488" : "#64748b"
  const headingText = isConfirmed ? "Your booking has been confirmed" : "Your booking has been cancelled"
  const bodyText = isConfirmed
    ? "Great news — your booking has been confirmed. We look forward to seeing you."
    : "Your booking has been cancelled. If you have any questions, please contact us."
  const timeLabel = preferredTime ? ` (${preferredTime})` : ""
  const greeting = clientName ? `Hi ${clientName},` : "Hello,"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: ${headerBg}; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:18px;">${headingText}</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life Portal</p>
  </div>

  <p>${greeting}</p>
  <p>${bodyText}</p>

  <div class="card">
    <div class="label">Service</div>
    <div class="value">${serviceName}</div>
  </div>

  ${preferredDate ? `<div class="card"><div class="label">Preferred date &amp; time</div><div class="value">${preferredDate}${timeLabel}</div></div>` : ""}

  <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

type NewMessageData = {
  senderName: string | null
  senderEmail: string
  body: string
  threadSubject: string | null
  replyUrl: string
}

export function newMessageEmail(data: NewMessageData): string {
  const { senderName, senderEmail, body, threadSubject, replyUrl } = data
  const displayName = senderName ?? senderEmail
  const subjectLine = threadSubject ?? "No subject"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
  .message-body { font-size: 14px; line-height: 1.6; color: #334155; margin-top: 6px; white-space: pre-wrap; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:18px;">New Message</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life Portal</p>
  </div>

  <p>You have received a new message.</p>

  <div class="card">
    <div class="label">From</div>
    <div class="value">${displayName}</div>
    <div style="font-size:13px;color:#64748b;margin-top:2px;">${senderEmail}</div>
  </div>

  <div class="card">
    <div class="label">Subject</div>
    <div class="value">${subjectLine}</div>
  </div>

  <div class="card">
    <div class="label">Message</div>
    <div class="message-body">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  </div>

  <a href="${replyUrl}" class="cta">Reply to message</a>

  <p style="font-size:12px;color:#94a3b8;margin-top:24px;">You can reply directly from the portal.</p>
</body>
</html>
  `.trim()
}

// ─── Lead invite ─────────────────────────────────────────────────────────────

type InviteEmailData = { name: string; registerUrl: string; practitionerName: string }

export function inviteEmail(data: InviteEmailData): string {
  const { name, registerUrl, practitionerName } = data
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">Your invitation to Surf Your Life</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Personal message from ${practitionerName}</p>
  </div>
  <p>Hi ${name},</p>
  <p>Thank you for reaching out. I have reviewed your situation and I would like to personally invite you to join the Surf Your Life portal.</p>
  <p>The portal is where we work together — you will be able to track your progress, access your personalised program, and stay in touch with me directly.</p>
  <p>Your first step is to create an account. It only takes a minute:</p>
  <a href="${registerUrl}" class="cta">Create my account</a>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">If you have any questions before registering, simply reply to this email.</p>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">Looking forward to working with you.</p>
  <p style="font-size:13px;color:#64748b;margin-top:4px;"><strong>${practitionerName}</strong><br>Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─────────────────────────────────────────────────────────────────────────────

type BookingNotificationData = {
  clientEmail: string
  clientName: string | null
  service: Service
  preferredDate: string | null
  preferredTime: string | null
  notes: string | null
  bookingId: string
}

export function bookingNotificationEmail(data: BookingNotificationData): string {
  const { clientEmail, clientName, service, preferredDate, preferredTime, notes, bookingId } = data
  const displayName = clientName ?? clientEmail
  const timeLabel = preferredTime ? ` (${preferredTime})` : ""

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
  a { color: #0d9488; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:18px;">New Booking Request</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life Portal</p>
  </div>

  <p>A new booking request has been submitted and requires confirmation.</p>

  <div class="card">
    <div class="label">Client</div>
    <div class="value">${displayName}</div>
    <div style="font-size:13px;color:#64748b;margin-top:2px;">${clientEmail}</div>
  </div>

  <div class="card">
    <div class="label">Service</div>
    <div class="value">${service.name}</div>
    ${service.durationMinutes ? `<div style="font-size:13px;color:#64748b;margin-top:2px;">${service.durationMinutes} min</div>` : ""}
  </div>

  <div class="card">
    <div class="label">Preferred date &amp; time</div>
    <div class="value">${preferredDate ?? "Not specified"}${timeLabel}</div>
  </div>

  ${notes ? `<div class="card"><div class="label">Notes from client</div><div style="margin-top:6px;font-size:14px;">${notes}</div></div>` : ""}

  <p style="font-size:13px;color:#64748b;">Booking ID: ${bookingId}</p>

  <p>Log in to the admin panel to manage this booking.</p>
</body>
</html>
  `.trim()
}

// ─── Practitioner note email ──────────────────────────────────────────────────

type PractitionerNoteEmailData = {
  clientName: string
  checkInDate: Date
  note: string
  portalUrl: string
}

export function practitionerNoteEmail(data: PractitionerNoteEmailData): string {
  const { clientName, checkInDate, note, portalUrl } = data
  const dateStr = checkInDate.toLocaleDateString("en-CH", { day: "numeric", month: "long", year: "numeric" })
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .note { background: #f0fdfa; border-left: 3px solid #0d9488; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-style: italic; color: #134e4a; line-height: 1.6; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">A note from your practitioner</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life</p>
  </div>
  <p>Hello ${clientName},</p>
  <p>Your practitioner left a note on your check-in from <strong>${dateStr}</strong>:</p>
  <div class="note">${note.replace(/\n/g, "<br>")}</div>
  <a href="${portalUrl}" class="cta">View in portal</a>
  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Practitioner clinical alert ──────────────────────────────────────────────

export type PractitionerAlertEmailData = {
  clientName: string
  clientEmail: string
  alertTitle: string
  alertMessage: string
  severity: "low" | "medium" | "high"
  adminUrl: string
}

export function practitionerAlertEmail(data: PractitionerAlertEmailData): string {
  const { clientName, clientEmail, alertTitle, alertMessage, severity, adminUrl } = data
  const severityColor = severity === "high" ? "#dc2626" : severity === "medium" ? "#d97706" : "#0d9488"
  const severityBg = severity === "high" ? "#fef2f2" : severity === "medium" ? "#fffbeb" : "#f0fdfa"
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #1e293b; color: white; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; }
  .badge { display: inline-block; background: ${severityBg}; color: ${severityColor}; border: 1px solid ${severityColor}; border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
  .alert-box { background: ${severityBg}; border-left: 4px solid ${severityColor}; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 12px 0; }
  .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:16px;">Clinical alert — ${clientName}</h1>
    <span class="badge" style="margin-top:6px;display:inline-block;">${severityLabel} severity</span>
  </div>

  <div class="card">
    <div class="label">Client</div>
    <div class="value">${clientName}</div>
    <div style="font-size:13px;color:#64748b;margin-top:2px;">${clientEmail}</div>
  </div>

  <div class="alert-box">
    <p style="font-weight:600;margin:0 0 6px;color:${severityColor};">${alertTitle}</p>
    <p style="margin:0;font-size:14px;line-height:1.6;">${alertMessage}</p>
  </div>

  <a href="${adminUrl}" class="cta">View client in admin panel</a>

  <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Practitioner weekly digest ───────────────────────────────────────────────

export type PractitionerDigestClientRow = {
  name: string
  email: string
  checkInCount: number
  avgEnergy: number
  avgMood: string
  pemEpisodes: number
  alertCount: number
  aiNarrative: string | null
}

export type PractitionerWeeklyDigestData = {
  weekStart: string
  weekEnd: string
  clients: PractitionerDigestClientRow[]
  adminUrl: string
}

export function practitionerWeeklyDigestEmail(data: PractitionerWeeklyDigestData): string {
  const { weekStart, weekEnd, clients, adminUrl } = data

  const clientRows = clients.map((c) => {
    const alertBadge = c.alertCount > 0
      ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #dc2626;border-radius:9999px;padding:1px 8px;font-size:11px;font-weight:600;margin-left:6px;">${c.alertCount} alert${c.alertCount > 1 ? "s" : ""}</span>`
      : ""
    const narrative = c.aiNarrative
      ? `<p style="margin:8px 0 0;font-size:13px;color:#475569;font-style:italic;line-height:1.5;">${c.aiNarrative}</p>`
      : ""
    return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-weight:600;color:#0f172a;">${c.name}</span>${alertBadge}
          <div style="font-size:12px;color:#94a3b8;">${c.email}</div>
        </div>
        <div style="display:flex;gap:16px;font-size:13px;color:#475569;">
          <span><strong>${c.checkInCount}/7</strong> check-ins</span>
          <span>Energy <strong>${c.avgEnergy}/10</strong></span>
          <span>Mood <strong>${c.avgMood}</strong></span>
          ${c.pemEpisodes > 0 ? `<span style="color:#dc2626;font-weight:600;">⚠ ${c.pemEpisodes} PEM</span>` : ""}
        </div>
      </div>
      ${narrative}
    </div>`
  }).join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #1e293b; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:18px;">Weekly client overview</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">${weekStart} – ${weekEnd}</p>
  </div>

  <p style="color:#64748b;font-size:14px;">${clients.length} client${clients.length !== 1 ? "s" : ""} checked in this week.</p>

  ${clientRows}

  <a href="${adminUrl}" class="cta">Open admin panel</a>

  <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Daily check-in reminder ──────────────────────────────────────────────────

export type CheckInReminderData = {
  clientName: string | null
  portalUrl: string
  currentStreak: number
}

export function checkInReminderEmail(data: CheckInReminderData): string {
  const { clientName, portalUrl, currentStreak } = data
  const name = clientName ?? "there"
  const streakMsg = currentStreak > 1
    ? `You're on a ${currentStreak}-day streak — keep it going!`
    : "Start your day with a quick check-in."
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">Time for your daily check-in</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Surf Your Life</p>
  </div>
  <p>Hello ${name},</p>
  <p>${streakMsg} Your check-in takes less than 2 minutes and helps your practitioner track your progress.</p>
  <a href="${portalUrl}/check-in" class="cta">Check in now</a>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">To unsubscribe from reminders, update your preferences in the portal.</p>
  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}

// ─── Weekly client report ─────────────────────────────────────────────────────

export type WeeklyReportData = {
  clientName: string | null
  weekStart: string
  weekEnd: string
  checkInCount: number
  avgEnergy: number
  avgMood: string
  pemEpisodes: number
  topWin: string | null
  portalUrl: string
}

export function weeklyReportEmail(data: WeeklyReportData): string {
  const { clientName, weekStart, weekEnd, checkInCount, avgEnergy, avgMood, pemEpisodes, topWin, portalUrl } = data
  const name = clientName ?? "there"
  const pemNote = pemEpisodes > 0
    ? `<li>⚠️ <strong>${pemEpisodes} PEM episode(s)</strong> this week — discuss pacing with your practitioner</li>`
    : ""
  const winNote = topWin
    ? `<div style="margin-top:16px;padding:12px 16px;background:#f0fdf4;border-left:3px solid #0d9488;border-radius:4px;"><p style="margin:0;font-size:14px;color:#065f46;">✓ <strong>Win of the week:</strong> ${topWin}</p></div>`
    : ""
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: #0d9488; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
  .stats { display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 120px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: 700; color: #0d9488; }
  .stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }
  .cta { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
</style></head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:20px;">Your weekly summary</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">${weekStart} – ${weekEnd}</p>
  </div>
  <p>Hello ${name}, here's how your week went:</p>
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${checkInCount}/7</div>
      <div class="stat-label">Check-ins</div>
    </div>
    <div class="stat">
      <div class="stat-value">${avgEnergy}/10</div>
      <div class="stat-label">Avg energy</div>
    </div>
    <div class="stat">
      <div class="stat-value">${avgMood}</div>
      <div class="stat-label">Avg mood</div>
    </div>
  </div>
  <ul style="padding-left:20px;color:#475569;">
    ${checkInCount === 7 ? "<li>🎯 Perfect week — 7/7 check-ins completed!</li>" : ""}
    ${pemNote}
  </ul>
  ${winNote}
  <a href="${portalUrl}/dashboard" class="cta">View full history</a>
  <p style="font-size:12px;color:#94a3b8;margin-top:32px;">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
</body>
</html>
  `.trim()
}
