import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { ORANGECAT_PROVIDER_ID } from "./provider";

/**
 * Keys an OrangeCat sign-in on the OIDC `sub` (OrangeCat's actor id), stored
 * in `users.orangecat_sub` — the single source of truth for that link.
 *
 *  - A `sub` we have not seen resolves to NO user. The provider's profile has
 *    no `email`, so Auth.js never looks the user up by email either: a new sub
 *    always creates a new user, and can never take over an existing one.
 *  - The OrangeCat email is stored as contact data when free. When another
 *    user already has it (users.email is NOT NULL UNIQUE) the new user gets a
 *    `.invalid` placeholder instead (RFC 2606: never deliverable).
 *  - OrangeCat tokens are never stored (no `accounts` row): identity only.
 *
 * Google and credentials go to the base adapter unchanged, so existing
 * Google-linked accounts keep resolving exactly as before.
 */

export interface OrangecatUserStore {
  findBySub(sub: string): Promise<AdapterUser | null>;
  emailTaken(email: string): Promise<boolean>;
  insert(user: {
    orangecatSub: string;
    email: string;
    name: string | null;
    image: string | null;
  }): Promise<AdapterUser>;
  /** Attach a sub to an existing user. False if they already hold a different sub. */
  attachSub(userId: string, sub: string): Promise<boolean>;
}

/** Address stored when the OrangeCat email already belongs to another user. */
export function placeholderEmail(sub: string): string {
  return `orangecat-${sub.replace(/[^a-zA-Z0-9-]/g, "")}@users.invalid`;
}

function stringField(user: AdapterUser, key: "orangecatSub" | "contactEmail"): string | null {
  const value = (user as AdapterUser & Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function withOrangecatIdentity(base: Adapter, store: OrangecatUserStore): Adapter {
  return {
    ...base,

    async getUserByAccount(account: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      if (account.provider === ORANGECAT_PROVIDER_ID) {
        return store.findBySub(account.providerAccountId);
      }
      return base.getUserByAccount ? base.getUserByAccount(account) : null;
    },

    async createUser(user: AdapterUser) {
      const sub = stringField(user, "orangecatSub");
      if (!sub) {
        if (!base.createUser) throw new Error("base adapter cannot create users");
        return base.createUser(user);
      }
      const wanted = stringField(user, "contactEmail");
      const email = wanted && !(await store.emailTaken(wanted)) ? wanted : placeholderEmail(sub);
      return store.insert({
        orangecatSub: sub,
        email,
        name: user.name ?? null,
        image: user.image ?? null,
      });
    },

    async linkAccount(account: AdapterAccount) {
      if (account.provider !== ORANGECAT_PROVIDER_ID) {
        if (base.linkAccount) await base.linkAccount(account);
        return;
      }
      // Runs right after createUser (same sub: a no-op) or for a user who is
      // ALREADY signed in here — never on the strength of an email match.
      const ok = await store.attachSub(account.userId, account.providerAccountId);
      if (!ok) throw new Error("This account is already connected to a different OrangeCat login");
    },
  };
}
