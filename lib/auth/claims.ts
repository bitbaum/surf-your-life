import { emailEarnsPromotion } from "@bitbaum/accountkit/orangecat";
import { resolveRole, type AppRole } from "@/lib/domain/auth";

/**
 * The role a sign-in leaves a person with. ADMIN_EMAILS may only PROMOTE, and
 * only at a sign-in whose address the product can trust — never for an
 * OrangeCat sign-in (emailEarnsPromotion). resolveRole answers only "admin" or
 * "client", so writing its answer back for everyone demoted every practitioner
 * at their next password sign-in. One rule for both runtimes.
 */
export function roleAfterSignIn(
  provider: string | null | undefined,
  email: string | null | undefined,
  existing: AppRole,
): AppRole {
  return emailEarnsPromotion(provider) && resolveRole(email ?? "") === "admin" ? "admin" : existing;
}
