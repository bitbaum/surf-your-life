/**
 * A person AccountKit created itself (a sign-up, or a first OrangeCat or
 * bitbaum sign-in) gets Surf Your Life's `users` row under the same id, so
 * every Surf Your Life table can reference them. Linking OrangeCat to an
 * existing person records the sub. Idempotent: AccountKit may call this more
 * than once for one person.
 *
 * A password sign-up also gets what Surf Your Life's own registration gave it:
 * a profile row, the welcome mail and the alert to staff. AccountKit sends the
 * address confirmation itself.
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { ORANGECAT_PROVIDER_ID } from "@bitbaum/accountkit/orangecat";
import { db } from "@/lib/db";
import { authUsers } from "@/lib/db/accountkit";
import { profiles, users } from "@/lib/db/schema";
import { STAFF_ROLES } from "@/lib/domain/auth";
import { sendEmail } from "@/lib/email";
import { EMAIL_SUBJECT_WELCOME } from "@/lib/email/subjects";
import { newUserAlertEmail, welcomeEmail } from "@/lib/email/templates";

/** The welcome mail and the staff alert, as registration sent them. Never throws. */
async function greet(email: string): Promise<void> {
  await Promise.all([
    sendEmail({
      to: email,
      subject: EMAIL_SUBJECT_WELCOME,
      html: welcomeEmail({ name: null, email }),
    }),
    (async () => {
      const staff = await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.role, STAFF_ROLES));
      const to = staff.map((s) => s.email).filter(Boolean) as string[];
      if (to.length === 0) return;
      await sendEmail({
        to,
        subject: `New client: ${email}`,
        html: newUserAlertEmail({ name: null, email, createdAt: new Date() }),
      });
    })(),
  ]).catch((error) =>
    console.error("[auth] sign-up mail failed", {
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}

export async function ensureSurfUser(account: {
  userId: string;
  providerId: string;
  accountId: string;
}): Promise<void> {
  const sub = account.providerId === ORANGECAT_PROVIDER_ID ? account.accountId : null;
  const existing = await db.query.users.findFirst({
    where: eq(users.id, account.userId),
    columns: { id: true },
  });
  if (existing) {
    if (sub) {
      await db
        .update(users)
        .set({ orangecatSub: sub })
        .where(and(eq(users.id, account.userId), isNull(users.orangecatSub)));
    }
    return;
  }
  const [shared] = await db
    .select({ email: authUsers.email, name: authUsers.name, verified: authUsers.emailVerified })
    .from(authUsers)
    .where(eq(authUsers.id, account.userId))
    .limit(1);
  if (!shared) return;
  // An address from a provider is never proof (AccountKit gives OIDC people a
  // `.invalid` placeholder), so a new person starts as a client, unverified.
  const inserted = await db
    .insert(users)
    .values({
      id: account.userId,
      email: shared.email,
      name: shared.name || null,
      emailVerified: shared.verified ? new Date() : null,
      orangecatSub: sub,
    })
    .onConflictDoNothing()
    .returning({ id: users.id });
  if (account.providerId === "credential" && inserted.length > 0) {
    await db.insert(profiles).values({ userId: account.userId }).onConflictDoNothing();
    void greet(shared.email);
  }
}
