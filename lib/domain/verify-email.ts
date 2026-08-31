import { db } from "@/lib/db";
import { verificationTokens, users } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";

// Server-only: lives apart from lib/domain/auth.ts so client components can
// import the pure auth constants/schemas without dragging pg into the bundle.
export async function verifyEmailToken(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const now = new Date();
  const record = await db.query.verificationTokens.findFirst({
    where: and(eq(verificationTokens.token, token), gt(verificationTokens.expires, now)),
  });

  if (!record) {
    return { success: false, error: "invalid" };
  }

  // Mark user as verified
  await db.update(users).set({ emailVerified: now }).where(eq(users.email, record.identifier));

  // Delete the used token
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, record.identifier),
        eq(verificationTokens.token, token),
      ),
    );

  return { success: true };
}
