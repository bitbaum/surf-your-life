import { Resend } from "resend"

// Lazy client — instantiated only when RESEND_API_KEY is present at call time
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

type SendOptions = {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendOptions) {
  if (!process.env.RESEND_API_KEY) {
    // In development without key: log to console
    console.log(`[email] To: ${to}\nSubject: ${subject}`)
    return
  }
  await getResend().emails.send({
    from: "Surf Your Life <noreply@surf-your-life.ch>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })
}
