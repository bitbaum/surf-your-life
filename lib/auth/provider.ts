/**
 * "Sign in with OrangeCat" — the OIDC provider config, free of any next-auth
 * import so tests can assert it without a Next runtime.
 *
 * Two settings are load-bearing and were each paid for by a debugging cycle in
 * Loki and Heidi:
 *
 *  - OrangeCat's token endpoint accepts ONLY `client_secret_post`. Auth.js
 *    defaults to `client_secret_basic`, which OrangeCat rejects at the code
 *    exchange with a 400 reading "client_id is required" — pointing at the
 *    wrong problem entirely.
 *  - PKCE (and state) are required even for a confidential client.
 *
 * `orangecatProfile()` carries the OIDC `sub` (OrangeCat's actor id) as
 * `orangecatSub` so the adapter wrapper in ./orangecat-identity.ts can key the
 * user on it, and deliberately carries NO `email`: see orangecatProfile.
 */

export const ORANGECAT_PROVIDER_ID = "orangecat";

/** Where OrangeCat's authorization server lives. */
export function orangecatIssuer(env: NodeJS.ProcessEnv = process.env): string {
  return env.ORANGECAT_OAUTH_ISSUER || "https://orangecat.ch";
}

/**
 * The client pair, or null when unset. Same env names as Heidi and Skif.
 * Null means the provider is ABSENT — not mounted half-configured, which would
 * fail opaquely at the code exchange and show the visitor a dead button.
 */
export function orangecatClient(
  env: NodeJS.ProcessEnv = process.env,
): { clientId: string; clientSecret: string } | null {
  const clientId = env.ORANGECAT_OAUTH_CLIENT_ID;
  const clientSecret = env.ORANGECAT_OAUTH_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isOrangecatEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return orangecatClient(env) !== null;
}

export interface OrangecatClaims {
  sub?: string;
  name?: string | null;
  preferred_username?: string | null;
  email?: string | null;
  picture?: string | null;
}

/**
 * What the provider hands Auth.js as "the user". Deliberately has NO `email`
 * key: for an unknown account Auth.js calls `getUserByEmail(profile.email)` and
 * then either links (takeover — OrangeCat's `email_verified` is untrustworthy
 * while its auth backend auto-confirms) or refuses. Without the key that lookup
 * never runs, so a new sub always becomes a new user. The address rides along
 * as `contactEmail`, profile data only.
 */
export function orangecatProfile(claims: OrangecatClaims) {
  if (!claims.sub) throw new Error("OrangeCat id_token has no sub");
  return {
    id: claims.sub,
    name: claims.name ?? claims.preferred_username ?? null,
    image: claims.picture ?? null,
    orangecatSub: claims.sub,
    contactEmail: claims.email ? claims.email.trim().toLowerCase() : null,
  };
}

export function orangecatProvider(clientId: string, clientSecret: string) {
  return {
    id: ORANGECAT_PROVIDER_ID,
    name: "OrangeCat",
    type: "oidc" as const,
    issuer: orangecatIssuer(),
    clientId,
    clientSecret,
    client: { token_endpoint_auth_method: "client_secret_post" as const },
    checks: ["pkce" as const, "state" as const],
    // Identity only: this app never acts on OrangeCat's behalf.
    authorization: { params: { scope: "openid profile email" } },
    profile: orangecatProfile,
    // Never link an OrangeCat identity to an existing user by email.
    allowDangerousEmailAccountLinking: false,
  };
}

/**
 * Whether a sign-in's email may earn ADMIN_EMAILS promotion. Never for
 * OrangeCat: its email is unverified profile data, so promoting on it would
 * make admin a matter of typing an address into OrangeCat.
 */
export function emailEarnsPromotion(provider: string | undefined): boolean {
  return provider !== ORANGECAT_PROVIDER_ID;
}
