import { sendMail, isMailConfigured, fromAddress, conventionalFrom } from "@bitbaum/mail-kit";
import { BRAND_NAME } from "@/lib/constants";

type SendOptions = {
  to: string | string[];
  subject: string;
  html: string;
};

/**
 * Transport is @bitbaum/mail-kit — the fleet's one email layer. This module
 * keeps the app's seam: sendEmail throws on failure (all bare callers attach
 * .catch), sendEmailSafe/sendEmailFire report instead of throwing.
 */
export async function sendEmail({ to, subject, html }: SendOptions) {
  if (!isMailConfigured() && process.env.NODE_ENV !== "production") {
    // Dev keeps the console preview so local flows work without a mail account.
    console.log(`[email] To: ${to}\nSubject: ${subject}`);
    return;
  }
  // Production must never silently drop mail: mail-kit returns an honest
  // result, and throwing here is what lets every caller's .catch record it —
  // including API-level failures the old SDK path swallowed.
  const result = await sendMail({
    to,
    subject,
    html,
    from: fromAddress() ?? conventionalFrom(BRAND_NAME),
  });
  if (!result.sent) {
    throw new Error(result.error);
  }
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
