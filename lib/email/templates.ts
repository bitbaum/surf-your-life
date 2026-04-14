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

type InviteEmailData = { name: string; registerUrl: string }

export function inviteEmail(data: InviteEmailData): string {
  const { name, registerUrl } = data
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
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px;">Personal message from Manu</p>
  </div>
  <p>Hi ${name},</p>
  <p>Thank you for reaching out. I have reviewed your situation and I would like to personally invite you to join the Surf Your Life portal.</p>
  <p>The portal is where we work together — you will be able to track your progress, access your personalised program, and stay in touch with me directly.</p>
  <p>Your first step is to create an account. It only takes a minute:</p>
  <a href="${registerUrl}" class="cta">Create my account</a>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">If you have any questions before registering, simply reply to this email.</p>
  <p style="margin-top:24px;font-size:13px;color:#64748b;">Looking forward to working with you.</p>
  <p style="font-size:13px;color:#64748b;margin-top:4px;"><strong>Manu</strong><br>Surf Your Life · Zollikerstrasse 183, 8008 Zürich</p>
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
