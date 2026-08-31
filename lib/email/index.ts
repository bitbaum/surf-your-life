import { Resend } from "resend";
import { BRAND_NAME } from "@/lib/constants";

// Lazy client — instantiated only when RESEND_API_KEY is present at call time
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

type SendOptions = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendOptions) {
  if (!process.env.RESEND_API_KEY) {
    // Production must never silently drop mail: with no key there is no
    // delivery, so fail loudly and let the caller record it. Dev keeps the
    // console preview so local flows work without a Resend account.
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set — refusing to silently drop email");
    }
    console.log(`[email] To: ${to}\nSubject: ${subject}`);
    return;
  }
  const from = process.env.RESEND_FROM ?? `${BRAND_NAME} <onboarding@resend.dev>`;
  await getResend().emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}

/**
 * Send and report the outcome instead of throwing. Batch senders (crons, alert
 * digests) use this so one bad address cannot abort a run, and so a failure
 * leaves a trace: the scheduler discards the HTTP response body, which makes
 * this console.error the only place a delivery failure can surface in prod.
 */
export async function sendEmailSafe(opts: SendOptions, tag = "email"): Promise<boolean> {
  try {
    await sendEmail(opts);
    return true;
  } catch (err) {
    const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
    console.error(`[${tag}] delivery failed for ${to}:`, err);
    return false;
  }
}

/** Fire-and-forget email: errors are logged but never propagate to the caller. */
export function sendEmailFire(opts: SendOptions, tag = "email"): void {
  void sendEmailSafe(opts, tag);
}
