import { describe, it, expect, vi } from "vitest";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import {
  ORANGECAT_PROVIDER_ID,
  emailEarnsPromotion,
  isOrangecatEnabled,
  orangecatClient,
  orangecatProfile,
  orangecatProvider,
} from "@/lib/auth/provider";
import {
  placeholderEmail,
  withOrangecatIdentity,
  type OrangecatUserStore,
} from "@/lib/auth/orangecat-identity";

// ─── Provider config ────────────────────────────────────────────────────────
// Each of these was paid for by a debugging cycle in Loki/Heidi. A silent
// revert surfaces as an opaque 400 at the code exchange.

describe("orangecatProvider", () => {
  const provider = orangecatProvider("surf-your-life", "secret");

  it("authenticates at the token endpoint with client_secret_post", () => {
    // Auth.js defaults to client_secret_basic; OrangeCat rejects it with a
    // misleading "client_id is required".
    expect(provider.client.token_endpoint_auth_method).toBe("client_secret_post");
  });

  it("checks PKCE and state", () => {
    expect(provider.checks).toContain("pkce");
    expect(provider.checks).toContain("state");
  });

  it("is OIDC with id 'orangecat' (callback /api/auth/callback/orangecat)", () => {
    expect(provider.type).toBe("oidc");
    expect(provider.id).toBe("orangecat");
  });

  it("asks for identity scopes only", () => {
    expect(provider.authorization.params.scope).toBe("openid profile email");
  });

  it("never links by email", () => {
    expect(provider.allowDangerousEmailAccountLinking).toBe(false);
  });

  it("defaults the issuer to https://orangecat.ch, overridable by env", () => {
    const before = process.env.ORANGECAT_OAUTH_ISSUER;
    delete process.env.ORANGECAT_OAUTH_ISSUER;
    expect(orangecatProvider("a", "b").issuer).toBe("https://orangecat.ch");
    process.env.ORANGECAT_OAUTH_ISSUER = "https://staging.example";
    expect(orangecatProvider("a", "b").issuer).toBe("https://staging.example");
    if (before === undefined) delete process.env.ORANGECAT_OAUTH_ISSUER;
    else process.env.ORANGECAT_OAUTH_ISSUER = before;
  });
});

describe("orangecatClient", () => {
  it("is absent unless both the id and the secret are set", () => {
    expect(orangecatClient({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(
      isOrangecatEnabled({
        ORANGECAT_OAUTH_CLIENT_ID: "surf-your-life",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      orangecatClient({
        ORANGECAT_OAUTH_CLIENT_ID: "surf-your-life",
        ORANGECAT_OAUTH_CLIENT_SECRET: "s",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({ clientId: "surf-your-life", clientSecret: "s" });
  });
});

describe("orangecatProfile", () => {
  it("carries the sub and has NO email key, so Auth.js never looks users up by email", () => {
    const user = orangecatProfile({ sub: "actor-1", email: "Ana@Example.com", name: "Ana" });
    expect("email" in user).toBe(false);
    expect(user.orangecatSub).toBe("actor-1");
    expect(user.contactEmail).toBe("ana@example.com");
  });

  it("refuses a token without a sub", () => {
    expect(() => orangecatProfile({ email: "a@b.ch" })).toThrow();
  });
});

// ─── Identity: keyed on sub, never on email ─────────────────────────────────

const existing: AdapterUser = {
  id: "user-existing",
  email: "ana@example.com",
  emailVerified: new Date("2026-01-01"),
  name: "Ana",
  image: null,
};

function fakeStore(rows: (AdapterUser & { orangecatSub?: string | null })[]) {
  const store: OrangecatUserStore = {
    findBySub: vi.fn(async (sub) => rows.find((r) => r.orangecatSub === sub) ?? null),
    emailTaken: vi.fn(async (email) => rows.some((r) => r.email.toLowerCase() === email)),
    insert: vi.fn(async (data) => {
      const row = { id: `user-${rows.length + 1}`, emailVerified: null, ...data };
      rows.push(row);
      return row;
    }),
    attachSub: vi.fn(async (userId, sub) => {
      const row = rows.find((r) => r.id === userId);
      if (!row || (row.orangecatSub && row.orangecatSub !== sub)) return false;
      row.orangecatSub = sub;
      return true;
    }),
  };
  return store;
}

function fakeBase(): Adapter {
  return {
    getUserByAccount: vi.fn(async () => existing),
    getUserByEmail: vi.fn(async () => existing),
    createUser: vi.fn(async (u: AdapterUser) => u),
    linkAccount: vi.fn(async () => undefined),
  };
}

const ocAccount = (sub: string, userId = ""): AdapterAccount => ({
  provider: ORANGECAT_PROVIDER_ID,
  providerAccountId: sub,
  type: "oidc",
  userId,
});

describe("withOrangecatIdentity", () => {
  it("a new sub whose email belongs to an existing user resolves to NO user", async () => {
    const rows = [{ ...existing, orangecatSub: null }];
    const base = fakeBase();
    const adapter = withOrangecatIdentity(base, fakeStore(rows));

    expect(await adapter.getUserByAccount!(ocAccount("new-sub"))).toBeNull();
    // ...and never consults the base adapter, which would match on accounts/email.
    expect(base.getUserByAccount).not.toHaveBeenCalled();
    expect(base.getUserByEmail).not.toHaveBeenCalled();
  });

  it("a new sub creates a NEW user; a taken email becomes a .invalid placeholder", async () => {
    const rows = [{ ...existing, orangecatSub: null }];
    const store = fakeStore(rows);
    const base = fakeBase();
    const adapter = withOrangecatIdentity(base, store);

    // What Auth.js passes createUser: the profile plus a random id.
    const created = await adapter.createUser!({
      ...orangecatProfile({ sub: "new-sub", email: "ANA@example.com", name: "Mallory" }),
      id: "random-uuid",
      emailVerified: null,
    } as unknown as AdapterUser);

    expect(created.id).not.toBe(existing.id);
    expect(created.email).toBe(placeholderEmail("new-sub"));
    expect(created.email.endsWith("@users.invalid")).toBe(true);
    expect(base.createUser).not.toHaveBeenCalled();

    await adapter.linkAccount!(ocAccount("new-sub", created.id));
    expect(base.linkAccount).not.toHaveBeenCalled(); // no OrangeCat tokens stored
    expect(rows.find((r) => r.id === existing.id)?.orangecatSub).toBeNull();
    expect((await adapter.getUserByAccount!(ocAccount("new-sub")))?.id).toBe(created.id);
  });

  it("a new sub with a free email keeps it as contact data", async () => {
    const adapter = withOrangecatIdentity(fakeBase(), fakeStore([]));
    const created = await adapter.createUser!({
      ...orangecatProfile({ sub: "s2", email: "new@example.com" }),
      id: "x",
      emailVerified: null,
    } as unknown as AdapterUser);
    expect(created.email).toBe("new@example.com");
  });

  it("refuses to move a user onto a different sub", async () => {
    const rows = [{ ...existing, orangecatSub: "sub-a" }];
    const adapter = withOrangecatIdentity(fakeBase(), fakeStore(rows));
    await expect(adapter.linkAccount!(ocAccount("sub-b", existing.id))).rejects.toThrow();
    expect(rows[0].orangecatSub).toBe("sub-a");
  });

  it("leaves Google sign-ins to the base adapter", async () => {
    const base = fakeBase();
    const adapter = withOrangecatIdentity(base, fakeStore([]));
    const google = { provider: "google", providerAccountId: "g-1" };
    expect(await adapter.getUserByAccount!(google)).toBe(existing);
    expect(base.getUserByAccount).toHaveBeenCalledWith(google);
    await adapter.linkAccount!({ ...google, type: "oidc", userId: existing.id });
    expect(base.linkAccount).toHaveBeenCalled();
  });
});

describe("emailEarnsPromotion", () => {
  it("an OrangeCat sign-in never earns ADMIN_EMAILS promotion", () => {
    expect(emailEarnsPromotion("orangecat")).toBe(false);
    expect(emailEarnsPromotion("google")).toBe(true);
    expect(emailEarnsPromotion("credentials")).toBe(true);
  });
});
